/**
 * GymCatalyst Engine Pipeline - Normalization Scoring & Demographic Multipliers
 */

export class LeaderboardEngine {
  /**
   * Get the exact Demographic Multiplier based on Age and Gender.
   * Based on the official GymCatalyst Engine V2 specification.
   */
  static getDemographicMultiplier(age, gender) {
    const isMale = gender.toLowerCase() === 'male';
    
    if (age < 18) return isMale ? 0.95 : 1.06;
    if (age >= 18 && age <= 29) return isMale ? 1.00 : 1.12;
    if (age >= 30 && age <= 35) return isMale ? 1.04 : 1.16;
    if (age >= 36 && age <= 40) return isMale ? 1.09 : 1.22;
    if (age >= 41 && age <= 45) return isMale ? 1.15 : 1.29;
    if (age >= 46 && age <= 50) return isMale ? 1.22 : 1.37;
    if (age >= 51 && age <= 55) return isMale ? 1.30 : 1.46;
    if (age >= 56 && age <= 60) return isMale ? 1.39 : 1.56;
    return isMale ? 1.50 : 1.68; // 61+
  }

  /**
   * Calculate the final normalized leaderboard score.
   * @param {Object} member - Data object containing baseline and current metrics.
   * Expected structure:
   * {
   *   fitness_goal: 'fat_loss' | 'muscle_gain' | 'maintenance',
   *   baseline_bf: number,
   *   current_bf: number,
   *   baseline_lbm: number,
   *   current_lbm: number,
   *   demographic_multiplier: number
   * }
   */
  static calculateScore(member) {
    let rawScore = 0;
    let finalScore = 0;

    // Safety check - if baseline data is missing, score is 0
    if (
      member.baseline_bf === undefined || member.baseline_bf === null ||
      member.baseline_lbm === undefined || member.baseline_lbm === null ||
      member.demographic_multiplier === undefined || member.demographic_multiplier === null
    ) {
      return 0.0;
    }

    if (member.fitness_goal === 'fat_loss') {
      if (member.baseline_bf <= 0) return 0.0; // Prevent division by zero
      rawScore = ((member.baseline_bf - member.current_bf) / member.baseline_bf) * 100;
      finalScore = rawScore * member.demographic_multiplier;

    } else if (member.fitness_goal === 'muscle_gain') {
      if (member.baseline_lbm <= 0) return 0.0; // Prevent division by zero
      rawScore = ((member.current_lbm - member.baseline_lbm) / member.baseline_lbm) * 100;
      finalScore = rawScore * member.demographic_multiplier;

    } else if (member.fitness_goal === 'maintenance') {
      let bfVariance = Math.abs(member.current_bf - member.baseline_bf);
      let lbmVariance = Math.abs(member.current_lbm - member.baseline_lbm);
      let totalVariance = bfVariance + lbmVariance;
      
      // Apply inverse multiplier buffer to protect scores against metabolic biological drift
      let bufferFactor = 2.0 - member.demographic_multiplier;
      finalScore = 100.0 - (totalVariance * bufferFactor);
    } else {
      // Default fallback
      return 0.0;
    }

    // Bind to object storage rounded cleanly for database efficiency
    return parseFloat(finalScore.toFixed(2));
  }
}
