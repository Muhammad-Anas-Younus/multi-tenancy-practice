import express, { Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { withTenantContext } from "../utils/tenant-helpers";

const router = express.Router();

router.post(
  "/add-member",
  authenticate,
  authorize("org-admin"),
  async (req: Request, res: Response) => {
    const auth = req.tenantAuth!;

    try {
      const { project_id, user_id } = req.body;

      if (!project_id || !user_id) {
        return res.status(400).json({ success: false });
      }

      const rows = await withTenantContext(
        {
          id: auth.tenant_id!,
          tenant_strategy: auth.tenant_strategy,
          tenant_schema: auth.schema_name,
        },
        async (client) => {
          return await client.query(
            "INSERT INTO project_members (project_id, user_id, tenant_id) VALUES ($1,$2,$3) RETURNING id",
            [project_id, user_id, auth.tenant_id],
          );
        },
      );

      return res.status(201).json({ success: true, data: rows.rows[0] });
    } catch (error) {
      console.log("Got an error while adding project member");
      res.status(500).json({ success: false, error });
    }
  },
);

router.delete(
  "/remove-member/:memberId/:projectId",
  authenticate,
  authorize("org-admin"),
  async (req: Request, res: Response) => {
    try {
      const { memberId, projectId } = req.params;

      const auth = req.tenantAuth;

      if (!memberId || !projectId) {
        return res.status(400).json({
          success: false,
          message: "Bad request",
        });
      }

      const memberExists = await withTenantContext(
        {
          id: auth?.tenant_id!,
          tenant_strategy: auth?.tenant_strategy!,
          tenant_schema: auth?.schema_name,
        },
        (client) => {
          return client.query(
            "SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, memberId],
          );
        },
      );

      if (memberExists.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Bad request",
        });
      }

      const result = await withTenantContext(
        {
          id: auth?.tenant_id!,
          tenant_strategy: auth?.tenant_strategy!,
          tenant_schema: auth?.schema_name,
        },
        (client) => {
          return client.query(
            "DELETE FROM project_members pm USING projects p, users u WHERE pm.user_id = $1 AND pm.project_id = $2 AND p.id = pm.project_id AND u.id = pm.user_id RETURNING p.id AS project_id, p.name AS project_name, u.name AS user_name",
            [memberId, projectId],
          );
        },
      );

      return res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      throw error;
    }
  },
);

export default router;
