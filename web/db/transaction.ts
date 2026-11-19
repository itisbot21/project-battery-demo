import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";

export type StoreTransaction = PgTransaction<NeonQueryResultHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>;

export async function transact<T>(operation: (tx: StoreTransaction) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    return await drizzle({ client: pool }).transaction(operation);
  } finally {
    await pool.end();
  }
}
