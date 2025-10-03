import authController from "../controllers/auth.controller.js";

export default async function authRoutes(fastify) {
    fastify.post("/login", authController.loginUser);
    fastify.post("/register", authController.registerUser);
}
