import { Router } from "express";
import {
  createMember,
  deleteMember,
  getMembersByAdminAndGeneralMemberPlanController,
  getMembersByAdminAndGroupPlanController,
  getMembersByAdminAndPlanController,
  getMembersByAdminId,
  getRenewalPreview,
  listMembers,
  listPTBookings,
  memberDetail,
  renewMembershipPlan,
  updateMember,
  updateMemberRenewalStatus,
  importMembers,
  downloadMemberTemplate,
  getMembersByTrainerIdController,
  assignTrainerToMemberController,
  searchMembersController
} from "./member.controller.js";
import { verifyToken } from "../../middlewares/auth.js";

const router = Router();

router.get("/trainer/:trainerId", verifyToken(["Superadmin", "Admin", "Staff", "PERSONALTRAINER", "GENERALTRAINER", "personal trainer", "general trainer"]), getMembersByTrainerIdController);
router.post("/assign-trainer", verifyToken(["Superadmin", "Admin"]), assignTrainerToMemberController);
router.get("/search", verifyToken(["Superadmin", "Admin", "Staff"]), searchMembersController);

router.post(
  "/create",
  verifyToken(["Superadmin", "Admin", "receptionist", "personal trainer", "general trainer", "sales_agent", "manager", "Staff"]),
  createMember
);

router.put("/renew/:memberId", verifyToken(["Superadmin", "Admin", "receptionist", "personal trainer", "general trainer", "sales_agent", "manager", "Staff"]), renewMembershipPlan);

/** List Members by Branch */
router.get(
  "/branch/:branchId",
  verifyToken(["Superadmin", "Admin", "Staff", "personaltrainer", "generaltrainer", "receptionist"]),
  listMembers
);

router.get("/renew/:adminId", verifyToken(), getRenewalPreview);

/** Get Member Detail */
router.get(
  "/detail/:id",
  verifyToken(["Superadmin", "Admin", "Staff", "Member"]),
  memberDetail
);

router.put("/admin/renewal/:memberId/status", verifyToken(["Superadmin", "Admin", "receptionist", "personal trainer", "general trainer", "sales_agent", "manager", "Staff"]), updateMemberRenewalStatus);

/** Update Member */
router.put(
  "/update/:id",
  verifyToken(["Superadmin", "Admin", "receptionist", "personal trainer", "general trainer", "sales_agent", "manager", "Staff"]),
  updateMember
);

/** Soft Delete / Deactivate Member */
router.delete(
  "/delete/:id",
  verifyToken(["Superadmin", "Admin", "receptionist"]),
  deleteMember
);

router.get("/admin/:adminId", verifyToken(["Superadmin", "Admin", "Staff", "generaltrainer", "receptionist", "sales_agent"]), getMembersByAdminId);
router.get("/admin/:adminId/plan", verifyToken(["Superadmin", "Admin", "Staff", "generaltrainer", "receptionist"]), getMembersByAdminAndPlanController);
router.get(
  "/group-plan/:adminId/admin/:planId",
  verifyToken(["Superadmin", "Admin", "Staff"]),
  getMembersByAdminAndGroupPlanController
);
router.get(
  "/member-plan/general/:adminId/admin/:planId",
  verifyToken(["Superadmin", "Admin", "Staff"]),
  getMembersByAdminAndGeneralMemberPlanController
);

router.get("/pt-bookings/:branchId", verifyToken(["Superadmin", "Admin", "Staff"]), listPTBookings);

/** Excel Member Import */
router.post("/import", verifyToken(["Superadmin", "Admin"]), importMembers);
router.get("/import/template", verifyToken(["Superadmin", "Admin"]), downloadMemberTemplate);

export default router;
