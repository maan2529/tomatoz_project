import env from "./config/index.js"
import Fastify from "fastify";
import app from "./app/index.js";


const fastify = Fastify({
  logger: true, // good for production debugging
});

// register main app logic
app(fastify);

// start server
const startServer = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

startServer();
