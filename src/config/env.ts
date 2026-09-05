import "dotenv/config";

export const DB_NAME = process.env.DB_NAME;
export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_PASS = process.env.DB_PASS;
export const DB_PORT = process.env.DB_PORT;

if (!DB_NAME || !DB_HOST || !DB_USER || !DB_PASS || !DB_PORT) {
  throw new Error(
    "Missing db variables. please refer to .env.example for all of the required db env variables",
  );
}
