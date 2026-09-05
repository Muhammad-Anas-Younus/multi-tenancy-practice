import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = express.Router();

router.post(
  "/create-org",
  authenticate,
  authorize("platform-admin"),
  async (req: Request, res: Response) => {
    try {
      const { name, strategy } = req.body;
      if (!name || !strategy) {
        return res.status(400).json({ success: false, error: "Bad request" });
      }

      const client = await pool.connect();
      try {
        const row = await client.query(
          `INSERT INTO organizations (name, strategy) VALUES ($1, $2) RETURNING id`,
          [name, strategy],
        );

        if (row.rows.length === 0) {
          throw new Error("Something went wrong");
        }

        res.status(201).json({ success: true, data: row.rows[0] });
      } finally {
        client.release();
      }
    } catch (error) {
      console.log("Failed to create organization", error);
      res.status(500).json({ success: false, error: "Something went wrong" });
    }
  },
);

export default router;
