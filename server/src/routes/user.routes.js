import { authMiddleware } from "../middleware/auth.middleware.js";
import userController from "../controllers/user.controller.js";

export default async function userRoutes(fastify) {
    fastify.addHook("preHandler", authMiddleware);

    fastify.get("/", userController.getAllUsers);

}
