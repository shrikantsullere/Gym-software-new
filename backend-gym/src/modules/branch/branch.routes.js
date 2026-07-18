// src/modules/branch/branch.routes.js
import { Router } from "express";
import {
  createBranch,
  listBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchByAdminId,
  
} from "./branch.controller.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

// Create branch
router.post(
  "/create",
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  createBranch
);

// Get all branches
router.get(
  "/",
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  listBranches
);

router.get(
  "/by-admin/:adminId",
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  getBranchByAdminId
);

// Get single branch
router.get(
  "/:id",
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  getBranchById
);

// Update branch
router.put(
  "/:id",
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  updateBranch
);

// Delete branch
router.delete(
  "/:id", 
  verifyToken(["Superadmin", "Admin", "Subadmin"]),
  deleteBranch
);

export default router;
