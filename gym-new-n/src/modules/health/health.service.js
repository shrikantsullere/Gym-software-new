import { pool } from "../../config/db.js";
import { sendWhatsAppMessage } from "../../utils/whatsappHelper.js";

/**
 * Calculate BMI and Status
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height) return { bmi: null, bmiStatus: null };
  
  // If height is less than 10, assume it's in feet and convert to cm
  let actualHeightCm = parseFloat(height);
  if (actualHeightCm < 10) {
    actualHeightCm = actualHeightCm * 30.48;
  }
  
  // height in cm -> m
  const heightInMeters = actualHeightCm / 100;
  let bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
  
  // Cap BMI at 999.99 because of database schema constraints
  if (parseFloat(bmi) > 999.99) {
    bmi = 999.99;
  }
  
  let bmiStatus = "Normal";
  if (bmi < 18.5) bmiStatus = "Underweight";
  else if (bmi >= 18.5 && bmi < 25.0) bmiStatus = "Normal";
  else if (bmi >= 25.0 && bmi < 30.0) bmiStatus = "Overweight";
  else if (bmi >= 30.0) bmiStatus = "Obese";

  return { bmi: parseFloat(bmi), bmiStatus };
};

/**
 * Add a new health log entry for a member
 */
export const addHealthLogService = async (data) => {
  const { memberId, trainerId, weight, height, notes, dietChart } = data;

  if (!memberId) {
    throw { status: 400, message: "memberId is required" };
  }

  const { bmi, bmiStatus } = calculateBMI(weight, height);

  const [result] = await pool.query(
    `INSERT INTO member_health_log (memberId, trainerId, weight, height, bmi, bmiStatus, notes, dietChart, recordedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [memberId, trainerId || null, weight || null, height || null, bmi, bmiStatus, notes || null, dietChart || null]
  );

  // Trigger WhatsApp notification if diet chart is provided
  if (dietChart) {
    const [[member]] = await pool.query("SELECT fullName, phone FROM member WHERE id = ?", [memberId]);
    if (member && member.phone) {
      const msg = `Hi ${member.fullName}, \n\nYour new diet chart has been updated by your trainer. \n\nLog in to your gym app to view your personalized diet plan! 🍎🥦\n\nRegards,\nGym Management`;
      sendWhatsAppMessage(member.phone, msg).catch(console.error);
    }
  }

  return {
    id: result.insertId,
    memberId,
    trainerId,
    weight,
    height,
    bmi,
    bmiStatus,
    notes,
    dietChart
  };
};

/**
 * Get health logs for a specific member
 */
export const getMemberHealthLogsService = async (memberId) => {
  const [rows] = await pool.query(
    `SELECT h.*, m.fullName, m.phone 
     FROM member_health_log h
     JOIN member m ON h.memberId = m.id
     WHERE h.memberId = ? ORDER BY h.recordedAt DESC`,
    [memberId]
  );
  return rows;
};

/**
 * Get all health logs (for initial table load)
 */
export const getAllHealthLogsService = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT h.*, m.fullName, m.phone 
     FROM member_health_log h
     JOIN member m ON h.memberId = m.id
     WHERE m.adminId = ?
     ORDER BY h.recordedAt DESC`,
     [adminId]
  );
  return rows;
};

/**
 * Get all health logs for members assigned to a specific trainer
 */
export const getHealthLogsByTrainerIdService = async (trainerId) => {
  const [rows] = await pool.query(
    `SELECT h.*, m.fullName, m.phone 
     FROM member_health_log h
     JOIN member m ON h.memberId = m.id
     WHERE m.id IN (
       SELECT DISTINCT m2.id FROM member m2
       LEFT JOIN memberplan p ON m2.planId = p.id
       WHERE p.trainerId = ?
     )
     ORDER BY h.recordedAt DESC`,
    [trainerId]
  );
  return rows;
};

/**
 * Update an existing health log
 */
export const updateHealthLogService = async (id, data) => {
  const { weight, height, notes, dietChart } = data;

  const [[existing]] = await pool.query("SELECT * FROM member_health_log WHERE id = ?", [id]);
  if (!existing) {
    throw { status: 404, message: "Health log not found" };
  }

  // Calculate new BMI if weight or height changed
  const newWeight = weight !== undefined ? weight : existing.weight;
  const newHeight = height !== undefined ? height : existing.height;
  const { bmi, bmiStatus } = calculateBMI(newWeight, newHeight);

  await pool.query(
    `UPDATE member_health_log SET 
      weight = ?,
      height = ?,
      bmi = ?,
      status = ?,
      notes = COALESCE(?, notes),
      dietChart = COALESCE(?, dietChart)
     WHERE id = ?`,
    [newWeight, newHeight, bmi, bmiStatus, notes !== undefined ? notes : null, dietChart !== undefined ? dietChart : null, id]
  );

  const [[updatedLog]] = await pool.query("SELECT * FROM member_health_log WHERE id = ?", [id]);
  return updatedLog;
};

/**
 * Delete a health log
 */
export const deleteHealthLogService = async (id) => {
  const [result] = await pool.query("DELETE FROM member_health_log WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    throw { status: 404, message: "Health log not found" };
  }
  return true;
};
