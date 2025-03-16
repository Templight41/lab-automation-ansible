import { Server as ServerIO } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { spawn, IPty } from 'node-pty';
import { writeFile } from '@/lib/tools/writeFile';
import { getAllSystems, getSystemByLab } from '@/lib/db/System';
import { toYaml } from '@/lib/tools/toYaml';
import path from 'path';
import { getPlaybookById } from '@/lib/db/Playbook';
import { getAllCredentials } from '@/lib/db/Credential';
import { Socket } from 'socket.io';
import writePlaybook from '@/lib/tools/writePlaybook';

// Define types for terminal processes
interface TerminalProcess {
    process: IPty;
    socketId: string;
}

interface TerminalSize {
    cols: number;
    rows: number;
}

interface CommandData {
    type?: string;
    lab?: string;
    playbookID?: string;
    command?: string;
    isRawInput?: boolean;
    size?: TerminalSize;
}

// Store active terminal processes
const activeTerminals = new Map<string, TerminalProcess>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Check if socket.io server is already initialized
    if ((res.socket as any).server.io) {
        console.log('Socket is already running');
        res.status(200).end();
        return;
    }

    console.log('Setting up socket.io server');

    try {
        // Create a new instance of Socket.IO server
        const io = new ServerIO((res.socket as any).server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
                allowedHeaders: ['Content-Type'],
                credentials: true,
            },
        });

        // Store the socket.io server instance on the server object
        (res.socket as any).server.io = io;

        // Set up event handlers for socket connections
        io.on('connection', (socket: Socket) => {
            console.log('Client connected:', socket.id);

            // Handle incoming messages
            socket.on('message', async (message: string | CommandData) => {
                try {
                    // Parse the message data if it's a string
                    const data: CommandData = typeof message === 'string' ? JSON.parse(message) : message;
                    // console.log('Message received:', data);

                    // Handle different message types
                    const messageType = data.type || 'command';
                    const playbookID = data.playbookID || '';

                    switch (messageType) {
                        case 'init':
                            // Initialize a new terminal session
                            await initializeTerminal(socket, data);
                            break;
                        
                        case 'resize':
                            // Resize an existing terminal
                            resizeTerminal(playbookID, data.size);
                            break;
                        
                        case 'command':
                            // Execute a command in the terminal
                            executeCommand(socket, data);
                            break;
                        
                        default:
                            // Legacy support for old message format
                            await initializeTerminal(socket, data);
                    }
                } catch (error: unknown) {
                    console.error('Error processing message:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    socket.emit('message', `Error: ${errorMessage}`);
                }
            });

            // Handle client disconnection
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                // Clean up any terminals associated with this socket
                for (const [id, terminal] of activeTerminals.entries()) {
                    if (terminal.socketId === socket.id) {
                        terminal.process.kill();
                        activeTerminals.delete(id);
                        console.log(`Terminated process for ${id}`);
                    }
                }
            });
        });

        res.status(200).end();
    } catch (error) {
        console.error('Error setting up socket server:', error);
        res.status(500).json({ error: 'Failed to initialize socket server' });
    }
}

// Initialize a new terminal session
async function initializeTerminal(socket: Socket, data: CommandData): Promise<void> {
    const { lab = 'all', playbookID = '', size } = data;

    // Create terminal with specified size
    const cols = size?.cols || 80;
    const rows = size?.rows || 24;
    
    // Just initialize a basic shell without running any command
    const ptyProcess = spawn('bash', [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.cwd(),
        env: process.env
    });

    // Store the terminal process
    activeTerminals.set(playbookID, {
        process: ptyProcess,
        socketId: socket.id
    });

    // Handle terminal output
    ptyProcess.onData((data: string) => {
        socket.emit('message', data);
        // console.log('Terminal output:', data);
    });

    // Handle terminal exit
    ptyProcess.onExit(() => {
        // socket.emit('message', '\r\nProcess completed\r\n$ ');
        console.log('Terminal exited');
        activeTerminals.delete(playbookID);
    });
    
    // Send welcome message
    // socket.emit('message', 'Terminal initialized. Ready for commands.\r\n$ ');
}

// Resize an existing terminal
function resizeTerminal(playbookID: string, size?: TerminalSize): void {
    if (!playbookID || !size || !activeTerminals.has(playbookID)) {
        console.warn(`Cannot resize: Terminal ${playbookID} not found or invalid size`);
        return;
    }

    const terminal = activeTerminals.get(playbookID);
    if (terminal && terminal.process) {
        try {
            terminal.process.resize(size.cols, size.rows);
            console.log(`Resized terminal ${playbookID} to ${size.cols}x${size.rows}`);
        } catch (error) {
            console.error(`Error resizing terminal ${playbookID}:`, error);
        }
    }
}

// Execute a command in the terminal
async function executeCommand(socket: Socket, data: CommandData): Promise<void> {
    const { playbookID = '', command = '', isRawInput = false } = data;

    const writeToPlaybook = await writePlaybook(data);
    if ('error' in writeToPlaybook) {
        socket.emit('message', `Error writing playbook: ${writeToPlaybook.error}`);
        return;
    }
    
    if (!playbookID || !activeTerminals.has(playbookID)) {
        // If no active terminal, create a new one first
        // socket.emit('message', `Initializing new terminal session...\r\n`);
        initializeTerminal(socket, data).then(() => {
            // After initialization, execute the command if one was provided
            if (command && activeTerminals.has(playbookID)) {
                const terminal = activeTerminals.get(playbookID);
                if (terminal && terminal.process) {
                    try {
                        // If it's a special command to run the playbook
                        if (command === 'run-playbook') {
                            // Get the inventory and playbook paths
                            const inventoryPath = path.join(process.cwd(), 'inventory.yaml');
                            const playbookPath = path.join(process.cwd(), 'playbook.yaml');
                            
                            // Construct the ansible command
                            const ansibleCommand = `ansible-playbook -i ${inventoryPath} ${playbookPath} -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"'`;
                            
                            // Execute the command without echoing it (the process will echo it)
                            terminal.process.write(`${ansibleCommand}\r`);
                        } else {
                            // Otherwise just send the command as is
                            if (isRawInput) {
                                terminal.process.write(command);
                            } else {
                                terminal.process.write(`${command}\r`);
                            }
                        }
                    } catch (error: unknown) {
                        console.error(`Error sending command to terminal ${playbookID}:`, error);
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        socket.emit('message', `Error: ${errorMessage}\r\n`);
                    }
                }
            }
        }).catch(error => {
            console.error('Error initializing terminal:', error);
            socket.emit('message', `Error initializing terminal: ${error instanceof Error ? error.message : 'Unknown error'}\r\n`);
        });
        return;
    } else {

        
        const terminal = activeTerminals.get(playbookID);
        if (terminal && terminal.process) {
        try {
            // If it's a special command to run the playbook
            if (command === 'run-playbook' && !isRawInput) {
                // Get the inventory and playbook paths
                const inventoryPath = path.join(process.cwd(), 'inventory.yaml');
                const playbookPath = path.join(process.cwd(), 'playbook.yaml');
                
                // Construct the ansible command
                const ansibleCommand = `ansible-playbook -i ${inventoryPath} ${playbookPath} -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"'`;
                
                // Execute the command without echoing it (the process will echo it)
                terminal.process.write(`${ansibleCommand}\r`);
            } else {
                // Otherwise just send the command as is
                if (isRawInput) {
                    terminal.process.write(command);
                } else {
                    terminal.process.write(`${command}\r`);
                }
            }
        } catch (error: unknown) {
            console.error(`Error sending command to terminal ${playbookID}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                socket.emit('message', `Error: ${errorMessage}\r\n`);
            }
        }
    }
} 