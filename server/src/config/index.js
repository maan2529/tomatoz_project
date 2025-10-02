import dotenv from 'dotenv'

dotenv.config();

export default Object.freeze({
    PORT: process.env.PORT || 8080,
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/oratos",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret"
})