import { PoolClient, QueryResult, QueryResultRow } from "pg";
import pool from "../db";

export const withTenantContext = async (
  tenantId: number,
  fn: (client: PoolClient) => Promise<QueryResult<any>>,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [
      tenantId,
    ]);

    const result = await fn(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
