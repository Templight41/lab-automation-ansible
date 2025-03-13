import { spawn } from 'node-pty';

export const spawnTerminal = (command: string) => {
    return spawn('bash', ['-c', command.toString()], {
        name: 'xterm-color',
        // cols: 80,
        // rows: 30,
        cwd: process.cwd(),
        env: process.env
    });
};