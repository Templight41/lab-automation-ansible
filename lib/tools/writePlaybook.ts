import path from 'path';
import { writeFile } from './writeFile';
import { toYaml } from './toYaml';
import { getAllSystems, getSystemByLab } from '../db/System';
import { getAllCredentials } from '../db/Credential';
import { getPlaybookById } from '../db/Playbook';


interface CommandData {
    lab?: string;
    playbookID?: string;
}

export default async function writePlaybook(data: CommandData) {
    const { lab = 'all', playbookID = '' } = data;

    if (playbookID == '') {
        return { error: 'Playbook ID is required' };
    }
    // Get systems for the lab
    let systems: any[] | { error: string } = [];
    if (lab === 'all') {
        systems = await getAllSystems();
    } else {
        systems = await getSystemByLab(lab);
    }

    if ('error' in systems) {
        return { error: systems.error };
    }

    // Get credentials
    const credentials = await getAllCredentials();
    if ('error' in credentials) {
        return { error: credentials.error };
    }

    // Create inventory file
    const inventory = toYaml(systems, credentials);
    const inventoryPath = path.join(process.cwd(), 'inventory.yaml');
    if (!writeFile(inventoryPath, inventory)) {
        return { error: 'Failed to write inventory file' };
    }

    // Get playbook
    const playbook = await getPlaybookById(playbookID);
    if ('error' in playbook) {
        return { error: playbook.error };
    }

    // Create playbook file
    const playbookPath = path.join(process.cwd(), 'playbook.yaml');
    if (!writeFile(playbookPath, playbook.content)) {
        return { error: 'Failed to write playbook file' };
    }

    return { success: true };

}