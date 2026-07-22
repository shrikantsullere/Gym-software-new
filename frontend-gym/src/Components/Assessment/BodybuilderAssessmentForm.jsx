import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getCurrentStaffId } from '../../utils/staffUtils';

const BodybuilderAssessmentForm = () => {
  const [members, setMembers] = useState([]);
  const [units, setUnits] = useState({
    weight: 'kg',
    height: 'cm',
    neck: 'cm',
    waist: 'cm',
    hip: 'cm',
    biceps: 'cm',
    forearms: 'cm',
    thighs: 'cm',
    calves: 'cm'
  });

  const [formData, setFormData] = useState({
    memberId: '',
    assessment_date: new Date().toISOString().split('T')[0], // default to current date
    age_at_assessment: '',
    gender_at_assessment: 'male',
    weight_kg: '',
    height_cm: '',
    neck_cm: '',
    chest_cm: '',
    shoulders_cm: '',
    arms_cm: '',
    forearms_cm: '',
    waist_cm: '',
    hip_cm: '',
    thighs_cm: '',
    calves_cm: '',
    resting_hr: '',
    activity_level: 'Active',
    fitness_goal: 'Muscle Gain',
    coach_notes: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Conversion Helpers
  const convertValue = (val, fromUnit, toUnit) => {
    if (val === "" || val === undefined || val === null || isNaN(Number(val))) return "";
    const num = Number(val);
    if (fromUnit === 'kg' && toUnit === 'lb') return parseFloat((num * 2.20462).toFixed(2));
    if (fromUnit === 'lb' && toUnit === 'kg') return parseFloat((num * 0.453592).toFixed(2));
    if (fromUnit === 'cm' && toUnit === 'in') return parseFloat((num / 2.54).toFixed(2));
    if (fromUnit === 'in' && toUnit === 'cm') return parseFloat((num * 2.54).toFixed(2));
    return num;
  };

  const getDisplayValue = (dbVal, targetUnit, type) => {
    if (dbVal === "" || dbVal === undefined || dbVal === null || isNaN(Number(dbVal))) return "";
    const num = Number(dbVal);
    if (type === 'weight') {
      if (targetUnit === 'lb') return parseFloat((num * 2.20462).toFixed(2));
      return parseFloat(num.toFixed(2));
    } else {
      if (targetUnit === 'in') return parseFloat((num / 2.54).toFixed(2));
      return parseFloat(num.toFixed(2));
    }
  };

  const getStandardValue = (val, unit, type) => {
    if (val === "" || val === undefined || val === null || isNaN(Number(val))) return null;
    const num = Number(val);
    if (type === 'weight') {
      if (unit === 'lb') return parseFloat((num * 0.453592).toFixed(4));
      return num;
    } else {
      if (unit === 'in') return parseFloat((num * 2.54).toFixed(4));
      return num;
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const adminId = userObj.adminId || userObj.id;
          const roleId = Number(userObj.roleId);
          const roleName = (userObj.roleName || "").toLowerCase();
          
          let endpoint = `/members/admin/${adminId}`;
          if (roleId === 5 || roleName === 'personaltrainer') {
            const staffId = getCurrentStaffId(userObj);
            endpoint = `/members/trainer/${staffId}`;
          }

          if (adminId) {
            const res = await axiosInstance.get(endpoint);
            if (res.data && res.data.success) {
              const allFetchedMembers = res.data.data || [];
              setMembers(allFetchedMembers);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch members", err);
      }
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    if (location.state?.preselectMember) {
      setFormData(prev => ({ ...prev, memberId: location.state.preselectMember.toString() }));
    }
  }, [location.state]);

  // Auto-fill member details when a member is selected
  useEffect(() => {
    const fetchMemberData = async () => {
      if (formData.memberId && members.length > 0) {
        const selectedMember = members.find(m => m.id.toString() === formData.memberId.toString());
        if (selectedMember) {
          setFormData(prev => {
            let newGender = prev.gender_at_assessment;
            if (selectedMember.gender) {
              newGender = selectedMember.gender.toLowerCase();
            }

            let newAge = prev.age_at_assessment;
            if (selectedMember.dateOfBirth) {
              const dob = new Date(selectedMember.dateOfBirth);
              const today = new Date();
              let age = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
              }
              if (age > 0) {
                newAge = age.toString();
              }
            }

            let newGoal = prev.fitness_goal;
            const memberGoal = (selectedMember.goal || selectedMember.interestedIn || "").toLowerCase();
            if (memberGoal) {
              if (memberGoal.includes("weight gain") || memberGoal.includes("muscle") || memberGoal.includes("body building") || memberGoal.includes("bodybuilding")) {
                newGoal = "Muscle Gain";
              } else if (memberGoal.includes("fat loss") || memberGoal.includes("weight loss")) {
                newGoal = "Fat Loss";
              } else if (memberGoal.includes("strength") || memberGoal.includes("maintenance")) {
                newGoal = "Maintenance";
              }
            }

            return { ...prev, gender_at_assessment: newGender, age_at_assessment: newAge, fitness_goal: newGoal };
          });
          
          try {
            const res = await axiosInstance.get(`/v1/bodybuilding/${formData.memberId}`);
            if (res.data && res.data.success !== false && res.data.data && res.data.data.length > 0) {
              const latestLog = res.data.data[0];
              setFormData(prev => ({
                ...prev,
                gender_at_assessment: latestLog.gender || prev.gender_at_assessment,
                age_at_assessment: latestLog.age ? latestLog.age.toString() : prev.age_at_assessment,
                activity_level: latestLog.activity_level || prev.activity_level,
                fitness_goal: latestLog.fitness_goal || prev.fitness_goal,
                assessment_date: latestLog.assessment_date ? latestLog.assessment_date.split('T')[0] : prev.assessment_date,

                weight_kg: getDisplayValue(latestLog.weight_kg, units.weight, 'weight'),
                height_cm: getDisplayValue(latestLog.height_cm, units.height, 'length'),
                neck_cm: getDisplayValue(latestLog.neck_cm, units.neck, 'length'),
                chest_cm: latestLog.chest_cm || prev.chest_cm,
                shoulders_cm: latestLog.shoulders_cm || prev.shoulders_cm,
                arms_cm: getDisplayValue(latestLog.biceps_cm || latestLog.left_arm_cm || latestLog.right_arm_cm, units.biceps, 'length'),
                forearms_cm: getDisplayValue(latestLog.forearms_cm || latestLog.left_forearm_cm || latestLog.right_forearm_cm, units.forearms, 'length'),
                waist_cm: getDisplayValue(latestLog.waist_cm, units.waist, 'length'),
                hip_cm: getDisplayValue(latestLog.hip_cm, units.hip, 'length'),
                thighs_cm: getDisplayValue(latestLog.thighs_cm, units.thighs, 'length'),
                calves_cm: getDisplayValue(latestLog.calves_cm, units.calves, 'length'),
                coach_notes: latestLog.notes || prev.coach_notes
              }));
            } else {
              try {
                const healthRes = await axiosInstance.get(`/v1/health/${formData.memberId}`);
                if (healthRes.data && healthRes.data.success !== false && healthRes.data.data && healthRes.data.data.length > 0) {
                  const latestHealth = healthRes.data.data[0];
                  setFormData(prev => ({
                    ...prev,
                    weight_kg: getDisplayValue(latestHealth.weight, units.weight, 'weight'),
                    height_cm: getDisplayValue(latestHealth.height, units.height, 'length')
                  }));
                }
              } catch (hErr) {
                console.error("Failed to fetch health log fallback", hErr);
              }
            }
          } catch (err) {
            console.error("Failed to fetch past logs", err);
          }
        }
      }
    };
    fetchMemberData();
  }, [formData.memberId, members]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Allow empty values or decimals/digits only for numeric fields
    const numericFields = ['age_at_assessment', 'weight_kg', 'height_cm', 'neck_cm', 'chest_cm', 'shoulders_cm', 'arms_cm', 'forearms_cm', 'waist_cm', 'hip_cm', 'thighs_cm', 'calves_cm', 'resting_hr'];
    if (numericFields.includes(name)) {
      if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
        return; // Reject invalid non-numeric character
      }
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUnitChange = (e) => {
    const { name, value } = e.target; // name = 'weight', 'height', etc.; value = 'lb', 'in', etc.
    const prevUnit = units[name];
    if (prevUnit === value) return;

    setUnits(prev => ({ ...prev, [name]: value }));

    const fieldMapping = {
      weight: 'weight_kg',
      height: 'height_cm',
      neck: 'neck_cm',
      waist: 'waist_cm',
      hip: 'hip_cm',
      biceps: 'arms_cm',
      forearms: 'forearms_cm',
      thighs: 'thighs_cm',
      calves: 'calves_cm'
    };

    const fieldName = fieldMapping[name];
    if (fieldName && formData[fieldName] !== "") {
      const converted = convertValue(formData[fieldName], prevUnit, value);
      setFormData(prev => ({ ...prev, [fieldName]: converted }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    // Validate inputs
    const errors = {};
    if (!formData.memberId) errors.memberId = "Member is required.";
    if (!formData.assessment_date) errors.assessment_date = "Assessment date is required.";
    
    const age = parseInt(formData.age_at_assessment);
    if (isNaN(age) || age < 10 || age > 100) {
      errors.age = "Age must be an integer between 10 and 100.";
    }

    const stdWeight = getStandardValue(formData.weight_kg, units.weight, 'weight');
    if (stdWeight === null || stdWeight < 30.00 || stdWeight > 250.00) {
      errors.weight = "Weight must be between 30.00 kg and 250.00 kg (66.14 lb - 551.16 lb).";
    }

    const stdHeight = getStandardValue(formData.height_cm, units.height, 'length');
    if (stdHeight === null || stdHeight < 100.00 || stdHeight > 250.00) {
      errors.height = "Height must be between 100.00 cm and 250.00 cm (39.37 in - 98.43 in).";
    }

    const stdNeck = getStandardValue(formData.neck_cm, units.neck, 'length');
    if (stdNeck === null || stdNeck < 20.0 || stdNeck > 60.0) {
      errors.neck = "Neck must be between 20.0 cm and 60.0 cm (7.87 in - 23.62 in).";
    }

    const stdWaist = getStandardValue(formData.waist_cm, units.waist, 'length');
    if (stdWaist === null || stdWaist < 40.0 || stdWaist > 180.0) {
      errors.waist = "Waist must be between 40.0 cm and 180.0 cm (15.75 in - 70.87 in).";
    }

    const stdHip = getStandardValue(formData.hip_cm, units.hip, 'length');
    if (formData.gender_at_assessment === 'female') {
      if (stdHip === null || stdHip <= 0) {
        errors.hip = "Hip is required for female members.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError("Please fix the validation errors before submitting.");
      setLoading(false);
      return;
    }

    try {
      const dataToSubmit = {
        gender: formData.gender_at_assessment,
        age: age,
        weight_kg: stdWeight,
        height_cm: stdHeight,
        neck_cm: stdNeck,
        waist_cm: stdWaist,
        hip_cm: stdHip,
        activity_level: formData.activity_level,
        fitness_goal: formData.fitness_goal,
        biceps_cm: getStandardValue(formData.arms_cm, units.biceps, 'length'),
        forearms_cm: getStandardValue(formData.forearms_cm, units.forearms, 'length'),
        thighs_cm: getStandardValue(formData.thighs_cm, units.thighs, 'length'),
        calves_cm: getStandardValue(formData.calves_cm, units.calves, 'length'),
        assessment_date: formData.assessment_date,

        chest_cm: formData.chest_cm ? parseFloat(formData.chest_cm) : null,
        shoulders_cm: formData.shoulders_cm ? parseFloat(formData.shoulders_cm) : null,
        notes: formData.coach_notes
      };
      
      await axiosInstance.post(`/v1/bodybuilding/${formData.memberId}`, dataToSubmit);
      
      setSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <div className="col-12">
          
          <div className="card shadow-sm border-0 rounded-3">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-3 px-md-4">
              <h2 className="text-primary fw-bold mb-0">
                <i className="bi bi-person-bounding-box me-2"></i>Body Builder
              </h2>
              <p className="text-muted mt-2">Detailed muscle group measurements and progress tracking.</p>
            </div>
            
            <div className="card-body p-4">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}
              
              {success && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <div>Body Builder assessment saved successfully! Redirecting...</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <h5 className="mb-3 text-secondary border-bottom pb-2">Basic Info</h5>
                <div className="row g-3 mb-4">
                  
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Select Member <span className="text-danger">*</span></label>
                    <select required name="memberId" value={formData.memberId} onChange={handleChange} className={`form-select shadow-none ${validationErrors.memberId ? 'is-invalid' : ''}`}>
                      <option value="">-- Choose Member --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.phone ? `(${m.phone})` : ''} 
                        </option>
                      ))}
                    </select>
                    {validationErrors.memberId && <div className="invalid-feedback">{validationErrors.memberId}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Assessment Date <span className="text-danger">*</span></label>
                    <input required type="date" name="assessment_date" value={formData.assessment_date} onChange={handleChange} className={`form-control shadow-none ${validationErrors.assessment_date ? 'is-invalid' : ''}`} />
                    {validationErrors.assessment_date && <div className="invalid-feedback">{validationErrors.assessment_date}</div>}
                  </div>
                  
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Age <span className="text-danger">*</span></label>
                    <input required type="text" name="age_at_assessment" value={formData.age_at_assessment} onChange={handleChange} className={`form-control shadow-none ${validationErrors.age ? 'is-invalid' : ''}`} placeholder="Years" />
                    {validationErrors.age && <div className="invalid-feedback">{validationErrors.age}</div>}
                  </div>

                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Gender <span className="text-danger">*</span></label>
                    <select name="gender_at_assessment" value={formData.gender_at_assessment} onChange={handleChange} className="form-select shadow-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Goals & Activity</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Activity Level <span className="text-danger">*</span></label>
                    <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="form-select shadow-none">
                      <option value="Sedentary">Sedentary (Little/no exercise)</option>
                      <option value="Light">Light (1-3 days/week)</option>
                      <option value="Moderate">Moderate (3-5 days/week)</option>
                      <option value="Active">Active (6-7 days/week)</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Fitness Goal <span className="text-danger">*</span></label>
                    <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange} className="form-select shadow-none">
                      <option value="Fat Loss">Fat Loss</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                    </select>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Core Measurements</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Weight <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="text" name="weight_kg" value={formData.weight_kg} onChange={handleChange} className={`form-control shadow-none ${validationErrors.weight ? 'is-invalid' : ''}`} placeholder="0.00" />
                      <select name="weight" value={units.weight} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '80px' }}>
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                      {validationErrors.weight && <div className="invalid-feedback d-block">{validationErrors.weight}</div>}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Height <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="text" name="height_cm" value={formData.height_cm} onChange={handleChange} className={`form-control shadow-none ${validationErrors.height ? 'is-invalid' : ''}`} placeholder="0.00" />
                      <select name="height" value={units.height} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '80px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                      {validationErrors.height && <div className="invalid-feedback d-block">{validationErrors.height}</div>}
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Resting Heart Rate</label>
                    <div className="input-group">
                      <input type="text" name="resting_hr" value={formData.resting_hr} onChange={handleChange} className="form-control shadow-none" placeholder="BPM" />
                      <span className="input-group-text">bpm</span>
                    </div>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Muscle Group Circumferences</h5>
                <div className="row g-3 mb-4 bg-light p-3 rounded-3">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Neck <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="text" name="neck_cm" value={formData.neck_cm} onChange={handleChange} className={`form-control shadow-none ${validationErrors.neck ? 'is-invalid' : ''}`} placeholder="0.0" />
                      <select name="neck" value={units.neck} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                      {validationErrors.neck && <div className="invalid-feedback d-block">{validationErrors.neck}</div>}
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Shoulders (cm)</label>
                    <div className="input-group">
                      <input type="text" name="shoulders_cm" value={formData.shoulders_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <span className="input-group-text">cm</span>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Chest (cm)</label>
                    <div className="input-group">
                      <input type="text" name="chest_cm" value={formData.chest_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <span className="input-group-text">cm</span>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Waist <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="text" name="waist_cm" value={formData.waist_cm} onChange={handleChange} className={`form-control shadow-none ${validationErrors.waist ? 'is-invalid' : ''}`} placeholder="0.0" />
                      <select name="waist" value={units.waist} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                      {validationErrors.waist && <div className="invalid-feedback d-block">{validationErrors.waist}</div>}
                    </div>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Biceps / Arms</label>
                    <div className="input-group">
                      <input type="text" name="arms_cm" value={formData.arms_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <select name="biceps" value={units.biceps} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Forearms</label>
                    <div className="input-group">
                      <input type="text" name="forearms_cm" value={formData.forearms_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <select name="forearms" value={units.forearms} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Thighs</label>
                    <div className="input-group">
                      <input type="text" name="thighs_cm" value={formData.thighs_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <select name="thighs" value={units.thighs} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Calves</label>
                    <div className="input-group">
                      <input type="text" name="calves_cm" value={formData.calves_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <select name="calves" value={units.calves} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Hip {formData.gender_at_assessment === 'female' && <span className="text-danger">*</span>}</label>
                    <div className="input-group">
                      <input required={formData.gender_at_assessment === 'female'} type="text" name="hip_cm" value={formData.hip_cm} onChange={handleChange} className={`form-control shadow-none ${validationErrors.hip ? 'is-invalid' : ''}`} placeholder="0.0" />
                      <select name="hip" value={units.hip} onChange={handleUnitChange} className="form-select" style={{ maxWidth: '75px' }}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                      {validationErrors.hip && <div className="invalid-feedback d-block">{validationErrors.hip}</div>}
                    </div>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Progress Photos</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Front Pose</label>
                    <input type="file" accept="image/*" name="front_pose" onChange={handleFileChange} className="form-control shadow-none" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Side Pose</label>
                    <input type="file" accept="image/*" name="side_pose" onChange={handleFileChange} className="form-control shadow-none" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Back Pose</label>
                    <input type="file" accept="image/*" name="back_pose" onChange={handleFileChange} className="form-control shadow-none" />
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Remarks & Notes</h5>
                <div className="row g-3 mb-5">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Coach Notes / Remarks</label>
                    <textarea name="coach_notes" value={formData.coach_notes} onChange={handleChange} className="form-control shadow-none" rows="3" placeholder="Enter notes on symmetry, weakness areas, diet suggestions, etc."></textarea>
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button type="button" className="btn btn-light px-4 me-md-2 border" onClick={() => navigate(-1)}>Cancel</button>
                  <button disabled={loading} type="submit" className="btn btn-primary px-5 shadow-sm">
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...</>
                    ) : (
                      <><i className="bi bi-save me-2"></i>Save Assessment</>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default BodybuilderAssessmentForm;
