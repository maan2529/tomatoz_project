import env from "../config/index.js"
import jwt from "jsonwebtoken";


export const authMiddleware = async (req, reply) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return reply.code(401).send({ message: "No token, unauthorized" });

        const decoded = jwt.verify(token, env.JWT_SECRET);
        req.user = decoded; // attach user info to request
    } catch (error) {
        reply.code(401).send({ message: "Invalid or expired token" });
    }
};
