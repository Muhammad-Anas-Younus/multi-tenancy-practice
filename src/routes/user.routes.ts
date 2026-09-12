import express, { Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { signToken } from "../utils/jwt";
import { withTenantContext } from "../utils/tenant-helpers";

const router = express.Router();

router.post(
  "/create-user",
  authenticate,
  authorize("org-admin"),
  async (req: Request, res: Response) => {
    const auth = req.tenantAuth;

    try {
      const { name, email, password, user_type } = req.body;

      const effectiveTenantId = auth?.tenant_id;

      if (!name || !email || !password || !user_type) {
        return res.status(400).json({ success: false, error: "Bad request" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const row = await withTenantContext(
        {
          id: effectiveTenantId!,
          tenant_strategy: req.tenantAuth?.tenant_strategy!,
          tenant_schema: req.tenantAuth?.schema_name,
        },
        async (client) => {
          return await client.query(
            "INSERT INTO users (name, email, password_hashed, tenant_id, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [name, email, hashedPassword, effectiveTenantId, user_type],
          );
        },
      );

      if (row.rows.length === 0) {
        throw new Error("Something went wrong!");
      }

      return res.status(201).json({ success: true, data: row.rows[0] });
    } catch (error) {
      console.log("Got error while creating user", error);
      return res
        .status(500)
        .json({ success: false, error: error || "Something went wrong" });
    }
  },
);

router.post("/login", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { email, password, slug } = req.body;
    if (!email || !password || !slug) {
      return res.status(400).json({ success: false, error: "Bad request" });
    }

    let user;
    let tenant: {
      id: number;
      tenant_strategy: "schema" | "shared" | "database";
      tenant_schema?: string;
    };
    try {
      await client.query("BEGIN");

      const orgInfo = await client.query(
        "SELECT * FROM organizations where slug = $1",
        [slug],
      );

      if (orgInfo.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(401)
          .json({ success: false, error: "Invalid credentials" });
      }

      const org = orgInfo.rows[0];

      tenant = {
        id: org.id,
        tenant_strategy: org.strategy,
        ...(org.schema_name ? { tenant_schema: org.schema_name } : {}),
      };

      const result = await withTenantContext(tenant, (client) => {
        return client.query(
          "SELECT * FROM users WHERE tenant_id = $1 AND email = $2",
          [tenant.id, email],
        );
      });

      user = result.rows[0];
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("Got an error while getting email", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      });
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hashed,
    );
    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = signToken({
      sub: user.id,
      tenant_id: user.tenant_id,
      role: user.user_type,
      tenant_strategy: tenant.tenant_strategy,
      ...(tenant.tenant_schema ? { schema_name: tenant.tenant_schema } : {}),
    });

    return res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    client.query("ROLLBACK");
    console.log("Got error while logging in user", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    });
  } finally {
    client.release();
  }
});

router.get(
  "/get-all-users",
  authenticate,
  authorize("org-admin", "org-user"),
  async (req: Request, res: Response) => {
    try {
      const role = req.auth!.role;

      if (role === "platform-admin") {
        return res.status(403).json({ success: false });
      }

      const result = await withTenantContext(
        {
          id: req.auth?.tenant_id!,
          tenant_strategy: req.auth?.tenant_strategy!,
          tenant_schema: req.auth?.schema_name,
        },
        async (client) => {
          return await client.query(`SELECT * FROM users`);
        },
      );

      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      console.log("Got an error while getting all users");
      return res.status(500).json({ success: false, error });
    }
  },
);

export default router;
