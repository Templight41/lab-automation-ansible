import mongoose from 'mongoose';

const playbookSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Playbook || mongoose.model('Playbook', playbookSchema);

export type Playbook = mongoose.InferSchemaType<typeof playbookSchema>;