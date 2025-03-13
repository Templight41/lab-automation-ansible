import { Server as ServerIO } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
// import { spawn } from 'child_process';
import { exec } from 'node:child_process';
import { spawn } from 'node-pty';
import { spawnTerminal } from '@/lib/terminal/spawn';
import { writeFile } from '@/lib/tools/writeFile';
import { getAllSystems, getSystemByLab } from '@/lib/db/System';
import { toYaml } from '@/lib/tools/toYaml';
import path from 'path';
import { getPlaybookById } from '@/lib/db/Playbook';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // Check if socket.io server is already initialized
    if ((res.socket as any).server.io) {
        console.log('Socket is already running');
        res.end();
        return;
    }


    console.log('Setting up socket.io server');

    // Create a new instance of Socket.IO server
    const io = new ServerIO((res.socket as any).server, {
        path: '/api/socket',
        addTrailingSlash: false,
    });

    // Store the socket.io server instance on the server object
    (res.socket as any).server.io = io;



    // Set up event handlers for socket connections
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Handle incoming messages
        socket.on('message', async (data) => {
            console.log('Message received:', data);
            // Broadcast the message to all clients
            // io.emit('message', data);

            const { lab, playbookID } = JSON.parse(data);
            let systems: any[] | { error: string } = [];
            if (lab === 'all') {
                systems = await getAllSystems();
            } else {
                systems = await getSystemByLab(lab);
            }

            if ('error' in systems) {
                io.emit('message', systems.error);
                return;
            }

            const inventory = toYaml(systems);

            const inventoryPath = path.join(process.cwd(), 'inventory.yaml');
            if (!writeFile(inventoryPath, inventory)) {
                io.emit('message', 'Failed to write inventory file');
                return;
            }

            const playbook = await getPlaybookById(playbookID);
            if ('error' in playbook) {
                io.emit('message', playbook.error);
                return;
            }

            const playbookPath = path.join(process.cwd(), 'playbook.yaml');
            if (!writeFile(playbookPath, playbook.content)) {
                io.emit('message', 'Failed to write playbook file');
                return;
            }

            const command = `ansible-playbook -i ${inventoryPath} ${playbookPath} -e 'ansible_ssh_common_args="-o StrictHostKeyChecking=no"'`;
            io.emit('message', command);
            
            const ptyProcess = spawnTerminal(command);

            ptyProcess.onData((data: string) => {
                console.log('ls stdout', data.toString());
                io.emit('message', data.toString());
            });
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    res.end();
} 