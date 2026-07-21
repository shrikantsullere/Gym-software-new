import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getCurrentStaffId } from '../../utils/staffUtils';

const TrainerAssessmentForm = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    memberId: '',
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
    activity_level: 'moderate',
    fitness_goal: 'fat_loss',
    coach_notes: '',
    front_pose: null,
    side_pose: null,
    back_pose: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          const adminId = userObj.adminId || userObj.id;
          const roleId = Number(userObj.roleId);
          const roleName = (userObj.roleName || userObj.role || localStorage.getItem('userRole') || "").toLowerCase().replace(/\s+/g, '');
          
          let endpoint = `/members/admin/${adminId}`;
          // If Personal Trainer, fetch only their assigned members
          const isPersonalTrainer = roleId === 5 || roleName.includes('personaltrainer');
          if (isPersonalTrainer) {
            const staffId = getCurrentStaffId(userObj);
            endpoint = `/members/trainer/${staffId}`;
          }

          if (adminId) {
            const res = await axiosInstance.get(endpoint);
            if (res.data && res.data.success) {
              const memberList = Array.isArray(res.data.data) ? res.data.data : (res.data.members || []);
              setMembers(memberList);
            } else if (Array.isArray(res.data)) {
              setMembers(res.data);
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

  // Auto-fill member details and fetch past bodybuilding logs when a member is selected
  useEffect(() => {
    const fetchMemberData = async () => {
      if (formData.memberId && members.length > 0) {
        const selectedMember = members.find(m => String(m.id) === String(formData.memberId));
        if (selectedMember) {
          try {
            const res = await axiosInstance.get(`/v1/bodybuilding/${formData.memberId}`);
            if (res.data && res.data.success !== false && res.data.data && res.data.data.length > 0) {
              const latestLog = res.data.data[0];
              setFormData(prev => ({
                ...prev,
                chest_cm: latestLog.chest_cm || prev.chest_cm,
                shoulders_cm: latestLog.shoulders_cm || prev.shoulders_cm,
                arms_cm: latestLog.left_arm_cm || latestLog.right_arm_cm || prev.arms_cm,
                forearms_cm: latestLog.left_forearm_cm || latestLog.right_forearm_cm || prev.forearms_cm,
                thighs_cm: latestLog.thighs_cm || prev.thighs_cm,
                calves_cm: latestLog.calves_cm || prev.calves_cm,
                coach_notes: latestLog.notes || prev.coach_notes
              }));
            }
          } catch (err) {
            console.error("Failed to fetch past bodybuilding logs", err);
          }
        }
      }
    };
    fetchMemberData();
  }, [formData.memberId, members]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'memberId') {
      const selectedMember = members.find(m => String(m.id) === String(value));

      if (selectedMember) {
        let age = formData.age_at_assessment;
        if (selectedMember.dateOfBirth) {
          const dob = new Date(selectedMember.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
        }

        const gender = selectedMember.gender ? selectedMember.gender.toLowerCase() : 'male';
        
        let fitness_goal = formData.fitness_goal || 'fat_loss';
        const memberGoal = (selectedMember.goal || '').toLowerCase();
        
        if (memberGoal.includes('loss') || memberGoal.includes('fat')) {
          fitness_goal = 'fat_loss';
        } else if (memberGoal.includes('gain') || memberGoal.includes('muscle') || memberGoal.includes('body')) {
          fitness_goal = 'muscle_gain';
        } else if (memberGoal.includes('maintain') || memberGoal.includes('fitness') || memberGoal.includes('general')) {
          fitness_goal = 'maintenance';
        }

        setFormData(prev => ({
          ...prev,
          memberId: value,
          age_at_assessment: age || '',
          gender_at_assessment: gender,
          fitness_goal: fitness_goal,
        }));
        setAutoFilled(true);
      } else {
        setFormData(prev => ({ ...prev, memberId: value }));
        setAutoFilled(false);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.memberId) {
      setError("Please select a member first.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        memberId: parseInt(formData.memberId),
        age_at_assessment: parseInt(formData.age_at_assessment),
        weight_kg: parseFloat(formData.weight_kg),
        height_cm: parseFloat(formData.height_cm),
        neck_cm: parseFloat(formData.neck_cm),
        waist_cm: parseFloat(formData.waist_cm),
        hip_cm: formData.gender_at_assessment === 'female' ? parseFloat(formData.hip_cm) : null,
        resting_hr: parseInt(formData.resting_hr),
        activity_level: formData.activity_level,
        fitness_goal: formData.fitness_goal
      };

      const res = await axiosInstance.post('/v1/assessments', payload);
      if (res.data.success) {
        // Also save bodybuilding log
        try {
          const bodybuildingPayload = {
            weight_kg: formData.weight_kg,
            chest_cm: formData.chest_cm,
            shoulders_cm: formData.shoulders_cm,
            left_arm_cm: formData.arms_cm,
            right_arm_cm: formData.arms_cm,
            left_forearm_cm: formData.forearms_cm,
            right_forearm_cm: formData.forearms_cm,
            waist_cm: formData.waist_cm,
            thighs_cm: formData.thighs_cm,
            calves_cm: formData.calves_cm,
            notes: formData.coach_notes
          };
          await axiosInstance.post(`/v1/bodybuilding/${formData.memberId}`, bodybuildingPayload);
        } catch (errBody) {
          console.error("Failed to log bodybuilding metrics alongside assessment:", errBody);
        }

        setSuccess(true);
        setTimeout(() => navigate('/personaltrainer/dashboard'), 2000);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        setError(err.response.data.errors.join(", "));
      } else {
        setError(err.response?.data?.message || "Failed to submit assessment.");
      }
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
                <i className="bi bi-clipboard2-pulse me-2"></i>Log Member Assessment
              </h2>
              <p className="text-muted mt-2">Enter the body composition and metrics for your assigned client.</p>
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
                  <div>Assessment saved successfully! Redirecting to dashboard...</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <h5 className="mb-3 text-secondary border-bottom pb-2">
                  Basic Info
                  {autoFilled && <small className="text-success ms-3" style={{fontSize: '0.8rem'}}><i className="bi bi-check-circle me-1"></i>Auto-filled from member profile</small>}
                </h5>
                <div className="row g-3 mb-4">
                  
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Select Member <span className="text-danger">*</span></label>
                    <select required name="memberId" value={formData.memberId} onChange={handleChange} className="form-select shadow-none">
                      <option value="">-- Choose Member --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} {m.phone ? `(${m.phone})` : ''} 
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Age <span className="text-danger">*</span></label>
                    <input required type="number" min="1" max="120" name="age_at_assessment" value={formData.age_at_assessment} onChange={handleChange} className="form-control shadow-none" placeholder="Years" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Gender <span className="text-danger">*</span></label>
                    <select name="gender_at_assessment" value={formData.gender_at_assessment} onChange={handleChange} className="form-select shadow-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Body Measurements</h5>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Weight (kg) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="number" step="0.1" name="weight_kg" value={formData.weight_kg} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <span className="input-group-text">kg</span>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Height (cm) <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="number" step="0.1" name="height_cm" value={formData.height_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                      <span className="input-group-text">cm</span>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Resting Heart Rate <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <input required type="number" min="30" max="250" name="resting_hr" value={formData.resting_hr} onChange={handleChange} className="form-control shadow-none" placeholder="BPM" />
                      <span className="input-group-text">bpm</span>
                    </div>
                  </div>
                </div>

                <h5 className="mb-3 text-secondary border-bottom pb-2">Muscle Group Circumferences</h5>
                <div className="row g-3 mb-4 bg-light p-3 rounded-3">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Neck (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="neck_cm" value={formData.neck_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Shoulders (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="shoulders_cm" value={formData.shoulders_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Chest (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="chest_cm" value={formData.chest_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Waist (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="waist_cm" value={formData.waist_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Arms / Biceps (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="arms_cm" value={formData.arms_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Forearms (cm)</label>
                    <input type="number" step="0.1" name="forearms_cm" value={formData.forearms_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Thighs (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="thighs_cm" value={formData.thighs_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Calves (cm) <span className="text-danger">*</span></label>
                    <input required type="number" step="0.1" name="calves_cm" value={formData.calves_cm} onChange={handleChange} className="form-control shadow-none" placeholder="0.0" />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Hips / Glutes (cm){formData.gender_at_assessment === 'female' && <span className="text-danger"> *</span>}</label>
                    <input required={formData.gender_at_assessment === 'female'} type="number" step="0.1" name="hip_cm" value={formData.hip_cm} onChange={handleChange} className={`form-control shadow-none ${formData.gender_at_assessment === 'female' ? 'border-warning' : ''}`} placeholder="0.0" />
                    {formData.gender_at_assessment === 'female' && <small className="text-warning" style={{fontSize: '0.75rem'}}><i className="bi bi-info-circle"></i> Required for females</small>}
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

                <h5 className="mb-3 text-secondary border-bottom pb-2">Goals & Remarks</h5>
                <div className="row g-3 mb-5">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Activity Level <span className="text-danger">*</span></label>
                    <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="form-select shadow-none">
                      <option value="sedentary">Sedentary (Little/no exercise)</option>
                      <option value="light">Light (1-3 days/week)</option>
                      <option value="moderate">Moderate (3-5 days/week)</option>
                      <option value="active">Active (6-7 days/week)</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Fitness Goal <span className="text-danger">*</span></label>
                    <select name="fitness_goal" value={formData.fitness_goal} onChange={handleChange} className="form-select shadow-none">
                      <option value="fat_loss">Fat Loss</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="competition_prep">Competition Prep</option>
                    </select>
                  </div>

                  <div className="col-12 mt-3">
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

export default TrainerAssessmentForm;
