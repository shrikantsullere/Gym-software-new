import { pool } from '../../config/db.js';
import { LeaderboardEngine } from './leaderboard.engine.js';

/**
 * Get goal-based leaderboard scoped to an optional branchId.
 * Includes members of that branch as well as unassigned members (branchId IS NULL) of the same gym.
 */
export const getLeaderboardByGoal = async (branchId, fitnessGoal = 'fat_loss', limit = 50) => {
  const normalizedGoal = (fitnessGoal || 'fat_loss').toLowerCase();

  // Find adminId for the given branchId to support unassigned gym members
  let adminId = null;
  if (branchId && branchId !== 'all' && branchId !== '0' && parseInt(branchId) > 0) {
    try {
      const [bRows] = await pool.query(`SELECT adminId FROM branch WHERE id = ?`, [parseInt(branchId)]);
      if (bRows.length) {
        adminId = bRows[0].adminId;
      }
    } catch (e) {
      console.error("Error fetching branch adminId:", e);
    }
  }

  let sql = `
    SELECT 
      ma.id AS assessmentId,
      ma.memberId,
      ma.fitness_goal,
      ma.body_fat_percentage,
      ma.lean_body_mass,
      ma.is_baseline,
      ma.assessment_date,
      ma.createdAt,
      m.fullName,
      m.branchId,
      u.profileImage
    FROM member_assessments ma
    JOIN member m ON ma.memberId = m.id
    LEFT JOIN user u ON m.userId = u.id
  `;

  const params = [];

  if (branchId && branchId !== 'all' && branchId !== '0' && parseInt(branchId) > 0) {
    if (adminId) {
      sql += ` WHERE (m.branchId = ? OR m.branchId IS NULL OR m.adminId = ?)`;
      params.push(parseInt(branchId), adminId);
    } else {
      sql += ` WHERE (m.branchId = ? OR m.branchId IS NULL)`;
      params.push(parseInt(branchId));
    }
  }

  sql += ` ORDER BY ma.memberId ASC, ma.id ASC`;

  const [rows] = await pool.query(sql, params);

  // Group assessments by memberId
  const memberAssessmentsMap = {};
  for (const row of rows) {
    if (!memberAssessmentsMap[row.memberId]) {
      memberAssessmentsMap[row.memberId] = [];
    }
    memberAssessmentsMap[row.memberId].push(row);
  }

  const qualifiedMembers = [];

  for (const memberIdStr in memberAssessmentsMap) {
    const assessments = memberAssessmentsMap[memberIdStr];
    if (!assessments || assessments.length === 0) continue;

    // Identify baseline assessment (row with is_baseline = 1 or earliest row)
    const baselineAssessment = assessments.find(a => a.is_baseline === 1 || a.is_baseline === true) || assessments[0];

    // Identify current assessment (latest assessment row)
    const currentAssessment = assessments[assessments.length - 1];

    // Verify goal matches target goal
    const memberGoal = (currentAssessment.fitness_goal || baselineAssessment.fitness_goal || '').toLowerCase();
    if (memberGoal !== normalizedGoal) continue;

    // Parse baseline and current body composition metrics
    const baseline_bf = parseFloat(baselineAssessment.body_fat_percentage);
    const baseline_lbm = parseFloat(baselineAssessment.lean_body_mass);
    const current_bf = parseFloat(currentAssessment.body_fat_percentage);
    const current_lbm = parseFloat(currentAssessment.lean_body_mass);

    // Eligibility check: non-zero baseline & valid values
    if (
      isNaN(baseline_bf) || baseline_bf <= 0 ||
      isNaN(baseline_lbm) || baseline_lbm <= 0 ||
      isNaN(current_bf) || current_bf < 0 ||
      isNaN(current_lbm) || current_lbm < 0
    ) {
      continue;
    }

    // Calculate score
    const score = LeaderboardEngine.calculateScore({
      fitness_goal: memberGoal,
      baseline_bf,
      current_bf,
      baseline_lbm,
      current_lbm
    });

    if (isNaN(score) || !isFinite(score)) continue;

    const latestDate = currentAssessment.assessment_date || currentAssessment.createdAt;

    qualifiedMembers.push({
      memberId: parseInt(memberIdStr),
      fullName: currentAssessment.fullName || 'Member',
      profileImage: currentAssessment.profileImage || null,
      fitness_goal: memberGoal,
      baseline_bf_percent: parseFloat(baseline_bf.toFixed(2)),
      current_bf_percent: parseFloat(current_bf.toFixed(2)),
      baseline_lbm: parseFloat(baseline_lbm.toFixed(2)),
      current_lbm: parseFloat(current_lbm.toFixed(2)),
      score: parseFloat(score.toFixed(2)),
      latestTimestamp: latestDate ? new Date(latestDate).getTime() : 0
    });
  }

  // Ranking & Tie-Breaking
  qualifiedMembers.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.latestTimestamp !== a.latestTimestamp) {
      return b.latestTimestamp - a.latestTimestamp;
    }
    return a.memberId - b.memberId;
  });

  const sliced = qualifiedMembers.slice(0, limit);

  return sliced.map((item, index) => ({
    rank: index + 1,
    member_id: item.memberId,
    memberId: item.memberId,
    member_name: item.fullName,
    fullName: item.fullName,
    profile_image: item.profileImage,
    profileImage: item.profileImage,
    avatar: item.profileImage,
    fitness_goal: item.fitness_goal,
    baseline_bf_percent: item.baseline_bf_percent,
    current_bf_percent: item.current_bf_percent,
    baseline_lbm: item.baseline_lbm,
    current_lbm: item.current_lbm,
    score: item.score
  }));
};
