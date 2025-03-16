import Credential, { Credential as CredentialType } from './schema/credential';
import { connectDB, disconnectDB } from './DBConnection';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '../tools/encryption';

export async function getAllCredentials() {
    try {
        await connectDB();
        const credentials = await Credential.find();
        const decryptedCredentials = credentials.map(credential => {
            const decryptedPassword = decrypt(credential.password.encryptedData, credential.password.iv);
            return { id: credential.id, lab: credential.lab, username: credential.username, password: decryptedPassword };
        });
        return decryptedCredentials;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credentials' };
    } finally {
        // await disconnectDB();
    }
}

export async function getCredentialByLab(lab: string) {
    try {
        await connectDB();
        const credential = await Credential.findOne({ lab });
        if (!credential) {
            return { error: 'Credential not found' };
        }
        const decryptedPassword = decrypt(credential.password.encryptedData, credential.password.iv);
        return { id: credential.id, lab: credential.lab, username: credential.username, password: decryptedPassword };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credential' };
    } finally {
        // await disconnectDB();
    }
}

export async function getCredentialByUsername(username: string) {
    try {
        await connectDB();
        const credential = await Credential.findOne({ username });
        if (!credential) {
            return { error: 'Credential not found' };
        }
        const decryptedPassword = decrypt(credential.password.encryptedData, credential.password.iv);
        return { id: credential.id, lab: credential.lab, username: credential.username, password: decryptedPassword };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch credential' };
    } finally {
        // await disconnectDB();
    }
}

export async function createCredential(credential: CredentialType) {
    try {
        await connectDB();
        const { lab, password } = credential;

        const existingCredential = await Credential.findOne({ lab });

        if (existingCredential) {
            return { error: 'Credential already exists' };
        }
        if (!password) {
            return { error: 'Password is required' };
        }
        const encryptedPassword = encrypt(password);
        const newCredential = await Credential.create({ ...credential, password: encryptedPassword, id: uuidv4() });
        return { id: newCredential.id, lab: newCredential.lab, username: newCredential.username, password: encryptedPassword };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to create credential' };
    } finally {
        // await disconnectDB();
    }
}

export async function updateCredential(credential: CredentialType) {
    try {
        await connectDB();
        const { lab, password } = credential;
        if (!password) {
            return { error: 'Password is required' };
        }

        const existingCredential = await Credential.findOne({ lab });
        if (!existingCredential) {
            return { error: 'Credential not found' };
        }

        const encryptedPassword = encrypt(password);
        const updatedCredential = await Credential.findOneAndUpdate({ lab }, { ...credential, password: encryptedPassword }, { new: true });
        if (!updatedCredential) {
            throw new Error('Failed to update credential');
        }
        const decryptedPassword = decrypt(updatedCredential.password.encryptedData, updatedCredential.password.iv);
        return { id: updatedCredential.id, lab: updatedCredential.lab, username: updatedCredential.username, password: decryptedPassword };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to update credential' };
    } finally {
        // await disconnectDB();
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
                id: deletedCredential.id,
                lab: deletedCredential.lab,
                username: deletedCredential.username,
            }
        };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to delete credential' };
    } finally {
        // await disconnectDB();
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
        // await disconnectDB();
    }
}

export default {
    getAllCredentials,
    getCredentialByLab,
    getCredentialByUsername,
    createCredential,
    updateCredential,
    deleteCredential,
    deleteCredentialByUsername
};