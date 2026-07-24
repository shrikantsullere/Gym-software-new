import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FaUtensils, FaClock, FaCalendarCheck, FaLeaf, FaAppleAlt } from 'react-icons/fa';

const MyDietPlan = () => {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const actualMemberId = user?.memberId || user?.id;

  useEffect(() => {
    const fetchMyDiet = async () => {
      try {
        const res = await axiosInstance.get(`/diet/member/${actualMemberId}`);
        if (res.data.success) {
          const list = res.data.plans || [];
          setPlans(list);
          if (list.length > 0) {
            setSelectedPlanId(list[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching diet plan:", err);
      } finally {
        setLoading(false);
      }
    };
    if (actualMemberId) fetchMyDiet();
  }, [actualMemberId]);

  if (loading) return (
    <div className="text-center my-5 py-5">
      <div className="spinner-border text-primary" role="status"></div>
      <div className="mt-3 text-muted fw-semibold">Loading your diet plan...</div>
    </div>
  );

  const activePlan = plans.find(p => p.id === selectedPlanId) || (plans.length > 0 ? plans[0] : null);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <h3 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>
          <FaUtensils className="me-2 text-primary" /> My Diet Plan
        </h3>

        {/* If multiple plans available, show plan selector tabs */}
        {plans.length > 1 && (
          <div className="btn-group rounded-pill shadow-sm bg-white p-1">
            {plans.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`btn btn-sm rounded-pill fw-bold px-3 py-2 ${activePlan?.id === p.id ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                style={{ backgroundColor: activePlan?.id === p.id ? '#2f6a87' : 'transparent', border: 'none' }}
              >
                {p.title || `Plan ${idx + 1}`} {p.dietType ? `(${p.dietType})` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      {!activePlan ? (
        <div className="card shadow-sm border-0 text-center py-5 rounded-4">
          <div className="card-body">
            <FaUtensils size={50} className="text-muted mb-3 opacity-50" />
            <h4 className="fw-bold text-dark mb-2">No Diet Plan Assigned</h4>
            <p className="text-muted">Your trainer has not assigned a diet plan to you yet. Check back later!</p>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="card shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
              
              {/* Header Banner */}
              <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #2f6a87 0%, #1a4a61 100%)" }}>
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <h2 className="fw-bold mb-1">{activePlan.title}</h2>
                    <p className="mb-0 opacity-75">{activePlan.notes ? `"${activePlan.notes}"` : 'Personalized nutrition guide'}</p>
                  </div>
                  <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold text-uppercase" style={{ fontSize: '12px' }}>
                    <FaLeaf className="me-1" /> {activePlan.dietType || 'Balanced Diet'}
                  </span>
                </div>

                <div className="d-flex flex-wrap gap-4 mt-3 opacity-90 small fw-semibold">
                  <span><FaCalendarCheck className="me-1" /> Assigned: {activePlan.assignedAt ? new Date(activePlan.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active'}</span>
                  <span><FaUtensils className="me-1" /> {activePlan.meals?.length || 0} Meals / Day</span>
                </div>
              </div>

              {/* Meals List */}
              <div className="card-body p-3 p-md-4">
                <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center">
                  <FaAppleAlt className="me-2 text-danger" /> Daily Meal Breakdown
                </h5>

                <div className="row g-3">
                  {activePlan.meals && activePlan.meals.length > 0 ? (
                    activePlan.meals.map((meal, idx) => (
                      <div key={meal.id || idx} className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100 border-0 shadow-sm rounded-3 bg-light p-3 hover-shadow transition-all" style={{ borderLeft: '4px solid #2f6a87' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                              Meal #{idx + 1}
                            </span>
                            <div className="text-primary fw-bold small d-flex align-items-center gap-1">
                              <FaClock /> {meal.time || 'Meal Time'}
                            </div>
                          </div>
                          <h6 className="fw-bold text-dark mb-0">{meal.food || meal.name || '-'}</h6>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 p-5 text-center text-muted">
                      No specific meals listed in this diet plan.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDietPlan;
