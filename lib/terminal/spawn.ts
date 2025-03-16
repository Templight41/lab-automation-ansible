import { spawn } from 'node-pty';

interface TerminalOptions {
    cols?: number;
    rows?: number;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}

export const spawnTerminal = (command: string, options: TerminalOptions = {}) => {
    const {
        cols = 80,
        rows = 24,
        cwd = process.cwd(),
        env = process.env
    } = options;

    return spawn('bash', ['-c', command.toString()], {
        name: 'xterm-color',
        cols,
        rows,
        cwd,
        env
    });
};