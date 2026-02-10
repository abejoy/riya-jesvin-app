import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../db/init.js";

export async function memoryRoutes(fastify) {
  // Verify JWT decorator
  const verifyJWT = async (request) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  };

  // GET all memories (public)
  fastify.get("/", async (request, reply) => {
    const db = await getDatabase();
    const memories = await db.all(`
      SELECT m.*, json_group_array(
        json_object(
          'id', mi.id,
          'url', mi.url,
          'width', mi.width,
          'height', mi.height,
          'alt', mi.alt,
          'sortOrder', mi.sortOrder
        )
      ) as images
      FROM memories m
      LEFT JOIN memory_images mi ON m.id = mi.memoryId
      GROUP BY m.id
      ORDER BY m.sortOrder ASC
    `);

    return memories.map((m) => ({
      ...m,
      images: m.images
        ? JSON.parse(m.images).filter((img) => img.id !== null)
        : [],
    }));
  });

  // GET single memory (public)
  fastify.get("/:id", async (request, reply) => {
    const db = await getDatabase();
    const memory = await db.get(
      `SELECT m.*, json_group_array(
        json_object(
          'id', mi.id,
          'url', mi.url,
          'width', mi.width,
          'height', mi.height,
          'alt', mi.alt,
          'sortOrder', mi.sortOrder
        )
      ) as images
      FROM memories m
      LEFT JOIN memory_images mi ON m.id = mi.memoryId
      WHERE m.id = ?
      GROUP BY m.id`,
      request.params.id,
    );

    if (!memory) {
      return reply.status(404).send({ error: "Memory not found" });
    }

    return {
      ...memory,
      images: memory.images
        ? JSON.parse(memory.images).filter((img) => img.id !== null)
        : [],
    };
  });

  // POST create memory (admin)
  fastify.post("/", async (request, reply) => {
    await verifyJWT(request);

    const { title, date, section, body, location } = request.body;

    if (!title || !section || !body) {
      return reply
        .status(400)
        .send({ error: "Title, section, and body are required" });
    }

    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    // Get max sortOrder
    const maxSort = await db.get("SELECT MAX(sortOrder) as max FROM memories");
    const sortOrder = (maxSort?.max || 0) + 1;

    await db.run(
      `INSERT INTO memories (id, title, date, section, body, location, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      title,
      date || null,
      section,
      body,
      location || null,
      sortOrder,
      now,
      now,
    );

    return reply.status(201).send({ id, message: "Memory created" });
  });

  // PUT update memory (admin)
  fastify.put("/:id", async (request, reply) => {
    await verifyJWT(request);

    const { title, date, section, body, location } = request.body;
    const db = await getDatabase();

    const memory = await db.get(
      "SELECT id FROM memories WHERE id = ?",
      request.params.id,
    );

    if (!memory) {
      return reply.status(404).send({ error: "Memory not found" });
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE memories SET title = ?, date = ?, section = ?, body = ?, location = ?, updatedAt = ?
       WHERE id = ?`,
      title || memory.title,
      date || null,
      section || memory.section,
      body || memory.body,
      location || null,
      now,
      request.params.id,
    );

    return { message: "Memory updated" };
  });

  // DELETE memory (admin)
  fastify.delete("/:id", async (request, reply) => {
    await verifyJWT(request);

    const db = await getDatabase();

    const memory = await db.get(
      "SELECT id FROM memories WHERE id = ?",
      request.params.id,
    );

    if (!memory) {
      return reply.status(404).send({ error: "Memory not found" });
    }

    await db.run("DELETE FROM memories WHERE id = ?", request.params.id);

    return { message: "Memory deleted" };
  });

  // PUT reorder memories (admin)
  fastify.put("/reorder", async (request, reply) => {
    await verifyJWT(request);

    const { order } = request.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return reply.status(400).send({ error: "Order must be an array" });
    }

    const db = await getDatabase();

    for (const item of order) {
      await db.run(
        "UPDATE memories SET sortOrder = ? WHERE id = ?",
        item.sortOrder,
        item.id,
      );
    }

    return { message: "Memories reordered" };
  });
}
