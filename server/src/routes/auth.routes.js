import authController from "../controllers/auth.controller.js";

export default async function authRoutes(fastify) {
    fastify.post("/register", authController.registerUser);
    fastify.post("/login", authController.loginUser);
}
