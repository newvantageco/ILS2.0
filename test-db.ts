import * as dotenv from "dotenv";
dotenv.config();

import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function test() {
  try {
    console.log("Testing database connection...");
    const result = await db.execute(sql`SELECT 1 FROM users LIMIT 1`);
    console.log("✅ Query successful:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Query failed:", error);
    process.exit(1);
  }
}

test();
