
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import * as batterySchema from "./schema";
import * as authSchema from "./auth-schema";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

export const db = drizzle(databaseUrl, {
  schema: {
    ...batterySchema,
    ...authSchema,
  },
});
