import { pool } from '../../config/db.js';
import { LeaderboardEngine } from './leaderboard.engine.js';

/**
 * Format YYYY-MM into a readable label (e.g. "2026-07" -> "July 2026")
 */
export const formatMonthLabel = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey || '';
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Get previous month key (e.g. "2026-07" -> "2026-06", "2026-01" -> "2025-12")
 */
export const getPreviousMonthKey = (monthKey) => {
  if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return null;
  const [year, month] = monthKey.split('-').map(Number);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
};

/**
 * Fetch available months from database for which assessment data exists
 */
export const getAvailableMonths = async (branchId) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT DATE_FORMAT(COALESCE(assessment_date, createdAt), '%Y-%m') AS monthKey
      FROM member_assessments
      WHERE COALESCE(assessment_date, createdAt) IS NOT NULL
    `);

    const monthsSet = new Set();
    for (const r of rows) {
      if (r.monthKey && /^\d{4}-\d{2}$/.test(r.monthKey)) {
        monthsSet.add(r.monthKey);
      }
    }

    // Ensure current month is included
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(currentKey);

    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted.map(k => ({
      monthKey: k,
      key: k,
      label: formatMonthLabel(k)
    }));
  } catch (e) {
    console.error("Error fetching available months:", e);
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return [{ monthKey: currentKey, key: currentKey, label: formatMonthLabel(currentKey) }];
  }
};

/**
 * Internal helper to calculate monthly rankings for a specific monthKey (YYYY-MM)
 */
const getMonthlyRankings = async (branchId, targetGoal = 'fat_loss', monthKey) => {
  const normalizedGoal = targetGoal.toLowerCase();

  // Determine end of the target month
  const [yr, mo] = monthKey.split('-').map(Number);
  const lastDayNum = new Date(yr, mo, 0).getDate();
  const endOfMonthStr = `${monthKey}-${String(lastDayNum).padStart(2, '0')} 23:59:59`;

  // Branch & Admin lookup
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
      ma.weight_kg,
      ma.height_cm,
      ma.bmi,
      ma.age_at_assessment,
      ma.gender_at_assessment,
      ma.is_baseline,
      ma.assessment_date,
      ma.createdAt,
      m.fullName,
      m.gender AS memberGender,
      m.branchId,
      m.goal AS memberGoal,
      u.profileImage
    FROM member_assessments ma
    JOIN member m ON ma.memberId = m.id
    LEFT JOIN user u ON m.userId = u.id
    WHERE (ma.assessment_date <= ? OR ma.createdAt <= ?)
  `;

  const params = [endOfMonthStr, endOfMonthStr];

  if (branchId && branchId !== 'all' && branchId !== '0' && parseInt(branchId) > 0) {
    if (adminId) {
      sql += ` AND (m.branchId = ? OR m.branchId IS NULL OR m.adminId = ?)`;
      params.push(parseInt(branchId), adminId);
    } else {
      sql += ` AND (m.branchId = ? OR m.branchId IS NULL)`;
      params.push(parseInt(branchId));
    }
  }

  sql += ` ORDER BY ma.memberId ASC, ma.id ASC`;

  const [rows] = await pool.query(sql, params);

  // Group assessments by memberId
  const memberMap = {};
  for (const row of rows) {
    if (!memberMap[row.memberId]) {
      memberMap[row.memberId] = [];
    }
    memberMap[row.memberId].push(row);
  }

  const qualifiedMembers = [];

  for (const memberIdStr in memberMap) {
    const assessments = memberMap[memberIdStr];
    if (!assessments || assessments.length === 0) continue;

    // Baseline assessment: is_baseline = 1 or earliest row
    const baselineAssessment = assessments.find(a => a.is_baseline === 1 || a.is_baseline === true) || assessments[0];

    // Current assessment for this month: latest row on or before end of month
    const currentAssessment = assessments[assessments.length - 1];

    // Verify goal matches target goal strictly
    const memberGoal = (currentAssessment.fitness_goal || baselineAssessment.fitness_goal || '').toLowerCase();
    if (memberGoal !== normalizedGoal) continue;

    // Metrics
    const bBF = parseFloat(baselineAssessment.body_fat_percentage);
    const cBF = parseFloat(currentAssessment.body_fat_percentage);
    const bLBM = parseFloat(baselineAssessment.lean_body_mass);
    const cLBM = parseFloat(currentAssessment.lean_body_mass);

    if (
      isNaN(bBF) || bBF <= 0 ||
      isNaN(bLBM) || bLBM <= 0 ||
      isNaN(cBF) || cBF < 0 ||
      isNaN(cLBM) || cLBM < 0
    ) {
      continue;
    }

    const score = LeaderboardEngine.calculateScore({
      fitness_goal: memberGoal,
      baseline_bf: bBF,
      current_bf: cBF,
      baseline_lbm: bLBM,
      current_lbm: cLBM
    });

    if (isNaN(score) || !isFinite(score)) continue;

    const bWeight = parseFloat(baselineAssessment.weight_kg) || 0;
    const cWeight = parseFloat(currentAssessment.weight_kg) || 0;
    const weightDiff = cWeight - bWeight;

    const bBmi = parseFloat(baselineAssessment.bmi) || 0;
    const cBmi = parseFloat(currentAssessment.bmi) || 0;

    const age = currentAssessment.age_at_assessment || '-';
    const gender = currentAssessment.gender_at_assessment || currentAssessment.memberGender || '-';
    const height_cm = currentAssessment.height_cm || baselineAssessment.height_cm || '-';

    // Calculate Gain, Loss, Overall Improvement
    const lbmDiff = cLBM - bLBM;
    const bfDiff = bBF - cBF; // Positive if BF decreased

    let memberGain = '0.00 kg';
    let memberLoss = '0.00%';
    let overallImprovement = `${score.toFixed(2)}%`;

    if (normalizedGoal === 'fat_loss') {
      memberGain = lbmDiff > 0 ? `+${lbmDiff.toFixed(2)} kg` : '0.00 kg';
      memberLoss = bfDiff > 0 ? `-${bfDiff.toFixed(2)}%` : '0.00%';
      overallImprovement = `${score.toFixed(2)}%`;
    } else if (normalizedGoal === 'muscle_gain') {
      memberGain = lbmDiff > 0 ? `+${lbmDiff.toFixed(2)} kg` : '0.00 kg';
      memberLoss = bfDiff > 0 ? `-${bfDiff.toFixed(2)}%` : '0.00%';
      overallImprovement = `${score.toFixed(2)}%`;
    } else if (normalizedGoal === 'maintenance') {
      memberGain = `${lbmDiff >= 0 ? '+' : ''}${lbmDiff.toFixed(2)} kg`;
      const bfChange = cBF - bBF;
      memberLoss = `${bfChange <= 0 ? '' : '+'}${bfChange.toFixed(2)}%`;
      overallImprovement = `${score.toFixed(2)} pts`;
    }

    const latestDate = currentAssessment.assessment_date || currentAssessment.createdAt;

    qualifiedMembers.push({
      memberId: parseInt(memberIdStr, 10),
      fullName: currentAssessment.fullName || 'Member',
      profileImage: currentAssessment.profileImage || null,
      fitness_goal: memberGoal,
      monthKey: monthKey,
      monthLabel: formatMonthLabel(monthKey),
      age: age,
      gender: gender,
      height_cm: height_cm,
      start_weight: bWeight,
      current_weight: cWeight,
      weight_change: parseFloat(weightDiff.toFixed(2)),
      weight_change_str: `${weightDiff >= 0 ? '+' : ''}${weightDiff.toFixed(2)} kg`,
      baseline_bf_percent: parseFloat(bBF.toFixed(2)),
      current_bf_percent: parseFloat(cBF.toFixed(2)),
      baseline_lbm: parseFloat(bLBM.toFixed(2)),
      current_lbm: parseFloat(cLBM.toFixed(2)),
      baseline_bmi: parseFloat(bBmi.toFixed(2)),
      current_bmi: parseFloat(cBmi.toFixed(2)),
      member_gain: memberGain,
      member_loss: memberLoss,
      overall_improvement: overallImprovement,
      score: parseFloat(score.toFixed(2)),
      latestTimestamp: latestDate ? new Date(latestDate).getTime() : 0
    });
  }

  // Sort: score DESC, latestTimestamp DESC, memberId ASC
  qualifiedMembers.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.latestTimestamp !== a.latestTimestamp) {
      return b.latestTimestamp - a.latestTimestamp;
    }
    return a.memberId - b.memberId;
  });

  return qualifiedMembers.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
};

/**
 * Main service entry point for goal & month-wise leaderboard with rank changes
 */
export const getLeaderboardByGoal = async (branchId, fitnessGoal = 'fat_loss', monthKey = null, limit = 100) => {
  const normalizedGoal = (fitnessGoal || 'fat_loss').toLowerCase();
  const availableMonths = await getAvailableMonths(branchId);

  // If monthKey not passed or invalid, default to the latest available month
  let selectedMonthKey = monthKey;
  if (!selectedMonthKey || !/^\d{4}-\d{2}$/.test(selectedMonthKey)) {
    selectedMonthKey = availableMonths.length > 0 ? availableMonths[0].key : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  }

  const selectedMonthLabel = formatMonthLabel(selectedMonthKey);

  // Get rankings for selected month
  const currentRankings = await getMonthlyRankings(branchId, normalizedGoal, selectedMonthKey);

  // Get rankings for previous month for Rank Change calculations
  const prevMonthKey = getPreviousMonthKey(selectedMonthKey);
  let prevRankingsMap = new Map();
  if (prevMonthKey) {
    const prevRankings = await getMonthlyRankings(branchId, normalizedGoal, prevMonthKey);
    for (const p of prevRankings) {
      prevRankingsMap.set(p.memberId, p.rank);
    }
  }

  // Attach Rank Change and Previous Rank
  const finalLeaderboard = currentRankings.map(item => {
    const prevRank = prevRankingsMap.has(item.memberId) ? prevRankingsMap.get(item.memberId) : null;
    let rankChange = 'NEW';

    if (prevRank !== null) {
      const diff = prevRank - item.rank;
      if (diff > 0) {
        rankChange = `↑ +${diff}`;
      } else if (diff < 0) {
        rankChange = `↓ -${Math.abs(diff)}`;
      } else {
        rankChange = '—';
      }
    }

    return {
      rank: item.rank,
      member_id: item.memberId,
      memberId: item.memberId,
      member_name: item.fullName,
      fullName: item.fullName,
      profile_image: item.profileImage,
      profileImage: item.profileImage,
      avatar: item.profileImage,
      fitness_goal: item.fitness_goal,
      monthKey: selectedMonthKey,
      month_label: selectedMonthLabel,
      monthLabel: selectedMonthLabel,
      age: item.age,
      gender: item.gender,
      height_cm: item.height_cm,
      start_weight: item.start_weight,
      current_weight: item.current_weight,
      weight_change: item.weight_change,
      weight_change_str: item.weight_change_str,
      baseline_bf_percent: item.baseline_bf_percent,
      current_bf_percent: item.current_bf_percent,
      baseline_lbm: item.baseline_lbm,
      current_lbm: item.current_lbm,
      baseline_bmi: item.baseline_bmi,
      current_bmi: item.current_bmi,
      member_gain: item.member_gain,
      member_loss: item.member_loss,
      overall_improvement: item.overall_improvement,
      score: item.score,
      previous_rank: prevRank,
      previousRank: prevRank,
      rank_change: rankChange,
      rankChange: rankChange,
      status: 'Active'
    };
  });

  return {
    selectedMonth: selectedMonthKey,
    monthLabel: selectedMonthLabel,
    availableMonths: availableMonths,
    leaderboard: finalLeaderboard.slice(0, limit)
  };
};
