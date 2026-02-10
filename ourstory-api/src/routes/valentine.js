import { getDatabase } from "../db/init.js";

export async function valentineRoutes(fastify) {
  // Verify JWT decorator
  const verifyJWT = async (request) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  };

  // GET valentine message (public)
  fastify.get("/", async (request, reply) => {
    const db = await getDatabase();
    const message = await db.get(
      "SELECT * FROM valentine_message WHERE id = 1",
    );

    if (!message) {
      return reply.status(404).send({ error: "Valentine message not found" });
    }

    return {
      title: message.title,
      body: message.body,
      signature: message.signature,
      typedEffect: message.typedEffect === 1,
      updatedAt: message.updatedAt,
    };
  });

  // PUT update valentine message (admin)
  fastify.put("/", async (request, reply) => {
    await verifyJWT(request);

    const { title, body, signature, typedEffect } = request.body;
    const db = await getDatabase();

    const now = new Date().toISOString();

    await db.run(
      `UPDATE valentine_message SET title = ?, body = ?, signature = ?, typedEffect = ?, updatedAt = ?
       WHERE id = 1`,
      title || "Happy Valentine's ❤️",
      body || "Forever with you...",
      signature || null,
      typedEffect ? 1 : 0,
      now,
    );

    return { message: "Valentine message updated" };
  });
}
