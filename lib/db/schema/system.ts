import mongoose from 'mongoose';

const systemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    lab: {
        type: String,
        required: true
    },
});


export default mongoose.models.System || mongoose.model('System', systemSchema);

export type System = mongoose.InferSchemaType<typeof systemSchema>;