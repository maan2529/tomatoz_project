import jwt from "jsonwebtoken";
import env from "../config/index.js";
import userModel from "../models/user.model.js";

export const authMiddleware = async (req, reply) => {
    try {
        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            return reply.code(401).send({
                success: false,
                message: "No tokens provided, unauthorized",
            });
        }

        // ✅ Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return reply.code(401).send({
                    success: false,
                    message: "Access token expired",
                });
            }
            if (err.name === "JsonWebTokenError") {
                return reply.code(401).send({
                    success: false,
                    message: "Invalid access token",
                });
            }
            console.error("JWT verification error:", err);
            return reply.code(401).send({
                success: false,
                message: "Unauthorized",
            });
        }

        // ✅ Check if user exists in DB
        const user = await userModel.findById(decoded._id);
        if (!user) {
            return reply.code(401).send({
                success: false,
                message: "Unauthenticated user",
            });
        }
        
        // ✅ Attach user to request object
        req.user = user;
        console.log(req.user)
    } catch (error) {
        console.error("Auth middleware error:", error);
        return reply.code(500).send({
            success: false,
            message: error.message || "Internal server error",
        });
    }
};
