import { hash } from "bcryptjs";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const connection = await mysql.createConnection({
  host: env.DB_HOST,
  port: Number(env.DB_PORT) || 3306,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

const email = "Psikoli556@gmail.com";
const password = "koli@321";
const fullName = "Psikoli";
const role = "agent";

const passwordHash = await hash(password, 12);

await connection.execute(
  `INSERT INTO users (full_name, email, role, password_hash, status)
   VALUES (?, ?, ?, ?, 'active')
   ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = 'active'`,
  [fullName, email, role, passwordHash],
);

console.log(`User ${email} inserted successfully with role '${role}'.`);
await connection.end();
