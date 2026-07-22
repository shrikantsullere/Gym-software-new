/**
 * Leaderboard Scoring Engine
 * Spec compliant: Goal-based percentage scoring with safety clamps and no age/gender multipliers.
 */

export class LeaderboardEngine {
  /**
   * Kept for backward compatibility.
   */
  static getDemographicMultiplier(age, gender) {
    const isMale = (gender || '').toLowerCase() === 'male';
    if (age < 18) return isMale ? 0.95 : 1.06;
    if (age >= 18 && age <= 29) return isMale ? 1.00 : 1.12;
    if (age >= 30 && age <= 35) return isMale ? 1.04 : 1.16;
    if (age >= 36 && age <= 40) return isMale ? 1.09 : 1.22;
    if (age >= 41 && age <= 45) return isMale ? 1.15 : 1.29;
    if (age >= 46 && age <= 50) return isMale ? 1.22 : 1.37;
    if (age >= 51 && age <= 55) return isMale ? 1.30 : 1.46;
    if (age >= 56 && age <= 60) return isMale ? 1.39 : 1.56;
    return isMale ? 1.50 : 1.68;
  }

  /**
   * Calculate leaderboard score per exact specification:
   *
   * 1. Fat Loss:
   *    Fat Loss Score = ((Baseline BF% - Current BF%) / Baseline BF%) * 100
   *
   * 2. Muscle Gain:
   *    Muscle Gain Score = ((Current LBM - Baseline LBM) / Baseline LBM) * 100
   *
   * 3. Maintenance:
   *    Maintenance Score = MAX(0, 100 - ABS(Current BF% - Baseline BF%) - ABS(Current LBM - Baseline LBM))
   */
  static calculateScore(member) {
    const { fitness_goal, baseline_bf, current_bf, baseline_lbm, current_lbm } = member;

    // Safety checks for missing or non-numeric values
    if (
      baseline_bf === undefined || baseline_bf === null || isNaN(Number(baseline_bf)) ||
      current_bf === undefined || current_bf === null || isNaN(Number(current_bf)) ||
      baseline_lbm === undefined || baseline_lbm === null || isNaN(Number(baseline_lbm)) ||
      current_lbm === undefined || current_lbm === null || isNaN(Number(current_lbm))
    ) {
      return 0.0;
    }

    const bBF = Number(baseline_bf);
    const cBF = Number(current_bf);
    const bLBM = Number(baseline_lbm);
    const cLBM = Number(current_lbm);

    let score = 0;

    if (fitness_goal === 'fat_loss') {
      if (bBF <= 0) return 0.0; // Prevent division by zero
      score = ((bBF - cBF) / bBF) * 100;
    } else if (fitness_goal === 'muscle_gain') {
      if (bLBM <= 0) return 0.0; // Prevent division by zero
      score = ((cLBM - bLBM) / bLBM) * 100;
    } else if (fitness_goal === 'maintenance') {
      const bfDiff = Math.abs(cBF - bBF);
      const lbmDiff = Math.abs(cLBM - bLBM);
      score = Math.max(0, 100 - bfDiff - lbmDiff);
    } else {
      return 0.0;
    }

    if (isNaN(score) || !isFinite(score)) return 0.0;

    return parseFloat(score.toFixed(2));
  }

  static calculateAllScores(member) {
    return {
      fat_loss_score: LeaderboardEngine.calculateScore({ ...member, fitness_goal: 'fat_loss' }),
      muscle_gain_score: LeaderboardEngine.calculateScore({ ...member, fitness_goal: 'muscle_gain' }),
      maintenance_score: LeaderboardEngine.calculateScore({ ...member, fitness_goal: 'maintenance' }),
    };
  }
}
