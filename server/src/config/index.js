import dotenv from 'dotenv'

dotenv.config();

export default Object.freeze({
    PORT: process.env.PORT || 8080,
    MONGODB_URL: process.env.MONGODB_URL || "mongodb://localhost:27017/oratos",
    JWT_SECRET: process.env.JWT_SECRET || "your-secret",

    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    NODE_ENV: process.env.NODE_ENV,
    DEFAULT_USER_ID: process.env.DEFAULT_USER_ID,

    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || "24d",
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || "2d",
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
})