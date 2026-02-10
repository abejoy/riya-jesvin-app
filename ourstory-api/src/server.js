import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifyCookie from "@fastify/cookie";
import dotenv from "dotenv";
import { initializeDatabase } from "./db/init.js";
import { healthRoutes } from "./routes/health.js";
import { memoryRoutes } from "./routes/memories.js";
import { valentineRoutes } from "./routes/valentine.js";
import { authRoutes } from "./routes/auth.js";
import { uploadRoutes } from "./routes/uploads.js";

dotenv.config();

const fastify = Fastify({
  logger: true,
  bodyLimit: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
});

// Register plugins
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || "your-secret-key",
  sign: {
    expiresIn: "7d",
  },
  cookie: {
    cookieName: "token",
    signed: false,
  },
});

fastify.register(fastifyCookie);

fastify.register(fastifyCors, {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  },
});

// Initialize database
await initializeDatabase();

// Register routes
fastify.register(healthRoutes, { prefix: "/api" });
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(memoryRoutes, { prefix: "/api/memories" });
fastify.register(valentineRoutes, { prefix: "/api/valentine" });
fastify.register(uploadRoutes, { prefix: "/uploads" });

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`Server listening on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

export default fastify;
