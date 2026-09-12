import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db";
import { signToken } from "../utils/jwt";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { withTenantContext } from "../utils/tenant-helpers";

const router = express.Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Bad request" });
    }

    const client = await pool.connect();
    let admin;
    try {
      const result = await client.query(
        "SELECT id, password_hashed FROM admins WHERE email = $1",
        [email],
      );
      admin = result.rows[0];
    } finally {
      client.release();
    }

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      admin.password_hashed,
    );
    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = signToken({ sub: admin.id, role: "platform-admin" });

    return res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    console.log("Got error while logging in admin", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
  }
});

router.post(
  "/create-user",
  authenticate,
  authorize("platform-admin"),
  async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
      const { name, email, password, user_type, tenant_id } = req.body;

      if (!name || !email || !password || !user_type) {
        return res.status(400).json({ success: false, error: "Bad request" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const tenantInfo = await client.query(
        "SELECT * FROM organizations WHERE id = $1",
        [tenant_id],
      );

      if (tenantInfo.rows.length === 0) {
        throw new Error("Something went wrong!");
      }

      const row = await withTenantContext(
        {
          id: tenant_id,
          tenant_strategy: tenantInfo.rows[0].strategy,
          tenant_schema: tenantInfo.rows[0].schema_name,
        },
        async (client) => {
          return await client.query(
            "INSERT INTO users (name, email, password_hashed, tenant_id, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            [name, email, hashedPassword, tenant_id, user_type],
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

export default router;
