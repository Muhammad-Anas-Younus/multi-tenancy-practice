import { Pool } from "pg";
import {
  DB_APP_USER,
  DB_APP_USER_PASS,
  DB_HOST,
  DB_NAME,
  DB_PORT,
} from "../config/env";

const pool = new Pool({
  user: DB_APP_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_APP_USER_PASS,
  port: Number(DB_PORT) || 5432,
});

export default pool;
