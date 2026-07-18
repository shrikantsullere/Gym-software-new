import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FaUtensils, FaClock, FaCalendarCheck } from 'react-icons/fa';

const MyDietPlan = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const actualMemberId = user?.memberId || user?.id;

  useEffect(() => {
    const fetchMyDiet = async () => {
      try {
        const res = await axiosInstance.get(`/diet/member/${actualMemberId}`);
        if (res.data.success) {
          setPlans(res.data.plans);
        }
      } catch (err) {
        console.error("Error fetching diet plan:", err);
      } finally {
        setLoading(false);
      }
    };
    if (actualMemberId) fetchMyDiet();
  }, [actualMemberId]);

  if (loading) return <div className="p-4 text-center">Loading your diet plan...</div>;

  const currentPlan = plans.length > 0 ? plans[0] : null;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="d-flex align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>🥗 My Diet Plan</h3>
      </div>

      {!currentPlan ? (
        <div className="card shadow-sm border-0 text-center py-5" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <FaUtensils size={50} className="text-muted mb-3 opacity-50" />
            <h4 className="fw-bold text-dark mb-2">No Diet Plan Assigned</h4>
            <p className="text-muted">Your trainer has not assigned a diet plan to you yet. Check back later!</p>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card shadow-lg border-0 mb-4" style={{ borderRadius: "16px", overflow: "hidden" }}>
              
              {/* Header */}
              <div className="bg-primary text-white p-4" style={{ background: "linear-gradient(135deg, #2f6a87 0%, #1a4a61 100%)" }}>
                <h2 className="fw-bold mb-1">{currentPlan.title}</h2>
                <div className="d-flex gap-3 mt-3 opacity-75 small fw-semibold">
                  <span><FaCalendarCheck className="me-1" /> Assigned on: {new Date(currentPlan.assignedAt).toLocaleDateString()}</span>
                  <span><FaUtensils className="me-1" /> {currentPlan.meals.length} Meals/Day</span>
                </div>
              </div>

              {/* Notes */}
              {currentPlan.notes && (
                <div className="bg-light p-3 border-bottom text-dark text-center fw-medium fst-italic">
                  "{currentPlan.notes}"
                </div>
              )}

              {/* Meals List */}
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {currentPlan.meals.map((meal, idx) => (
                    <div key={meal.id} className="list-group-item p-4 d-flex align-items-center gap-4 hover-bg-light" style={{ transition: "0.2s" }}>
                      
                      <div className="text-center rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                           style={{ width: "60px", height: "60px", backgroundColor: "#e9f2f9", color: "#2f6a87" }}>
                        <h5 className="mb-0 fw-bold">{idx + 1}</h5>
                      </div>

                      <div className="flex-grow-1 border-start ps-4 border-2" style={{ borderColor: "#e9f2f9" }}>
                        <div className="text-primary fw-bold mb-1 d-flex align-items-center gap-2">
                          <FaClock /> {meal.time}
                        </div>
                        <h5 className="text-dark fw-bold mb-0">{meal.food}</h5>
                      </div>

                    </div>
                  ))}
                  {currentPlan.meals.length === 0 && (
                    <div className="p-5 text-center text-muted">
                      No specific meals found in this plan.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* History Link (Optional) */}
            {plans.length > 1 && (
              <div className="text-center mt-4">
                <p className="text-muted small">You have {plans.length - 1} older diet plans in your history.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDietPlan;
