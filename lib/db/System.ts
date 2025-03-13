import System from './schema/system';
import { System as SystemType } from './schema/system';
import { connectDB, disconnectDB } from './DBConnection';

export async function getAllSystems() {
    try {
        await connectDB();
        const systems = await System.find();
        return systems.map((system) => ({
            id: system.id,
            lab: system.lab,
            address: system.address
        }));
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch systems' };
    } finally {
        await disconnectDB();
    }
}

export async function getSystemById(id: string) {
    try {
        await connectDB();
        const system = await System.findOne({ id });
        return {
            id: system.id,
            lab: system.lab,
            address: system.address
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch system' };
    } finally {
        await disconnectDB();
    }
}

export async function getSystemByLab(lab: string) {
    try {
        await connectDB();
        const systems = await System.find({ lab });
        return systems.map((system) => ({
            id: system.id,
            lab: system.lab,
            address: system.address
        }));
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch systems' };
    } finally {
        await disconnectDB();
    }
}

export async function getSystemByAddress(address: string) {
    try {
        await connectDB();
        const system = await System.findOne({ address });
        return {
            id: system.id,
            lab: system.lab,
            address: system.address
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch systems' };
    } finally {
        await disconnectDB();
    }
}   

export async function createSystem(system: SystemType) {
    try {
        await connectDB();
        const newSystem = await System.create(system);
        return {
            id: newSystem.id,
            lab: newSystem.lab,
            address: newSystem.address
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create system' };
    } finally {
        await disconnectDB();
    }
}

export async function updateSystem(system: SystemType) {
    try {
        await connectDB();
        const updatedSystem = await System.findOneAndUpdate({ id: system.id }, system, { new: true });
        if (!updatedSystem) {
            const newSystem = await createSystem(system);
            return newSystem;
        }
        return {
            id: updatedSystem.id,
            lab: updatedSystem.lab,
            address: updatedSystem.address
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to update system' };
    } finally {
        await disconnectDB();
    }
}

export async function deleteSystem(id: string) {
    try {
        await connectDB();
        const deletedSystem = await System.findOneAndDelete({ id });
        if (!deletedSystem) {
            return { error: 'System not found' };
        }
        return { message: 'System deleted successfully', deletedSystem: {
            id: deletedSystem.id,
            lab: deletedSystem.lab,
            address: deletedSystem.address
        } };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to delete system' };
    } finally {
        await disconnectDB();
    }
}

export default {
    getAllSystems,
    getSystemById,
    getSystemByLab,
    getSystemByAddress,
    createSystem,
    updateSystem,
    deleteSystem
}