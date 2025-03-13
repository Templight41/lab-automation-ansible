import fs from 'fs';

export const writeFile = (path: string, content: string) => {
    try {
        fs.writeFileSync(path, content);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

