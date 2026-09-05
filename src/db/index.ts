import { Pool } from "pg";
import { DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER } from "../config/env";

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASS,
  port: Number(DB_PORT) || 5432,
});

export default pool;
