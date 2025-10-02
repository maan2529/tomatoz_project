import mongoose from 'mongoose'
import env from '../config/index.js'

export const connectDB = async () => {
    try {
        await mongoose.connect(env.MONGODB_URL);
        console.log("✅ mongodb connected");
        
    } catch (error) {
        throw new Error(error)
    }
}