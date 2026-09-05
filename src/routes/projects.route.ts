import express, { Request, Response } from "express";
import pool from "../db";

const router = express.Router();

router.post("/create-project", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Bad request" });
    }

    const client = await pool.connect();

    const row = await client.query(
      "INSERT INTO projects (name) VALUES ($1) RETURNING id",
      [name],
    );

    if (row.rows.length === 0) {
      throw new Error("Something went wrong!");
    }

    return res.status(201).json({ success: true, data: row.rows[0] });
  } catch (error) {
    console.log("Got error while creating project", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
  }
});

export default router;
