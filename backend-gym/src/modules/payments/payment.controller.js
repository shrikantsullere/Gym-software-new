import {
  recordPaymentService,
  createRazorpayOrderService,
  verifyMemberPaymentService,
  paymentHistoryService,
  allPaymentsService,
} from "./payment.service.js";

import { assignPlansToMember } from "../memberPlanAssignment/memberPlanAssignment.service.js";

export const recordPayment = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      collectedByName: req.user?.fullName || null,
      collectedByRole: req.user?.roleName || null
    };
    const p = await recordPaymentService(payload);

    // Get adminId to assign plan
    const adminId = req.user?.adminId || req.user?.id;
    
    // Assign the plan using the payment details
    await assignPlansToMember({
      memberId: req.body.memberId,
      plans: [
        {
          planId: req.body.planId,
          membershipFrom: new Date().toISOString().split('T')[0],
          paymentMode: req.body.paymentMode || "Cash",
          amountPaid: req.body.amount,
          trainerName: req.body.trainerName || null
        }
      ],
      assignedBy: adminId
    });

    res.json({ success: true, payment: p });
  } catch (err) {
    next(err);
  }
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    const result = await createRazorpayOrderService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const verifyMemberPayment = async (req, res, next) => {
  try {
    const result = await verifyMemberPaymentService(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const paymentHistory = async (req, res, next) => {
  try {
    const memberId = parseInt(req.params.memberId);
    const list = await paymentHistoryService(memberId);
    res.json({ success: true, payments: list });
  } catch (err) {
    next(err);
  }
};

export const allPayments = async (req, res, next) => {
  try {
    const branchId = req.params.branchId;
    const adminId = req.query.adminId; // Need adminId from query for proper fetching
    const list = await allPaymentsService(adminId, branchId);
    res.json({ success: true, payments: list });
  } catch (err) {
    next(err);
  }
};
