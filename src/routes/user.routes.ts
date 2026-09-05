import express, { Request, Response } from "express";
import pool from "../db";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { signToken } from "../utils/jwt";

const router = express.Router();

router.post(
  "/create-user",
  authenticate,
  authorize("platform-admin", "org-admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, user_type } = req.body;
      let { tenant_id } = req.body;

      if (!name || !email || !password || !tenant_id || !user_type) {
        return res
          .status(400)
          .json({ success: false, error: "Bad request" });
      }

      if (req.auth!.role === "org-admin") {
        if (tenant_id !== req.auth!.tenant_id) {
          return res.status(403).json({ success: false, error: "Forbidden" });
        }
      }

      const client = await pool.connect();
      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const row = await client.query(
          "INSERT INTO users (name, email, password_hashed, tenant_id, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [name, email, hashedPassword, tenant_id, user_type],
        );

        if (row.rows.length === 0) {
          throw new Error("Something went wrong!");
        }

        return res.status(201).json({ success: true, data: row.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.log("Got error while creating user", error);
      return res
        .status(500)
        .json({ success: false, error: "Something went wrong" });
    }
  },
);

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Bad request" });
    }

    const client = await pool.connect();
    let user;
    try {
      const result = await client.query(
        "SELECT id, tenant_id, user_type, password_hashed FROM users WHERE email = $1",
        [email],
      );
      user = result.rows[0];
    } finally {
      client.release();
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
    console.log("Got error while logging in user", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
  }
});

export default router;
