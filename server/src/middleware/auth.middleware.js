import env from "../config/index.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, reply) => {
    try {
        const accessToken = req.cookies?.accessToken || "";
        const refreshToken = req.cookies?.refreshToken || "";

        if (!accessToken && !refreshToken) {
            return reply.code(401).send({
                success: false,
                message: "No tokens provided, unauthorized",
            });
        }

        // Verify access token first
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
                req.user = decoded;
                return; // valid access token, proceed
            } catch (err) {
                if (err.name !== "TokenExpiredError" && err.name !== "JsonWebTokenError") {
                    return reply.code(401).send({
                        success: false,
                        message: "Invalid access token",
                    });
                }
                // If expired, we continue to check refresh token
            }
        }

        // If we reach here, access token is missing or expired
        if (!refreshToken) {
            return reply.code(401).send({
                success: false,
                message: "Refresh token missing, please login",
            });
        }

        // Verify refresh token
        try {
            const decodedRefresh = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);

            // Generate new access token
            const newAccessToken = jwt.sign(
                { _id: decodedRefresh._id, email: decodedRefresh.email, role: decodedRefresh.role },
                env.ACCESS_TOKEN_SECRET,
                { expiresIn: env.ACCESS_TOKEN_EXPIRY || "15m" }
            );

            // Set new access token in cookie
            reply.setCookie("accessToken", newAccessToken, {
                httpOnly: true,
                sameSite: "strict",
                secure: env.NODE_ENV === "production",
                path: "/",
                maxAge: 60 * 15, // 15 minutes
            });

            req.user = decodedRefresh; // attach user from refresh token
        } catch (refreshErr) {
            return reply.code(401).send({
                success: false,
                message:
                    refreshErr.name === "TokenExpiredError"
                        ? "Refresh token expired, please login"
                        : "Invalid refresh token",
            });
        }
    } catch (error) {
        return reply.code(500).send({ success: false, message: error.message });
    }
};