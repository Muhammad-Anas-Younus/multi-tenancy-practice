import { PoolClient, QueryResult, QueryResultRow } from "pg";
import pool from "../db";

export const withTenantContext = async (
  tenant: {
    id: number;
    tenant_strategy: "schema" | "shared" | "database";
    tenant_schema?: string;
  },
  fn: (client: PoolClient) => Promise<QueryResult<any>>,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log(tenant, "tenant context");

    if (tenant.tenant_strategy === "shared") {
      await client.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenant.id],
      );
    } else if (tenant.tenant_strategy === "schema") {
      await client.query("SELECT set_config('search_path', $1, true)", [
        `"${tenant.tenant_schema}", public`,
      ]);
    }

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
