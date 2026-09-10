import path from "path";
import { Client } from "pg";
import fs from "fs";
import {
  DB_APP_USER,
  DB_APP_USER_PASS,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  DB_USER,
} from "../config/env";

async function runMigrations() {
  const client = new Client({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASS,
    port: Number(DB_PORT),
  });

  await client.connect();

  // create app user
  try {
    const roleCheck = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [DB_APP_USER],
    );

    if (roleCheck.rows.length === 0) {
      await client.query(
        `CREATE ROLE ${DB_APP_USER} WITH LOGIN PASSWORD ${client.escapeLiteral(DB_APP_USER_PASS)}`,
      );
      console.log(`Role ${DB_APP_USER} successfully created.`);
    } else {
      console.log(`Role ${DB_APP_USER} already exists. Skipping creation.`);
    }

    await client.query(
      `GRANT USAGE, CREATE ON SCHEMA public TO ${DB_APP_USER}`,
    );

    await client.query(`GRANT CREATE ON DATABASE ${DB_NAME} TO ${DB_APP_USER}`);

    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES ON TABLES TO ${DB_APP_USER}`,
    );

    await client.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${DB_APP_USER}`,
    );

    await client.query(
      `GRANT SELECT, INSERT, DELETE, UPDATE, REFERENCES ON ALL TABLES IN SCHEMA public TO ${DB_APP_USER}`,
    );

    await client.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${DB_APP_USER};`,
    );

    console.log(`Global setup complete for app user: ${DB_APP_USER}`);
  } catch (error) {
    console.log("Got an error while trying to create database app user", error);
  }

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

    const migrationsDir = path.join(__dirname, "migrations", "shared");

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
