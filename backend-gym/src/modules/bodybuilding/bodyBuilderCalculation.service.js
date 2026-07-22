export const calculateBodyBuilderMetrics = (data) => {
  const gender = (data.gender || 'male').toLowerCase();
  const age = parseInt(data.age);
  const weight_kg = parseFloat(data.weight_kg);
  const height_cm = parseFloat(data.height_cm);
  const neck_cm = parseFloat(data.neck_cm);
  const waist_cm = parseFloat(data.waist_cm);
  const hip_cm = data.hip_cm ? parseFloat(data.hip_cm) : null;
  const activity_level = (data.activity_level || 'active').toLowerCase();
  const fitness_goal = (data.fitness_goal || 'muscle gain').toLowerCase().replace('_', ' ');
  const resting_hr = data.resting_hr ? parseInt(data.resting_hr) : null;

  // Basic numeric validation
  if (isNaN(age) || isNaN(weight_kg) || isNaN(height_cm) || isNaN(neck_cm) || isNaN(waist_cm)) {
    throw new Error("Invalid inputs: basic fields must be numeric");
  }

  // 1. BMI
  const bmi = weight_kg / Math.pow(height_cm / 100, 2);
  let bmi_status = 'Normal';
  if (bmi < 18.5) {
    bmi_status = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 25.0) {
    bmi_status = 'Normal';
  } else if (bmi >= 25.0 && bmi < 30.0) {
    bmi_status = 'Overweight';
  } else if (bmi >= 30.0) {
    bmi_status = 'Obese';
  }

  // 2. BMR (Mifflin-St Jeor)
  let bmr = 0;
  if (gender === 'male') {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
  } else {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  }

  // 3. TDEE
  let activity_multiplier = 1.725;
  if (activity_level === 'sedentary') {
    activity_multiplier = 1.200;
  } else if (activity_level === 'light') {
    activity_multiplier = 1.375;
  } else if (activity_level === 'moderate') {
    activity_multiplier = 1.550;
  } else if (activity_level === 'active') {
    activity_multiplier = 1.725;
  }
  const tdee = bmr * activity_multiplier;

  // 4. Target Calories
  let target_calories = tdee;
  if (fitness_goal === 'fat loss' || fitness_goal === 'fat_loss') {
    target_calories = tdee - 500;
  } else if (fitness_goal === 'maintenance') {
    target_calories = tdee;
  } else if (fitness_goal === 'muscle gain' || fitness_goal === 'muscle_gain' || fitness_goal === 'body builder' || fitness_goal === 'body_builder' || fitness_goal === 'bodybuilder' || fitness_goal === 'bodybuilding') {
    target_calories = tdee + 350;
  }
  // Safety boundary
  if (target_calories < bmr) {
    target_calories = bmr;
  }

  // 5. Body Fat Percentage (US Navy Method)
  let body_fat_percentage = 0;
  if (gender === 'male') {
    const diff = waist_cm - neck_cm;
    if (diff <= 0) {
      throw new Error("Validation Error: Waist measurement must be greater than neck measurement for male members.");
    }
    body_fat_percentage = 86.010 * Math.log10(diff) - 70.041 * Math.log10(height_cm) + 36.76;
  } else {
    if (hip_cm === null || isNaN(hip_cm)) {
      throw new Error("Validation Error: Hip measurement is required for female members.");
    }
    const diff = waist_cm + hip_cm - neck_cm;
    if (diff <= 0) {
      throw new Error("Validation Error: Waist + Hip measurement must be greater than neck measurement for female members.");
    }
    body_fat_percentage = 163.205 * Math.log10(diff) - 97.684 * Math.log10(height_cm) - 78.387;
  }

  // 6. Lean Body Mass
  const lean_body_mass_kg = weight_kg * (1 - (body_fat_percentage / 100));

  // 7. Macronutrient Allocation
  const protein_grams = lean_body_mass_kg * 2.2;
  const protein_calories = protein_grams * 4;
  const fat_calories = target_calories * 0.25;
  const fat_grams = fat_calories / 9;
  const carb_calories = target_calories - (protein_calories + fat_calories);
  const carb_grams = carb_calories / 4;

  // 8. Ideal Body Weight (Devine Formula)
  const inches_over_60 = (height_cm / 2.54) - 60;
  let ideal_body_weight_kg = 0;
  if (gender === 'male') {
    ideal_body_weight_kg = 50.0 + (2.3 * inches_over_60);
  } else {
    ideal_body_weight_kg = 45.5 + (2.3 * inches_over_60);
  }

  // 9. Waist-to-Hip Ratio
  let waist_to_hip_ratio = null;
  if (!(gender === 'male' && hip_cm === null)) {
    if (hip_cm && hip_cm > 0) {
      waist_to_hip_ratio = waist_cm / hip_cm;
    }
  }

  // 10. Target Heart Rate Zones (Karvonen Method)
  let max_heart_rate = null;
  let heart_rate_reserve = null;
  let fat_burn_zone = { low: null, high: null };
  let cardio_endurance_zone = { low: null, high: null };

  if (resting_hr !== null && !isNaN(resting_hr)) {
    max_heart_rate = 220 - age;
    heart_rate_reserve = max_heart_rate - resting_hr;
    fat_burn_zone = {
      low: parseFloat(((heart_rate_reserve * 0.60) + resting_hr).toFixed(2)),
      high: parseFloat(((heart_rate_reserve * 0.70) + resting_hr).toFixed(2))
    };
    cardio_endurance_zone = {
      low: parseFloat(((heart_rate_reserve * 0.70) + resting_hr).toFixed(2)),
      high: parseFloat(((heart_rate_reserve * 0.80) + resting_hr).toFixed(2))
    };
  }

  return {
    bmi: parseFloat(bmi.toFixed(2)),
    bmi_status,
    bmr: parseFloat(bmr.toFixed(2)),
    activity_multiplier,
    tdee: parseFloat(tdee.toFixed(2)),
    target_calories: parseFloat(target_calories.toFixed(2)),
    body_fat_percentage: parseFloat(body_fat_percentage.toFixed(2)),
    lean_body_mass_kg: parseFloat(lean_body_mass_kg.toFixed(2)),
    macros: {
      protein_grams: parseFloat(protein_grams.toFixed(2)),
      protein_calories: parseFloat(protein_calories.toFixed(2)),
      fat_grams: parseFloat(fat_grams.toFixed(2)),
      fat_calories: parseFloat(fat_calories.toFixed(2)),
      carb_grams: parseFloat(carb_grams.toFixed(2)),
      carb_calories: parseFloat(carb_calories.toFixed(2))
    },
    ideal_body_weight_kg: parseFloat(ideal_body_weight_kg.toFixed(2)),
    waist_to_hip_ratio: waist_to_hip_ratio ? parseFloat(waist_to_hip_ratio.toFixed(2)) : null,
    max_heart_rate,
    heart_rate_reserve,
    fat_burn_zone,
    cardio_endurance_zone
  };
};
