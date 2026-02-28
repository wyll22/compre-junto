import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const environment = process.env.NODE_ENV || "development";
  throw new Error(
    `DATABASE_URL ausente para inicializar o banco (ambiente: ${environment}). Configure esse Secret antes de iniciar o servidor.`,
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
