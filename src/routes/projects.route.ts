import express, { Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { withTenantContext } from "../utils/tenant-helpers";

const router = express.Router();

router.post(
  "/create-project",
  authenticate,
  authorize("org-admin"),
  async (req: Request, res: Response) => {
    const auth = req.auth!;
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, error: "Bad request" });
      }

      if (auth.role === "platform-admin") {
        return res.status(403).json({ success: false });
      }

      const row = await withTenantContext(
        {
          id: auth.tenant_id!,
          tenant_strategy: auth.tenant_strategy,
          tenant_schema: auth.schema_name,
        },
        async (client) => {
          return await client.query(
            "INSERT INTO projects (name, tenant_id) VALUES ($1, $2) RETURNING id",
            [name, auth.tenant_id],
          );
        },
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
  },
);

router.put(
  "/:id/update",
  authenticate,
  authorize("org-admin"),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const auth = req.tenantAuth!;

      if (!id || !name) {
        return res.status(400).json({
          success: false,
          message: "Bad request",
        });
      }

      const result = await withTenantContext(
        {
          id: auth.tenant_id!,
          tenant_strategy: auth.tenant_strategy,
          tenant_schema: auth.schema_name,
        },
        (client) => {
          return client.query("SELECT * FROM projects WHERE id = $1 ", [id]);
        },
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Bad request",
        });
      }

      const updatedResult = await withTenantContext(
        {
          id: auth.tenant_id!,
          tenant_strategy: auth.tenant_strategy,
          tenant_schema: auth.schema_name,
        },
        (client) => {
          return client.query(
            "UPDATE projects SET name = $1 WHERE id = $2 RETURNING id",
            [name, id],
          );
        },
      );

      return res.status(200).json({
        success: true,
        data: updatedResult.rows[0],
      });
    } catch (error) {
      console.log("Got an error while updating project");
      throw error;
    }
  },
);

export default router;
