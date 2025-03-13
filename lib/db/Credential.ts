import Credential, { Credential as CredentialType } from './schema/credential';
import { connectDB, disconnectDB } from './DBConnection';

export async function getAllCredentials() {
    try {
        await connectDB();
        const credentials = await Credential.find();
        return credentials;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credentials' };
    } finally {
        await disconnectDB();
    }
}

export async function getCredentialById(id: string) {
    try {
        await connectDB();
        const credential = await Credential.findOne({ id });
        if (!credential) {
            return { error: 'Credential not found' };
        }
        return credential;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credential' };
    } finally {
        await disconnectDB();
    }
}

export async function getCredentialByUsername(username: string) {
    try {
        await connectDB();
        const credential = await Credential.findOne({ username });
        if (!credential) {
            return { error: 'Credential not found' };
        }
        return credential;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credential' };
    } finally {
        await disconnectDB();
    }
}

export async function createCredential(credential: CredentialType) {
    try {
        await connectDB();
        const newCredential = await Credential.create(credential);
        return newCredential;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create credential' };
    } finally {
        await disconnectDB();
    }
}

export async function updateCredential(credential: CredentialType) {
    try {
        await connectDB();
        const { lab } = credential;
        const updatedCredential = await Credential.findOneAndUpdate({ lab }, credential, { new: true });
        if (!updatedCredential) {
            throw new Error('Failed to update credential');
        }
        return updatedCredential;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to update credential' };
    } finally {
        await disconnectDB();
    }
}

export async function deleteCredential(lab: string) {
    try {
        await connectDB();
        const deletedCredential = await Credential.findOneAndDelete({ lab });
        if (!deletedCredential) {
            return { error: 'Credential not found' };
        }
        return {
            message: 'Credential deleted successfully', deletedCredential: {
                lab: deletedCredential.lab,
                username: deletedCredential.username,
            }
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to delete credential' };
    } finally {
        await disconnectDB();
    }
}

export async function deleteCredentialByUsername(username: string) {
    try {
        await connectDB();
        const deletedCredential = await Credential.findOneAndDelete({ username });
        if (!deletedCredential) {
            return { error: 'Credential not found' };
        }
        return {
            message: 'Credential deleted successfully', deletedCredential: {
                id: deletedCredential.id,
                username: deletedCredential.username,
            }
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to delete credential' };
    } finally {
        await disconnectDB();
    }
}

export default {
    getAllCredentials,
    getCredentialById,
    getCredentialByUsername,
    createCredential,
    updateCredential,
    deleteCredential,
    deleteCredentialByUsername
};