import { pool } from "../../config/db.js";

// ==============================
// EQUIPMENT CRUD
// ==============================

export const createEquipmentService = async (data) => {
  const {
    name, category, quantity, condition = "Good",
    purchaseDate, purchaseCost, location, maintenanceDueDays = 180,
    branchId, notes, imageUrl
  } = data;

  if (!name) throw { status: 400, message: "Equipment name is required" };
  if (!branchId) throw { status: 400, message: "Branch ID is required" };

  const nextMaintenanceDate = purchaseDate
    ? new Date(new Date(purchaseDate).getTime() + maintenanceDueDays * 86400000).toISOString().split("T")[0]
    : null;

  const [result] = await pool.query(
    `INSERT INTO gym_equipment 
     (name, category, quantity, \`condition\`, purchaseDate, purchaseCost, location, nextMaintenanceDate, branchId, notes, imageUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, quantity || 1, condition, purchaseDate || null, purchaseCost || null,
     location || null, nextMaintenanceDate, branchId, notes || null, imageUrl || null]
  );

  const [equipment] = await pool.query(`SELECT * FROM gym_equipment WHERE id = ?`, [result.insertId]);
  return equipment[0];
};

export const listEquipmentService = async (branchId, search, category) => {
  let sql = `SELECT * FROM gym_equipment WHERE branchId = ? AND isActive = 1`;
  const params = [branchId];

  if (search) {
    sql += ` AND (name LIKE ? OR location LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category && category !== "All") {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY id DESC`;
  const [rows] = await pool.query(sql, params);

  // Tag items as low stock or maintenance due
  return rows.map(item => ({
    ...item,
    status: item.quantity === 0
      ? "Out of Stock"
      : item.quantity <= 2
      ? "Low Stock"
      : item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= new Date()
      ? "Maintenance Due"
      : item.condition === "Under Repair"
      ? "Under Maintenance"
      : "Active"
  }));
};

export const updateEquipmentService = async (id, data) => {
  const {
    name, category, quantity, condition,
    purchaseDate, purchaseCost, location, nextMaintenanceDate, notes, isActive
  } = data;

  await pool.query(
    `UPDATE gym_equipment SET name=?, category=?, quantity=?, \`condition\`=?, 
     purchaseDate=?, purchaseCost=?, location=?, nextMaintenanceDate=?, notes=?, isActive=?
     WHERE id=?`,
    [name, category, quantity, condition, purchaseDate || null, purchaseCost || null,
     location || null, nextMaintenanceDate || null, notes || null, isActive ?? 1, id]
  );

  const [equipment] = await pool.query(`SELECT * FROM gym_equipment WHERE id = ?`, [id]);
  return equipment[0];
};

export const deleteEquipmentService = async (id) => {
  await pool.query(`UPDATE gym_equipment SET isActive = 0 WHERE id = ?`, [id]);
  return { success: true };
};

export const getEquipmentStatsService = async (branchId) => {
  const [rows] = await pool.query(
    `SELECT 
       COUNT(*) as totalItems,
       SUM(quantity) as totalQuantity,
       SUM(CASE WHEN quantity <= 2 AND quantity > 0 THEN 1 ELSE 0 END) as lowStockCount,
       SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as outOfStockCount,
       SUM(CASE WHEN \`condition\` = 'Under Repair' OR (nextMaintenanceDate IS NOT NULL AND nextMaintenanceDate <= CURDATE()) THEN 1 ELSE 0 END) as maintenanceCount
     FROM gym_equipment WHERE branchId = ? AND isActive = 1`,
    [branchId]
  );
  return rows[0];
};


// ==============================
// ITEM REQUEST SYSTEM
// ==============================

export const createItemRequestService = async (data) => {
  const { requestedBy, role, itemName, category, quantity = 1, reason, branchId, adminId, imageUrl } = data;

  if (!itemName) throw { status: 400, message: "Item name is required" };
  if (!requestedBy) throw { status: 400, message: "requestedBy is required" };

  const [result] = await pool.query(
    `INSERT INTO equipment_requests 
     (requestedBy, role, itemName, category, quantity, reason, branchId, adminId, imageUrl)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [requestedBy, role || "MEMBER", itemName, category || "Other", quantity, reason || null, branchId, adminId, imageUrl || null]
  );

  const [req] = await pool.query(`SELECT * FROM equipment_requests WHERE id = ?`, [result.insertId]);

  // 👉 Send Push Notification to Gym Admin (Bell Icon)
  if (adminId) {
    const notifMessage = `New inventory request: ${quantity}x ${itemName} by ${role} (ID: ${requestedBy})`;
    await pool.query(
      `INSERT INTO notificationlog (type, \`to\`, message, status, createdAt)
       VALUES (?, ?, ?, ?, NOW())`,
      ["IN-APP", adminId.toString(), notifMessage, "UNREAD"]
    );
  }

  return req[0];
};

export const listItemRequestsService = async (adminId, status) => {
  let sql = `SELECT er.*, u.fullName as requestedByName
             FROM equipment_requests er
             LEFT JOIN user u ON er.requestedBy = u.id
             WHERE er.adminId = ?`;
  const params = [adminId];

  if (status && status !== "All") {
    sql += ` AND er.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY er.id DESC`;

  const [rows] = await pool.query(sql, params);
  return rows;
};

export const updateItemRequestStatusService = async (id, status, adminRemarks) => {
  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];
  if (!validStatuses.includes(status)) throw { status: 400, message: "Invalid status" };

  await pool.query(
    `UPDATE equipment_requests SET status = ?, adminRemarks = ?, updatedAt = NOW() WHERE id = ?`,
    [status, adminRemarks || null, id]
  );

  const [req] = await pool.query(`SELECT * FROM equipment_requests WHERE id = ?`, [id]);
  return req[0];
};

export const getMemberItemRequestsService = async (userId, isStaff) => {
  let query = "";
  if (isStaff) {
    query = `SELECT * FROM equipment_requests WHERE requestedBy = ? AND role != 'MEMBER' ORDER BY id DESC`;
  } else {
    query = `SELECT * FROM equipment_requests WHERE requestedBy = ? AND role = 'MEMBER' ORDER BY id DESC`;
  }
  const [rows] = await pool.query(query, [userId]);
  return rows;
};
