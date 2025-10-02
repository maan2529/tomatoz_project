import { connectDB } from "../db/mongo.js";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";

export default function app(fastify) {
    // connect MongoDB
    connectDB();

    // register routes
    fastify.register(authRoutes, { prefix: "/api/auth" });
    fastify.register(userRoutes, { prefix: "/api/users" });
}
