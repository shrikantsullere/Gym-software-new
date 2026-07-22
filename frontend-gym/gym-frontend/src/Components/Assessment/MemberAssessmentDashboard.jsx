import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import AssessmentHistory from './AssessmentHistory';
import 'bootstrap/dist/css/bootstrap.min.css';

const MemberAssessmentDashboard = ({ memberId }) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestAssessment = async () => {
      try {
        const res = await axiosInstance.get(`/v1/assessments/member/${memberId}/latest`);
        if (res.data.success) {
          setAssessment(res.data.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError("No assessment records found.");
        } else {
          setError("Failed to load assessment data.");
        }
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchLatestAssessment();
  }, [memberId]);

  if (!memberId) return <div className="container mt-5"><div className="alert alert-warning">Please specify a member ID to view dashboard.</div></div>;
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  );
  if (error) return <div className="container mt-5"><div className="alert alert-info text-center"><i className="bi bi-info-circle me-2"></i>{error}</div></div>;
  if (!assessment) return null;

  // Defensive null checks for nested properties to prevent crashes
  const metrics = assessment.metrics || {};
  const inputs = assessment.inputs || {};
  const macros = assessment.macros || {};
  const dashboardData = assessment.dashboard_data || {};
  const cardioZones = dashboardData.cardio_zones || {};
  const fitnessGoal = inputs.fitness_goal ? inputs.fitness_goal.replace('_', ' ').toUpperCase() : 'N/A';

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 border-bottom pb-3 gap-2">
            <div>
              <h1 className="h3 text-dark fw-bold mb-0">Assessment Dashboard</h1>
              <p className="text-muted mb-0 small">
                Last Updated: {assessment.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <span className="badge bg-primary py-2 px-3 align-self-start align-self-sm-center">
              Goal: {fitnessGoal}
            </span>
          </div>

          <div className="row g-4 mb-5">
            
            {/* Component A - Vital Composition */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-primary border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-person-lines-fill text-primary me-2"></i>Vital Composition
                  </h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">BMI</span>
                      <strong>{metrics.bmi} <span className="badge bg-light text-dark border ms-1">{dashboardData.bmi_risk_label || '-'}</span></strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Body Fat</span>
                      <strong>{metrics.body_fat_percentage}%</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Lean Mass</span>
                      <strong>{metrics.lean_body_mass} kg</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Ideal Weight</span>
                      <strong>{metrics.ideal_body_weight} kg</strong>
                    </li>
                    {metrics.waist_to_hip_ratio && (
                      <li className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-muted">WHR</span>
                        <strong>{metrics.waist_to_hip_ratio}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Component B - Energy Analytics */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-warning border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-lightning-charge-fill text-warning me-2"></i>Energy Analytics
                  </h5>
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">BMR (Resting)</span>
                      <strong>{metrics.bmr} kcal</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">TDEE (Active)</span>
                      <strong>{metrics.tdee} kcal</strong>
                    </li>
                  </ul>
                  <div className="p-3 bg-warning bg-opacity-10 rounded text-center mt-auto border border-warning border-opacity-25">
                    <div className="text-warning text-uppercase small fw-bold">Daily Target Calories</div>
                    <div className="fs-3 fw-bold text-dark">{metrics.target_calories} <span className="fs-6 text-muted fw-normal">kcal</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component C - Macro Blueprint */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-success border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-pie-chart-fill text-success me-2"></i>Macro Blueprint
                  </h5>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 mb-2 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25">
                    <span className="text-danger fw-semibold">Protein</span>
                    <strong className="text-danger fs-5">{macros.protein_grams}g</strong>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 mb-2 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25">
                    <span className="text-warning fw-semibold text-dark">Fat</span>
                    <strong className="text-warning text-dark fs-5">{macros.fat_grams}g</strong>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-info bg-opacity-10 border border-info border-opacity-25">
                    <span className="text-info text-dark fw-semibold">Carbs</span>
                    <strong className="text-info text-dark fs-5">{macros.carb_grams}g</strong>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Component D - Cardio Guidance */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-danger border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-heart-pulse-fill text-danger me-2"></i>Cardio Guidance
                  </h5>
                  
                  <div className="mb-4">
                    <div className="text-muted small text-uppercase fw-bold mb-1">Fat Burn Zone (60-70%)</div>
                    <div className="d-flex align-items-center">
                      <h3 className="text-danger mb-0 me-2">{cardioZones.fat_burn_low || '-'}</h3>
                      <span className="text-muted mx-1">-</span>
                      <h3 className="text-danger mb-0 ms-2">{cardioZones.fat_burn_high || '-'}</h3>
                      <span className="ms-2 text-muted small">BPM</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Cardio Zone (70-80%)</div>
                    <div className="d-flex align-items-center">
                      <h3 className="text-dark mb-0 me-2">{cardioZones.cardio_low || '-'}</h3>
                      <span className="text-muted mx-1">-</span>
                      <h3 className="text-dark mb-0 ms-2">{cardioZones.cardio_high || '-'}</h3>
                      <span className="ms-2 text-muted small">BPM</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

          </div>

          {/* Historical Graph Component */}
          <AssessmentHistory memberId={memberId} />

        </div>
      </div>
    </div>
  );
};

export default MemberAssessmentDashboard;

