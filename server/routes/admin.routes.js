import { Router } from "express";
import * as ctrl from "../controllers/admin.controller.js";
import {
  authenticate,
  requireAdmin,
  requireStaff,
} from "../middleware/auth.js";

const router = Router();
router.use(authenticate);
router.get("/dashboard", requireStaff, ctrl.dashboard);
router.get("/students", requireAdmin, ctrl.listStudents);
router.patch("/students/:id", requireAdmin, ctrl.updateStudent);
router.get("/students/:id/overview", requireAdmin, ctrl.studentOverview);
router.get(
  "/students/:id/delete-preview",
  requireAdmin,
  ctrl.studentDeletePreview,
);
router.delete("/students/:id", requireAdmin, ctrl.deleteStudent);
router.get("/staff", requireAdmin, ctrl.listStaff);
router.post("/staff", requireAdmin, ctrl.createStaff);
router.get("/audit-logs", requireAdmin, ctrl.auditLogs);
router.get("/settings", ctrl.getSettings);
router.patch("/settings", requireAdmin, ctrl.updateSettings);
router.get("/reports", requireAdmin, ctrl.reports);
router.get("/calendar", requireStaff, ctrl.calendar);
router.get("/coupons", requireAdmin, ctrl.coupons);
router.post("/coupons", requireAdmin, ctrl.createCoupon);
router.patch("/coupons/:id", requireAdmin, ctrl.updateCoupon);
export default router;
