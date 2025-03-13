import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
    lab: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: Object,
        required: true,
        iv: String,
        encryptedData: String
    }
});


export default mongoose.models.Credential || mongoose.model('Credential', credentialSchema);

export type Credential = mongoose.InferSchemaType<typeof credentialSchema>;