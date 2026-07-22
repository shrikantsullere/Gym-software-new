import { pool } from "../../config/db.js";

export const receptionistDashboardService = async (adminId, branchId) => {
  // 1. Today's walk-in check-ins (member attendance today)
  const [todayCheckins] = await pool.query(
    `SELECT COUNT(*) as count FROM memberattendance
     WHERE DATE(checkIn) = CURDATE()`,
    []
  );

  // 2. New registrations today
  const [newRegistrations] = await pool.query(
    `SELECT COUNT(*) as count FROM member
     WHERE DATE(joinDate) = CURDATE() AND adminId = ?`,
    [adminId]
  );

  // 3. Pending payments (members without full payment recorded or unpaid)
  const [pendingPayments] = await pool.query(
    `SELECT COUNT(DISTINCT m.id) as count, 0 as totalAmount
     FROM member m
     LEFT JOIN payment p ON p.memberId = m.id
     WHERE (m.adminId = ? OR ? IS NULL)
       AND (m.amountPaid = 0 OR m.amountPaid IS NULL OR p.id IS NULL)`,
    [adminId, adminId]
  );

  // 4. Members with expiring/recently expired plans
  const [expiringPlans] = await pool.query(
    `SELECT COUNT(DISTINCT m.id) as count 
     FROM member m
     LEFT JOIN member_plan_assignment mpa ON m.id = mpa.memberId AND mpa.status = 'Active'
     WHERE (m.adminId = ? OR ? IS NULL)
       AND COALESCE(mpa.membershipTo, m.membershipTo) IS NOT NULL
       AND DATEDIFF(COALESCE(mpa.membershipTo, m.membershipTo), CURDATE()) BETWEEN -15 AND 30`,
    [adminId, adminId]
  );

  // 5. Low stock inventory & gym equipment alerts
  const [eqItems] = await pool.query(
    `SELECT id, name, quantity AS currentStock, COALESCE(category, 'Equipment') AS category 
     FROM gym_equipment
     WHERE (branchId = ? OR ? IS NULL OR branchId = 0) AND quantity <= 5 AND isActive = 1`,
    [branchId, branchId]
  );
  const [reqItems] = await pool.query(
    `SELECT id, itemName AS name, quantity AS currentStock, COALESCE(category, 'Equipment Request') AS category 
     FROM equipment_requests
     WHERE (adminId = ? OR ? IS NULL) AND status = 'PENDING'`,
    [adminId, adminId]
  );
  const [prodItems] = await pool.query(
    `SELECT id, name, currentStock, COALESCE(category, 'General') AS category 
     FROM product
     WHERE currentStock <= 5 AND isActive = 1 AND (branchId = ? OR ? IS NULL OR branchId = 0)`,
    [branchId, branchId]
  );

  const lowStockItems = [...eqItems, ...reqItems, ...prodItems]
    .sort((a, b) => a.currentStock - b.currentStock)
    .slice(0, 5);

  // 6. Recent walk-in members today (list)
  const [recentCheckins] = await pool.query(
    `SELECT ma.id, ma.checkIn, ma.checkOut, 
            COALESCE(m.fullName, u.fullName, 'Member') AS name, 
            COALESCE(m.phone, u.phone) AS phone
     FROM memberattendance ma
     LEFT JOIN member m ON ma.memberId = m.id
     LEFT JOIN user u ON ma.memberId = u.id OR m.userId = u.id
     WHERE DATE(ma.checkIn) = CURDATE()
     ORDER BY ma.checkIn DESC
     LIMIT 10`,
    []
  );

  // 7. Today's revenue from payments
  const [todayRevenue] = await pool.query(
    `SELECT COALESCE(SUM(p.amount), 0) as total 
     FROM payment p
     JOIN member m ON p.memberId = m.id
     WHERE DATE(p.paymentDate) = CURDATE() AND m.adminId = ?`,
    [adminId]
  );

  // 8. Members with renewals due soon (for follow-up)
  const [renewalsList] = await pool.query(
    `SELECT m.id, m.fullName AS name, m.phone, 
            COALESCE(mpa.membershipTo, m.membershipTo) AS endDate,
            DATEDIFF(COALESCE(mpa.membershipTo, m.membershipTo), CURDATE()) as daysLeft
     FROM member m
     LEFT JOIN member_plan_assignment mpa ON m.id = mpa.memberId AND mpa.status = 'Active'
     WHERE (m.adminId = ? OR ? IS NULL)
       AND COALESCE(mpa.membershipTo, m.membershipTo) IS NOT NULL
       AND DATEDIFF(COALESCE(mpa.membershipTo, m.membershipTo), CURDATE()) BETWEEN -15 AND 30
     ORDER BY COALESCE(mpa.membershipTo, m.membershipTo) ASC
     LIMIT 10`,
    [adminId, adminId]
  );

  return {
    summary: {
      todayCheckins: todayCheckins[0].count,
      newRegistrations: newRegistrations[0].count,
      pendingPaymentsCount: pendingPayments[0].count,
      pendingPaymentsAmount: pendingPayments[0].totalAmount,
      expiringPlansCount: expiringPlans[0].count,
      todayRevenue: todayRevenue[0].total,
    },
    recentCheckins,
    lowStockItems,
    renewalsList,
  };
};
