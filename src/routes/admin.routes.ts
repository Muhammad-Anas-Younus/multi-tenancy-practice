import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../db";
import { signToken } from "../utils/jwt";

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

export default router;
