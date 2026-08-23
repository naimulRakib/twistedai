import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ✅ Prisma 7 config — connection URLs live here, not in schema.prisma
export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DIRECT_URL!,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL,
      });
      return new PrismaPg(pool);
    },
  },
});

