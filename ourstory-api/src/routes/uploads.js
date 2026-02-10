import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "../db/init.js";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function uploadRoutes(fastify) {
  const verifyJWT = async (request) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      throw { statusCode: 401, message: "Unauthorized" };
    }
  };

  // GET static file (public)
  fastify.get("/:filename", async (request, reply) => {
    const filename = request.params.filename;

    // Security: prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return reply.status(400).send({ error: "Invalid filename" });
    }

    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return reply.status(404).send({ error: "File not found" });
    }

    reply.header("Cache-Control", "public, max-age=2592000"); // 30 days

    // Determine MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";
    reply.header("Content-Type", mimeType);

    return reply.send(fs.createReadStream(filepath));
  });

  // POST upload images for memory (admin)
  fastify.post("/:memoryId/images", async (request, reply) => {
    await verifyJWT(request);

    const { memoryId } = request.params;
    const db = await getDatabase();

    // Verify memory exists
    const memory = await db.get(
      "SELECT id FROM memories WHERE id = ?",
      memoryId,
    );
    if (!memory) {
      return reply.status(404).send({ error: "Memory not found" });
    }

    const uploadedImages = [];
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type !== "file") continue;

      const { filename, encoding, mimetype, file } = part;

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
        return reply
          .status(400)
          .send({ error: "Only image files are allowed" });
      }

      // Generate unique filename
      const ext = path.extname(filename).toLowerCase();
      const uniqueFilename = `${uuidv4()}${ext}`;
      const filepath = path.join(UPLOAD_DIR, uniqueFilename);

      // Convert buffer
      const chunks = [];
      for await (const chunk of file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Check file size
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(413).send({ error: "File too large" });
      }

      // Process image and get dimensions
      try {
        const metadata = await sharp(buffer).metadata();

        // Save original image
        await sharp(buffer).toFile(filepath);

        // Save image record
        const imageId = uuidv4();
        const url = `/uploads/${uniqueFilename}`;
        const now = new Date().toISOString();

        // Get max sortOrder for images
        const maxSort = await db.get(
          "SELECT MAX(sortOrder) as max FROM memory_images WHERE memoryId = ?",
          memoryId,
        );
        const sortOrder = (maxSort?.max || 0) + 1;

        await db.run(
          `INSERT INTO memory_images (id, memoryId, filename, url, width, height, alt, sortOrder, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          imageId,
          memoryId,
          uniqueFilename,
          url,
          metadata.width,
          metadata.height,
          "", // empty alt text by default
          sortOrder,
          now,
        );

        uploadedImages.push({
          id: imageId,
          url,
          width: metadata.width,
          height: metadata.height,
          alt: "",
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({ error: "Failed to process image" });
      }
    }

    return reply.status(201).send({ images: uploadedImages });
  });

  // DELETE image (admin)
  fastify.delete("/:memoryId/images/:imageId", async (request, reply) => {
    await verifyJWT(request);

    const { memoryId, imageId } = request.params;
    const db = await getDatabase();

    const image = await db.get(
      "SELECT * FROM memory_images WHERE id = ? AND memoryId = ?",
      imageId,
      memoryId,
    );

    if (!image) {
      return reply.status(404).send({ error: "Image not found" });
    }

    // Delete file
    const filepath = path.join(UPLOAD_DIR, image.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete record
    await db.run("DELETE FROM memory_images WHERE id = ?", imageId);

    return { message: "Image deleted" };
  });

  // PUT reorder images (admin)
  fastify.put("/:memoryId/images/reorder", async (request, reply) => {
    await verifyJWT(request);

    const { memoryId } = request.params;
    const { order } = request.body; // Array of { id, sortOrder }

    if (!Array.isArray(order)) {
      return reply.status(400).send({ error: "Order must be an array" });
    }

    const db = await getDatabase();

    for (const item of order) {
      await db.run(
        "UPDATE memory_images SET sortOrder = ? WHERE id = ? AND memoryId = ?",
        item.sortOrder,
        item.id,
        memoryId,
      );
    }

    return { message: "Images reordered" };
  });
}
