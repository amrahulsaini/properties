import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { getEnv, isDatabaseConfigured } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  mysqlPool: Pool | undefined;
};

type SqlValue = string | number | boolean | Date | Buffer | null;

let pool = globalForDb.mysqlPool;

function getPool() {
  if (pool) {
    return pool;
  }

  if (!isDatabaseConfigured()) {
    throw new Error("Database credentials are not configured in the environment.");
  }

  const env = getEnv();

  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false,
    decimalNumbers: true,
  });

  if (process.env.NODE_ENV !== 'production') globalForDb.mysqlPool = pool;

  return pool;
}

export async function queryRows<T = RowDataPacket>(
  sql: string,
  values: ReadonlyArray<unknown> = [],
) {
  const [rows] = await getPool().query(sql, values as SqlValue[]);
  return rows as T[];
}

export async function execute(sql: string, values: ReadonlyArray<unknown> = []) {
  const [result] = await getPool().execute<ResultSetHeader>(
    sql,
    values as SqlValue[],
  );
  return result;
}

export async function withTransaction<T>(
  runner: (connection: PoolConnection) => Promise<T>,
) {
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const result = await runner(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function testDatabaseConnection() {
  const rows = await queryRows<{ ping: number }>("SELECT 1 AS ping");
  return rows[0]?.ping === 1;
}
