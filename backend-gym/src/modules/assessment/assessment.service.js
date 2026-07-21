import { PrismaClient } from '@prisma/client';
import { AssessmentEngine } from './assessment.engine.js';
import { validateAssessmentInputs } from './assessment.validator.js';
import { LeaderboardEngine } from '../leaderboard/leaderboard.engine.js';
import { dispatchNotification } from "../../utils/notificationDispatcher.js";
import { pool } from "../../config/db.js";

const prisma = new PrismaClient();
const engine = new AssessmentEngine();

export const createAssessment = async (data, createdBy) => {
  // Validate Inputs
  const validation = validateAssessmentInputs(data);
  if (!validation.isValid) {
    const error = new Error('Validation Failed');
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  // Check if member exists
  const member = await prisma.member.findUnique({ 
    where: { id: data.memberId },
    select: { email: true, phone: true, fullName: true, id: true }
  });
  if (!member) {
    const error = new Error('Member not found');
    error.status = 404;
    throw error;
  }

  // Calculate Metrics
  const calculated = engine.calculateAll(data);
  
  // Leaderboard Calculation
  const baselineAssessment = await prisma.member_assessments.findFirst({
    where: { memberId: data.memberId, is_baseline: true }
  });

  const demographic_multiplier = LeaderboardEngine.getDemographicMultiplier(data.age_at_assessment, data.gender_at_assessment);
  
  const is_baseline = !baselineAssessment;
  const baseline_bf  = baselineAssessment ? Number(baselineAssessment.body_fat_percentage) : calculated.metrics.body_fat_percentage;
  const baseline_lbm = baselineAssessment ? Number(baselineAssessment.lean_body_mass)       : calculated.metrics.lean_body_mass;
  const current_bf   = calculated.metrics.body_fat_percentage;
  const current_lbm  = calculated.metrics.lean_body_mass;

  // Calculate all 3 goal scores — spec: no demographic multipliers
  const { fat_loss_score, muscle_gain_score, maintenance_score } = LeaderboardEngine.calculateAllScores({
    baseline_bf,  current_bf,
    baseline_lbm, current_lbm
  });

  // final_leaderboard_score = the score for the member's chosen goal
  const final_leaderboard_score = LeaderboardEngine.calculateScore({
    fitness_goal: data.fitness_goal,
    baseline_bf,  current_bf,
    baseline_lbm, current_lbm
  });

  // Map to DB via Prisma using validated schema fields
  const newAssessment = await prisma.member_assessments.create({
    data: {
      memberId: data.memberId,
      createdBy: createdBy || 1,
      engine_version: engine.config.ENGINE_VERSION,
      config_snapshot: JSON.stringify(engine.config),
      
      // Inputs
      age_at_assessment: data.age_at_assessment,
      gender_at_assessment: data.gender_at_assessment,
      weight_kg: data.weight_kg,
      height_cm: data.height_cm,
      neck_cm: data.neck_cm,
      waist_cm: data.waist_cm,
      hip_cm: data.hip_cm,
      resting_hr: data.resting_hr,
      activity_level: data.activity_level,
      fitness_goal: data.fitness_goal,
      
      // Output Metrics
      bmi: calculated.metrics.bmi,
      body_fat_percentage: calculated.metrics.body_fat_percentage,
      lean_body_mass: calculated.metrics.lean_body_mass,
      ideal_body_weight: calculated.metrics.ideal_body_weight,
      waist_to_hip_ratio: calculated.metrics.waist_to_hip_ratio,
      bmr: calculated.metrics.bmr,
      tdee: calculated.metrics.tdee,
      target_calories: calculated.metrics.target_calories,
      
      // Macros
      protein_grams: calculated.macros.protein_grams,
      fat_grams: calculated.macros.fat_grams,
      carb_grams: calculated.macros.carb_grams,
      
      // Leaderboard Data
      is_baseline: is_baseline,
      baseline_bf_percent: baseline_bf,
      baseline_lbm: baseline_lbm,
      demographic_multiplier: demographic_multiplier,
      final_leaderboard_score: final_leaderboard_score,

      // Dashboard metadata
      metrics_output: JSON.stringify(calculated.dashboard_data)
    }
  });

  // Optional: Update extra leaderboard columns directly in MySQL if present
  try {
    await pool.query(
      `UPDATE member_assessments 
       SET current_bf_percent = ?, current_lbm = ?, fat_loss_score = ?, muscle_gain_score = ?, maintenance_score = ? 
       WHERE id = ?`,
      [current_bf, current_lbm, fat_loss_score, muscle_gain_score, maintenance_score, newAssessment.id]
    );
  } catch (err) {
    // Ignore if columns are not present or optional
  }

  // 1. Dispatch General Progress Report
  const reportMessage = `Hi ${member.fullName},\n\nYour new fitness assessment is ready!\n\nMetrics:\nBMI: ${calculated.metrics.bmi}\nBody Fat: ${calculated.metrics.body_fat_percentage}%\nLean Body Mass: ${calculated.metrics.lean_body_mass} kg\nTarget Calories: ${calculated.metrics.target_calories} kcal\n\nKeep up the great work!`;
  
  if (member.email) {
    dispatchNotification({
      type: "email",
      to: member.email,
      subject: "Your New Fitness Assessment Report",
      message: reportMessage
    }).catch(err => console.error("Failed to send assessment email notification:", err));
  }

  if (member.phone) {
    dispatchNotification({
      type: "whatsapp",
      to: member.phone,
      message: reportMessage
    }).catch(err => console.error("Failed to send assessment whatsapp notification:", err));
  }

  // 2. Dispatch Milestone/Target Reached Alert (if body fat percentage drops below 15%)
  if (calculated.metrics.body_fat_percentage <= 15) {
    const milestoneMessage = `🔥 Milestone Reached! Congratulations ${member.fullName}, your body fat percentage is now down to ${calculated.metrics.body_fat_percentage}%! Exceptional progress!`;
    
    if (member.phone) {
      dispatchNotification({
        type: "whatsapp",
        to: member.phone,
        message: milestoneMessage
      }).catch(err => console.error("Failed to send milestone whatsapp notification:", err));
    }
  }

  return newAssessment;
};

export const getMemberAssessments = async (memberId) => {
  const parsedId = parseInt(memberId);
  if (isNaN(parsedId)) return [];
  return await prisma.member_assessments.findMany({
    where: { memberId: parsedId },
    orderBy: { assessment_date: 'desc' }
  });
};

export const getLatestAssessment = async (memberId) => {
  const parsedId = parseInt(memberId);
  if (isNaN(parsedId)) {
    const error = new Error('Invalid member ID');
    error.status = 400;
    throw error;
  }

  const result = await prisma.member_assessments.findFirst({
    where: { memberId: parsedId },
    orderBy: { assessment_date: 'desc' }
  });

  if (!result) {
    const error = new Error('No assessment records found.');
    error.status = 404;
    throw error;
  }

  let dashboardData = {};
  if (result.metrics_output) {
    try {
      dashboardData = typeof result.metrics_output === 'string'
        ? JSON.parse(result.metrics_output)
        : result.metrics_output;
    } catch (e) {
      console.error("Error parsing metrics_output:", e);
    }
  }

  return {
    ...result,
    metrics: {
      bmi: result.bmi,
      body_fat_percentage: result.body_fat_percentage,
      lean_body_mass: result.lean_body_mass,
      ideal_body_weight: result.ideal_body_weight,
      waist_to_hip_ratio: result.waist_to_hip_ratio,
      bmr: result.bmr,
      tdee: result.tdee,
      target_calories: result.target_calories
    },
    inputs: {
      fitness_goal: result.fitness_goal,
      weight_kg: result.weight_kg,
      height_cm: result.height_cm,
      neck_cm: result.neck_cm,
      waist_cm: result.waist_cm,
      hip_cm: result.hip_cm,
      resting_hr: result.resting_hr,
      activity_level: result.activity_level
    },
    macros: {
      protein_grams: result.protein_grams,
      fat_grams: result.fat_grams,
      carb_grams: result.carb_grams
    },
    dashboard_data: dashboardData
  };
};

export const getAssessmentHistory = async (memberId) => {
  const parsedId = parseInt(memberId);
  if (isNaN(parsedId)) return [];

  const records = await prisma.member_assessments.findMany({
    where: { memberId: parsedId },
    orderBy: { assessment_date: 'asc' }
  });

  return records.map(record => ({
    ...record,
    metrics: {
      bmi: record.bmi,
      body_fat_percentage: record.body_fat_percentage,
      lean_body_mass: record.lean_body_mass,
      ideal_body_weight: record.ideal_body_weight,
      waist_to_hip_ratio: record.waist_to_hip_ratio,
      bmr: record.bmr,
      tdee: record.tdee,
      target_calories: record.target_calories
    },
    inputs: {
      fitness_goal: record.fitness_goal,
      weight_kg: record.weight_kg,
      height_cm: record.height_cm
    },
    macros: {
      protein_grams: record.protein_grams,
      fat_grams: record.fat_grams,
      carb_grams: record.carb_grams
    }
  }));
};
