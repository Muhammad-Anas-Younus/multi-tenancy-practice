import path from "path";
import { Client } from "pg";
import fs from "fs";
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "../config/env";

async function runMigrations() {
  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: Number(DB_PORT),
  });

  await client.connect();
  try {
    client.query(
      `CREATE TABLE IF NOT EXISTS migrations(
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
    );

    const { rows } = await client.query("SELECT name FROM migrations");
    const executedMigrations = rows.map((row) => row.name);

    const migrationsDir = path.join(__dirname, "migrations");

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const pendingMigrations = files.filter(
      (file) => !executedMigrations.includes(file),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    for (const migration of pendingMigrations) {
      const migrationPath = path.join(migrationsDir, migration);
      const sql = fs.readFileSync(migrationPath, "utf-8");
      await client.query(sql);
      await client.query("INSERT INTO migrations(name) VALUES($1)", [
        migration,
      ]);
      console.log(`Executed migration: ${migration}`);
    }
  } catch (error) {
    console.log("Error running migrations:", error);
    process.exit(1);
  } finally {
    client.end();
  }
}

runMigrations();
