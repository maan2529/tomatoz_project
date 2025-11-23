import env from "./config/index.js"
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import app from "./app/index.js";

const fastify = Fastify({
  logger: true
});

fastify.register(cookie, {
  secret: "nice_pic",
  parseOptions: {}
});

const startServer = async () => {
  try {
    console.log('[SERVER] 🔧 Registering routes...');
    app(fastify);
    console.log('[SERVER] ⏳ Waiting for Fastify to be ready...');
    await fastify.ready();
    console.log('[SERVER] 🎧 Starting to listen on port', env.PORT);
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error('[SERVER] ❌ Fatal error:', err.message);
    console.error('[SERVER] 📚 Stack:', err.stack);
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();