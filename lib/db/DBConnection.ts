import mongoose from 'mongoose';

export async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI as string);
}

export async function disconnectDB() {
    await mongoose.disconnect();
}

export default {
    connectDB,
    disconnectDB
}