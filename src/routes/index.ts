import express from "express";
import adminRoutes from "./admin.routes";
import orgRoutes from "./organizations.route";
import projectRoutes from "./projects.route";
import userRoutes from "./user.routes";
import projectMembersRoutes from "./project-members.route";

const router = express.Router();

router.use("/admins", adminRoutes);
router.use("/organizations", orgRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/project-members", projectMembersRoutes);

export default router;
