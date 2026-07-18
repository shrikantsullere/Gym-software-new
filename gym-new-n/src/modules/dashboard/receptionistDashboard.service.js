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

  // 3. Pending payments (payments with status pending or unpaid)
  const pendingPayments = [{ count: 0, totalAmount: 0 }];

  // 4. Members with expiring plans in next 7 days
  const [expiringPlans] = await pool.query(
    `SELECT COUNT(*) as count FROM member_plan_assignment mpa
     JOIN member m ON mpa.memberId = m.id
     WHERE mpa.membershipTo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     AND m.adminId = ? AND mpa.status = 'Active'`,
    [adminId]
  );

  // 5. Low stock inventory alerts (products with currentStock <= 5)
  const [lowStockItems] = await pool.query(
    `SELECT id, name, currentStock, category FROM product
     WHERE currentStock <= 5 AND isActive = 1 AND branchId = ?
     ORDER BY currentStock ASC LIMIT 5`,
    [branchId]
  );

  // 6. Recent walk-in members today (list)
  const [recentCheckins] = await pool.query(
    `SELECT ma.id, ma.checkIn, ma.checkOut, m.fullName AS name, m.phone
     FROM memberattendance ma
     JOIN member m ON ma.memberId = m.id
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

  // 8. Members with renewals due soon (expiring in next 7 days, for follow-up)
  const [renewalsList] = await pool.query(
    `SELECT m.fullName AS name, m.phone, mpa.membershipTo AS endDate,
       DATEDIFF(mpa.membershipTo, CURDATE()) as daysLeft
     FROM member_plan_assignment mpa
     JOIN member m ON mpa.memberId = m.id
     WHERE mpa.membershipTo BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
     AND m.adminId = ? AND mpa.status = 'Active'
     ORDER BY mpa.membershipTo ASC
     LIMIT 10`,
    [adminId]
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
