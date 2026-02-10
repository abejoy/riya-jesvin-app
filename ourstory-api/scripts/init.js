#!/usr/bin/env node

/**
 * Database initialization script
 * Creates tables and initializes default admin user
 *
 * Usage: node scripts/init.js
 */

import { initializeDatabase, getDatabase } from "../src/db/init.js";
import { initializeAdmin } from "../src/routes/auth.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    console.log("✓ Database initialized");

    console.log("Setting up admin user...");
    await initializeAdmin();
    console.log("✓ Admin user ready");

    console.log("\n✓ Database setup complete!");
    console.log("\nDefault credentials:");
    console.log(`  Username: ${process.env.ADMIN_USERNAME || "admin"}`);
    console.log(`  Password: ${process.env.ADMIN_PASSWORD || "changeme"}`);
    console.log("\n⚠️  IMPORTANT: Change these credentials in production!\n");

    process.exit(0);
  } catch (error) {
    console.error("✗ Initialization failed:", error);
    process.exit(1);
  }
}

main();
