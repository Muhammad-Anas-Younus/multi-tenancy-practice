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
  authorize("platform-admin", "org-admin"),
  async (req: Request, res: Response) => {
    const auth =
      req.auth?.role === "platform-admin" ? req.adminAuth : req.tenantAuth!;
    try {
      const { name, email, password, user_type } = req.body;
      let { tenant_id } = req.body;

      const effectiveTenantId =
        auth?.role === "platform-admin" ? tenant_id : auth?.tenant_id;

      if (!name || !email || !password || !tenant_id || !user_type) {
        return res.status(400).json({ success: false, error: "Bad request" });
      }

      if (auth?.role === "org-admin") {
        if (tenant_id !== effectiveTenantId) {
          return res.status(403).json({ success: false, error: "Forbidden" });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const row = await withTenantContext(effectiveTenantId, async (client) => {
        return await client.query(
          "INSERT INTO users (name, email, password_hashed, tenant_id, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [name, email, hashedPassword, tenant_id, user_type],
        );
      });

      if (row.rows.length === 0) {
        throw new Error("Something went wrong!");
      }

      return res.status(201).json({ success: true, data: row.rows[0] });
    } catch (error) {
      console.log("Got error while creating user", error);
      return res
        .status(500)
        .json({ success: false, error: "Something went wrong" });
    }
  },
);

router.post("/login", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Bad request" });
    }

    let user;
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.login_email', $1, true)", [
        email,
      ]);
      const result = await client.query(
        "SELECT id, tenant_id, user_type, password_hashed FROM users WHERE email = $1",
        [email],
      );
      user = result.rows[0];
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("Got an error while getting email");
      return res.status(500).json({ success: false, error });
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
    });

    return res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    client.query("ROLLBACK");
    console.log("Got error while logging in user", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
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
        req.auth!.tenant_id!,
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
