import fs from "fs";
import path from "path";
import { PoolClient } from "pg";
import pool from "./index";

const TENANT_MIGRATIONS_DIR = path.join(__dirname, "migrations", "tenant");

const SCHEMA_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

export async function runTenantMigrations(
  schemaName: string,
  existingClient?: PoolClient,
): Promise<void> {
  if (!SCHEMA_NAME_PATTERN.test(schemaName)) {
    throw new Error(`Invalid tenant schema name: ${schemaName}`);
  }

  const client = existingClient ?? (await pool.connect());
  const ownsConnection = !existingClient;

  try {
    if (ownsConnection) {
      await client.query("BEGIN");
    }

    await client.query("SELECT set_config('search_path', $1, true)", [
      `"${schemaName}", public`,
    ]);

    await client.query(
      `CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    );

    const { rows } = await client.query("SELECT name FROM migrations");
    const executedMigrations = rows.map((row) => row.name);

    const files = fs
      .readdirSync(TENANT_MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    const pendingMigrations = files.filter(
      (file) => !executedMigrations.includes(file),
    );

    for (const migration of pendingMigrations) {
      const migrationPath = path.join(TENANT_MIGRATIONS_DIR, migration);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      await client.query(sql);
      await client.query("INSERT INTO migrations (name) VALUES ($1)", [
        migration,
      ]);

      console.log(`[${schemaName}] Executed tenant migration: ${migration}`);
    }

    if (ownsConnection) {
      await client.query("COMMIT");
    }
  } catch (error) {
    if (ownsConnection) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    if (ownsConnection) {
      client.release();
    }
  }
}
