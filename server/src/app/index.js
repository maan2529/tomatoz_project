import { connectDB } from "../db/mongo.js";
import authRoutes from "../routes/auth.routes.js";
import userRoutes from "../routes/user.routes.js";
import pipelineRoutes from "../routes/pipeline.route.js";

export default function app(fastify) {
    connectDB();

    fastify.register(authRoutes, { prefix: "/api/auth" });

    fastify.register(userRoutes, { prefix: "/api/users" });
    fastify.register(pipelineRoutes, { prefix: "/api/pipeline" });
}
