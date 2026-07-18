import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";
import {
  createEquipment,
  listEquipment,
  getEquipmentStats,
  updateEquipment,
  deleteEquipment,
  createItemRequest,
  listItemRequests,
  updateItemRequestStatus,
  getMemberItemRequests
} from "./equipment.controller.js";

const router = Router();

// ========================
// EQUIPMENT ROUTES
// ========================

// Create equipment (Admin only)
router.post("/create", verifyToken(["ADMIN", "SUPERADMIN", "MANAGER", "PERSONALTRAINER", "GENERALTRAINER", "RECEPTIONIST"]), createEquipment);

// List all equipment for a branch
router.get("/branch/:branchId", verifyToken(["ADMIN", "SUPERADMIN", "MANAGER", "PERSONALTRAINER", "GENERALTRAINER", "RECEPTIONIST", "SALES_AGENT", "HOUSEKEEPING"]), listEquipment);

// Equipment stats summary (Admin/Manager/Trainer)
router.get("/stats/:branchId", verifyToken(["ADMIN", "SUPERADMIN", "MANAGER", "PERSONALTRAINER", "GENERALTRAINER", "RECEPTIONIST", "SALES_AGENT"]), getEquipmentStats);

// Update equipment
router.put("/update/:id", verifyToken(["ADMIN", "SUPERADMIN"]), updateEquipment);

// Delete equipment (soft delete)
router.delete("/delete/:id", verifyToken(["ADMIN", "SUPERADMIN"]), deleteEquipment);

// ========================
// ITEM REQUEST ROUTES
// ========================

// Create a request (members, trainers, any staff)
router.post("/requests/create", verifyToken(["ADMIN", "SUPERADMIN", "MEMBER", "PERSONALTRAINER", "GENERALTRAINER", "RECEPTIONIST", "MANAGER", "HOUSEKEEPING"]), createItemRequest);

// Get all requests for admin review
router.get("/requests/admin/:adminId", verifyToken(["ADMIN", "SUPERADMIN", "MANAGER"]), listItemRequests);

// Update request status (Approve/Reject/Complete)
router.patch("/requests/:id/status", verifyToken(["ADMIN", "SUPERADMIN"]), updateItemRequestStatus);

// Get requests submitted by a specific user (member or staff)
router.get("/requests/member/:memberId", verifyToken(["ADMIN", "SUPERADMIN", "MEMBER", "PERSONALTRAINER", "GENERALTRAINER", "RECEPTIONIST", "MANAGER", "HOUSEKEEPING", "SALES_AGENT"]), getMemberItemRequests);

export default router;
