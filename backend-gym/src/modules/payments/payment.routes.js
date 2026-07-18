import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";
import {
  recordPayment,
  createRazorpayOrder,
  verifyMemberPayment,
  paymentHistory,
  allPayments,
} from "./payment.controller.js";

const router = Router();

// Record new payment
router.post(
  "/create",
  verifyToken(["Admin", "Superadmin", "receptionist"]),
  recordPayment
);

// Create Razorpay Order
router.post(
  "/create-razorpay-order",
  verifyToken(["Admin", "Superadmin", "member"]),
  createRazorpayOrder
);

// Verify Razorpay Payment
router.post(
  "/verify-member-payment",
  verifyToken(["Admin", "Superadmin", "member"]),
  verifyMemberPayment
);

// Member payment history
router.get(
  "/member/:memberId",
  verifyToken(["Admin", "Superadmin", "receptionist", "member"]),
  paymentHistory
);

// All payments of a branch
router.get(
  "/branch/:branchId",
  verifyToken(["Admin", "Superadmin", "receptionist"]),
  allPayments
);

export default router;
