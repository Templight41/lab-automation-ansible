import Playbook from './schema/playbook';
import { connectDB, disconnectDB } from './DBConnection';
import { Playbook as PlaybookType } from './schema/playbook';
import { v4 as uuidv4 } from 'uuid';

export async function getAllPlaybooks() {
    try {
        await connectDB();
        const playbooks = await Playbook.find();
        if(!playbooks) {
            throw new Error('Failed to fetch playbooks');
        }
        return playbooks;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch playbooks' };
    } finally {
        // await disconnectDB();
    }
}

export async function getPlaybookById(id: string) {
    try {
        await connectDB();
        const playbook = await Playbook.findOne({ id });
        if(!playbook) {
            return { error: 'Playbook not found' };
        }
        return playbook;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch playbook' };
    } finally {
        // await disconnectDB();
    }
}

export async function createPlaybook(playbook: PlaybookType) {
    try {
        await connectDB();
        
        // Check if playbook with this ID already exists
        const existingPlaybook = await Playbook.findOne({ id: playbook.id });
        if(existingPlaybook) {
            return { error: 'Playbook with this ID already exists' };
        }
        
        // Add createdAt timestamp if not provided
        if (!playbook.createdAt) {
            playbook.createdAt = new Date();
        }
        
        const newPlaybook = await Playbook.create({...playbook, id: uuidv4()});
        if(!newPlaybook) {
            return { error: 'Failed to create playbook' };
        }
        return newPlaybook;
    } catch (error) {
        console.error('Error creating playbook:', error);
        return { error: 'Failed to create playbook' };
    } finally {
        // await disconnectDB();
    }
}

export async function updatePlaybook(playbook: PlaybookType) {
    try {
        await connectDB();
        const { id } = playbook;
        const updatedPlaybook = await Playbook.findOneAndUpdate({ id }, playbook, { new: true });
        if(!updatedPlaybook) {
            return { error: 'Failed to update playbook' };
        }
        return updatedPlaybook;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to update playbook' };
    } finally {
        // await disconnectDB();
    }
}

export async function deletePlaybook(id: string) {
    try {
        await connectDB();
        await Playbook.findOneAndDelete({ id });
        return { message: 'Playbook deleted successfully' };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to delete playbook' };
    } finally {
        // await disconnectDB();
    }
}

export default {
    getAllPlaybooks,
    getPlaybookById,
    createPlaybook,
    updatePlaybook,
    deletePlaybook
}