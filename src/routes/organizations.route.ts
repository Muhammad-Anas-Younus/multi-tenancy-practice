import express, { Request, Response } from "express";
import pool from "../db";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { slugify } from "../utils/slugify";
import { runTenantMigrations } from "../db/tenant-migrate";

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
        await client.query("BEGIN");
        const slug = slugify(name);

        const row = await client.query(
          `INSERT INTO organizations (name, strategy, slug) VALUES ($1, $2, $3) RETURNING id`,
          [name, strategy, slug],
        );

        if (row.rows.length === 0) {
          throw new Error("Something went wrong");
        }

        if (strategy === "schema") {
          const schemaName = `tenant_${row.rows[0].id}`;

          await client.query(`CREATE SCHEMA "${schemaName}"`);
          await client.query(
            `UPDATE organizations SET schema_name = $1 WHERE id = $2`,
            [schemaName, row.rows[0].id],
          );

          await runTenantMigrations(schemaName, client);
        }

        await client.query("COMMIT");

        res.status(201).json({ success: true, data: row.rows[0] });
      } catch (error) {
        console.log(error);
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.log("Failed to create organization", error);
      res
        .status(500)
        .json({ success: false, error: error || "Something went wrong" });
    }
  },
);

export default router;
