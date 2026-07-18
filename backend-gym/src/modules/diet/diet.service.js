import { pool } from "../../config/db.js";

// ----- CREATE DIET PLAN -----
export const createDietPlanService = async ({ title, notes, branchId, createdBy, meals, dietType }) => {
  if (!title) throw { status: 400, message: "Diet plan title is required" };

  // Insert diet plan
  const [planResult] = await pool.query(
    "INSERT INTO dietplan (title, notes, branchId, createdBy, dietType) VALUES (?, ?, ?, ?, ?)",
    [title, notes || "", branchId || 0, createdBy || 0, dietType || 'Any']
  );
  const dietPlanId = planResult.insertId;

  // Insert meals if provided
  if (meals && meals.length) {
    const mealValues = meals.map(m => [dietPlanId, m.time || "", m.food || ""]);
    await pool.query(
      "INSERT INTO dietmeal (dietPlanId, time, food) VALUES ?",
      [mealValues]
    );
  }

  return getDietPlanByIdService(dietPlanId);
};

// ----- GET ALL DIET PLANS (FOR TRAINER/ADMIN) -----
export const getAllDietPlansService = async (branchId, createdBy) => {
  // We can fetch all plans, or filter by branchId/createdBy
  let query = "SELECT * FROM dietplan ORDER BY id DESC";
  let params = [];
  
  if (branchId) {
    query = "SELECT * FROM dietplan WHERE branchId = ? ORDER BY id DESC";
    params = [branchId];
  }

  const [plans] = await pool.query(query, params);

  // Fetch all meals for these plans
  if (plans.length === 0) return [];

  const planIds = plans.map(p => p.id);
  const [meals] = await pool.query(
    "SELECT * FROM dietmeal WHERE dietPlanId IN (?)",
    [planIds]
  );

  return plans.map(plan => ({
    ...plan,
    meals: meals.filter(m => m.dietPlanId === plan.id)
  }));
};

// ----- GET DIET PLAN BY ID -----
export const getDietPlanByIdService = async (id) => {
  const [planRows] = await pool.query("SELECT * FROM dietplan WHERE id = ?", [id]);
  if (planRows.length === 0) throw { status: 404, message: "Diet plan not found" };

  const [meals] = await pool.query("SELECT * FROM dietmeal WHERE dietPlanId = ?", [id]);
  return { ...planRows[0], meals };
};

// ----- UPDATE DIET PLAN -----
export const updateDietPlanService = async (id, { title, notes, meals, dietType }) => {
  // Check if exists
  const [existing] = await pool.query("SELECT * FROM dietplan WHERE id = ?", [id]);
  if (existing.length === 0) throw { status: 404, message: "Diet plan not found" };

  // Update plan details
  if (title !== undefined || notes !== undefined || dietType !== undefined) {
    await pool.query(
      "UPDATE dietplan SET title = COALESCE(?, title), notes = COALESCE(?, notes), dietType = COALESCE(?, dietType) WHERE id = ?",
      [title, notes, dietType, id]
    );
  }

  // Update meals (Easiest way: delete old meals and insert new ones)
  if (meals && Array.isArray(meals)) {
    await pool.query("DELETE FROM dietmeal WHERE dietPlanId = ?", [id]);
    
    if (meals.length > 0) {
      const mealValues = meals.map(m => [id, m.time || "", m.food || ""]);
      await pool.query(
        "INSERT INTO dietmeal (dietPlanId, time, food) VALUES ?",
        [mealValues]
      );
    }
  }

  return getDietPlanByIdService(id);
};

// ----- DELETE DIET PLAN -----
export const deleteDietPlanService = async (id) => {
  // Delete assignments first
  await pool.query("DELETE FROM dietplanassignment WHERE dietPlanId = ?", [id]);
  
  // Delete meals
  await pool.query("DELETE FROM dietmeal WHERE dietPlanId = ?", [id]);
  
  // Delete plan
  const [result] = await pool.query("DELETE FROM dietplan WHERE id = ?", [id]);
  if (result.affectedRows === 0) throw { status: 404, message: "Diet plan not found" };

  return true;
};

// ----- ASSIGN DIET PLAN TO MEMBER -----
export const assignDietPlanService = async (memberId, dietPlanId) => {
  // Check if assignment exists
  const [existing] = await pool.query(
    "SELECT * FROM dietplanassignment WHERE memberId = ? AND dietPlanId = ?",
    [memberId, dietPlanId]
  );
  if (existing.length) throw { status: 400, message: "Diet plan already assigned to member" };

  // Insert assignment
  await pool.query(
    "INSERT INTO dietplanassignment (memberId, dietPlanId) VALUES (?, ?)",
    [memberId, dietPlanId]
  );

  return getDietPlanByIdService(dietPlanId);
};

// ----- GET MEMBER DIET PLANS -----
export const getMemberDietPlanService = async (memberId) => {
  const [assignments] = await pool.query(
    `SELECT a.id AS assignmentId, a.assignedAt, d.id AS dietPlanId, d.title, d.notes,
            m.id AS mealId, m.time AS mealTime, m.food AS mealFood
     FROM dietplanassignment a
     JOIN dietplan d ON a.dietPlanId = d.id
     LEFT JOIN dietmeal m ON d.id = m.dietPlanId
     WHERE a.memberId = ?
     ORDER BY a.id DESC`,
    [memberId]
  );

  // Format meals under diet plans
  const plans = {};
  assignments.forEach(a => {
    if (!plans[a.dietPlanId]) {
      plans[a.dietPlanId] = { 
        id: a.dietPlanId, 
        assignmentId: a.assignmentId,
        assignedAt: a.assignedAt,
        title: a.title, 
        notes: a.notes, 
        meals: [] 
      };
    }
    if (a.mealId) {
      plans[a.dietPlanId].meals.push({
        id: a.mealId,
        time: a.mealTime,
        food: a.mealFood
      });
    }
  });

  return Object.values(plans);
};
