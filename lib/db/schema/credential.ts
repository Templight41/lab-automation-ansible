import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
    lab: String,
    username: String,
    password: String
});


export default mongoose.models.Credential || mongoose.model('Credential', credentialSchema);

export type Credential = mongoose.InferSchemaType<typeof credentialSchema>;