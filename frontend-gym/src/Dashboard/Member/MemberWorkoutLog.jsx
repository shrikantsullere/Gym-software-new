import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faCalendarAlt, faClipboardList, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

const MemberWorkoutLog = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const memberId = user?.memberId || user?.id;

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const res = await axiosInstance.get(`/workout/member/${memberId}`);
        if (res.data.success) {
          setWorkouts(res.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching workouts:", err);
      } finally {
        setLoading(false);
      }
    };
    if (memberId) fetchWorkouts();
  }, [memberId]);

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <FontAwesomeIcon icon={faDumbbell} className="fs-3 text-primary me-3" />
        <div>
          <h2 className="mb-0 fw-bold text-dark" style={{ color: '#2f6a87' }}>My Workouts</h2>
          <p className="text-muted mb-0">View your customized exercise routines assigned by your trainer.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted fw-semibold">Loading your workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5">
          <div className="card-body">
            <FontAwesomeIcon icon={faClipboardList} className="fs-1 text-muted mb-3 opacity-50" />
            <h4 className="fw-bold text-dark">No Workouts Assigned</h4>
            <p className="text-muted">Your trainer hasn't assigned any workout plans to you yet.</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {workouts.map(plan => (
            <div key={plan.id} className="col-lg-6 col-xl-6">
              <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden" style={{ borderLeft: '5px solid #2f6a87' }}>
                <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <h4 className="fw-bold text-dark mb-0 d-flex align-items-center">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2 fs-5" />
                      {plan.title}
                    </h4>
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill" style={{ fontSize: '11px' }}>
                      {plan.exercises?.length || 0} Exercises
                    </span>
                  </div>
                  {plan.notes && (
                    <p className="text-muted small mt-2 mb-0 bg-light p-2 rounded border-start border-3 border-secondary">
                      <strong>Trainer Notes:</strong> "{plan.notes}"
                    </p>
                  )}
                </div>
                
                <div className="card-body p-4 pt-2">
                  <div className="table-responsive rounded-3 border">
                    <table className="table table-hover align-middle mb-0 text-nowrap">
                      <thead className="table-light">
                        <tr style={{ fontSize: '13px' }}>
                          <th className="ps-3 py-3">Exercise</th>
                          <th className="py-3 text-center">Sets</th>
                          <th className="py-3 text-center">Reps</th>
                          <th className="py-3">Duration / Tips</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.exercises && plan.exercises.length > 0 ? (
                          plan.exercises.map((ex, idx) => (
                            <tr key={ex.id || idx}>
                              <td className="ps-3 py-3 fw-bold text-dark">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2 fs-6" />
                                {ex.name}
                              </td>
                              <td className="py-3 text-center">
                                <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
                                  {ex.sets ? `${ex.sets} Sets` : '-'}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className="badge bg-light text-dark border px-3 py-2 fw-semibold">
                                  {ex.reps ? `${ex.reps} Reps` : '-'}
                                </span>
                              </td>
                              <td className="py-3 text-muted small">
                                {ex.duration ? (
                                  <span className="text-primary fw-semibold"><FontAwesomeIcon icon={faClock} className="me-1" />{ex.duration}</span>
                                ) : (
                                  ex.notes || '-'
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">No exercises added to this plan.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberWorkoutLog;
