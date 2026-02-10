import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../db/init.js";

const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = `login_${ip}`;

  if (RATE_LIMIT_MAP.has(key)) {
    const { count, timestamp } = RATE_LIMIT_MAP.get(key);
    if (now - timestamp < RATE_LIMIT_WINDOW) {
      if (count >= MAX_ATTEMPTS) {
        return false;
      }
      RATE_LIMIT_MAP.set(key, { count: count + 1, timestamp });
    } else {
      RATE_LIMIT_MAP.set(key, { count: 1, timestamp: now });
    }
  } else {
    RATE_LIMIT_MAP.set(key, { count: 1, timestamp: now });
  }

  return true;
}

export async function initializeAdmin() {
  const db = await getDatabase();

  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";

  // Check if admin user exists
  const existingAdmin = await db.get(
    "SELECT * FROM admin_users WHERE username = ?",
    adminUsername,
  );

  if (existingAdmin) {
    return; // Admin already exists
  }

  // Create admin user
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const userId = uuidv4();

  await db.run(
    "INSERT INTO admin_users (id, username, passwordHash, createdAt) VALUES (?, ?, ?, ?)",
    [userId, adminUsername, passwordHash, new Date().toISOString()],
  );
}

export async function authRoutes(fastify) {
  fastify.post("/login", async (request, reply) => {
    const ip = request.ip;

    if (!checkRateLimit(ip)) {
      return reply.status(429).send({ error: "Too many login attempts" });
    }

    const { username, password } = request.body;

    if (!username || !password) {
      return reply
        .status(400)
        .send({ error: "Username and password required" });
    }

    const db = await getDatabase();
    const user = await db.get(
      "SELECT * FROM admin_users WHERE username = ?",
      username,
    );

    if (!user) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      username: user.username,
    });

    reply.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { success: true, token };
  });

  fastify.post("/logout", async (request, reply) => {
    reply.clearCookie("token");
    return { success: true };
  });

  fastify.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      return { userId: request.user.userId, username: request.user.username };
    } catch (err) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}
