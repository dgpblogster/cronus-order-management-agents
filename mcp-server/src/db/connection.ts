/**
 * Database connection pool for SQL Server
 */

import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "Cronus",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.error("[DB] Connected to SQL Server");
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.error("[DB] Connection pool closed");
  }
}

export async function executeQuery<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const db = await getPool();
  const request = db.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }

  const result = await request.query(query);
  return result.recordset as T[];
}
