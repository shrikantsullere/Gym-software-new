import { pool } from "../../config/db.js";
import { dispatchNotification } from "../../utils/notificationDispatcher.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { assignPlansToMember } from "../memberPlanAssignment/memberPlanAssignment.service.js";

// --- Invoice generator ---
function generateInvoiceNo() {
  return "INV-" + Date.now() + "-" + Math.floor(Math.random() * 999);
}

// --- RECORD PAYMENT ---
export const recordPaymentService = async (data) => {
  const { memberId, planId, amount, collectedByName, collectedByRole } = data;

  // Verify member exists
  const [[member]] = await pool.query(
    "SELECT * FROM member WHERE id = ?",
    [memberId]
  );
  if (!member) throw { status: 404, message: "Member not found" };

  // Verify plan exists
  const [[plan]] = await pool.query(
    "SELECT * FROM plan WHERE id = ?",
    [planId]
  );
  if (!plan) throw { status: 404, message: "Plan not found" };

  const invoiceNo = generateInvoiceNo();
  // Insert payment
  const [result] = await pool.query(
    `INSERT INTO payment (memberId, planId, amount, invoiceNo, collectedByName, collectedByRole) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [memberId, planId, amount, invoiceNo, collectedByName || null, collectedByRole || null]
  );

  // Trigger global notification dispatch based on Super Admin configurations
  const receiptMsg = `Hi ${member.fullName}, \n\nThank you for your payment of Rs.${amount} for the ${plan.name} plan. \n\nYour membership is now active. Enjoy your workout! 💪\n\nRegards,\nGym Management`;
  
  dispatchNotification({
    category: "invoice",
    toEmail: member.email,
    toPhone: member.phone,
    toUserId: member.userId,
    memberId: member.id,
    subject: `Payment Receipt - ${plan.name}`,
    message: receiptMsg,
  }).catch(err => console.error("Error dispatching payment notification:", err.message));

  return {
    id: result.insertId,
    member,
    plan,
    amount,
    invoiceNo,
  };
};

// --- CREATE RAZORPAY ORDER FOR MEMBER ---
export const createRazorpayOrderService = async (data) => {
  const { memberId, amount, planId } = data;

  // Verify member exists and get adminId
  const [[member]] = await pool.query(
    "SELECT * FROM member WHERE id = ?",
    [memberId]
  );
  if (!member) throw { status: 404, message: "Member not found" };

  // Get admin's Razorpay keys
  const [[admin]] = await pool.query(
    "SELECT razorpayKeyId, razorpayKeySecret FROM user WHERE id = ?",
    [member.adminId]
  );

  if (!admin || !admin.razorpayKeyId || !admin.razorpayKeySecret) {
    throw { status: 400, message: "Payment Gateway not configured by the Gym Owner. Please contact the Gym Owner." };
  }

  const razorpay = new Razorpay({
    key_id: admin.razorpayKeyId,
    key_secret: admin.razorpayKeySecret,
  });

  const options = {
    amount: amount * 100, // amount in paisa
    currency: "INR",
    receipt: `rcpt_${memberId}_${Date.now()}`
  };

  const order = await razorpay.orders.create(options);
  return { order, key: admin.razorpayKeyId };
};

// --- PAYMENT HISTORY FOR MEMBER ---
export const paymentHistoryService = async (memberId) => {
  const [rows] = await pool.query(
    `SELECT p.*, pl.name AS planName, pl.price AS planPrice
     FROM payment p
     LEFT JOIN plan pl ON p.planId = pl.id
     WHERE p.memberId = ?
     ORDER BY p.id DESC`,
    [memberId]
  );
  return rows;
};

// --- ALL PAYMENTS BY ADMIN/BRANCH ---
export const allPaymentsService = async (adminId, branchId) => {
  let query = `SELECT p.*, m.fullName AS memberName, pl.name AS planName, pl.price AS planPrice
     FROM payment p
     LEFT JOIN member m ON p.memberId = m.id
     LEFT JOIN plan pl ON p.planId = pl.id
     WHERE m.adminId = ?`;
     
  const params = [adminId];
  
  if (branchId && branchId !== 'all' && branchId !== '') {
    query += ` AND m.branchId = ?`;
    params.push(branchId);
  }
  
  query += ` ORDER BY p.id DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

// --- VERIFY MEMBER RAZORPAY PAYMENT ---
export const verifyMemberPaymentService = async (data) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberId, planId, amount, adminId } = data;

  // Get admin's Razorpay keys
  let targetAdminId = adminId;
  if (!targetAdminId) {
    const [[member]] = await pool.query("SELECT adminId FROM member WHERE id = ?", [memberId]);
    if (!member) throw { status: 404, message: "Member not found" };
    targetAdminId = member.adminId;
  }

  const [[admin]] = await pool.query(
    "SELECT razorpayKeySecret FROM user WHERE id = ?",
    [targetAdminId]
  );

  if (!admin || !admin.razorpayKeySecret) {
    throw { status: 400, message: "Payment Gateway not configured" };
  }

  const generated_signature = crypto
    .createHmac("sha256", admin.razorpayKeySecret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    throw { status: 400, message: "Invalid payment signature" };
  }

  // Record payment in payment table
  await recordPaymentService({ memberId, planId, amount });

  // Assign the plan
  return await assignPlansToMember({
    memberId,
    plans: [
      {
        planId,
        membershipFrom: new Date().toISOString().split('T')[0],
        paymentMode: "Razorpay",
        amountPaid: amount
      }
    ],
    assignedBy: targetAdminId
  });
};
