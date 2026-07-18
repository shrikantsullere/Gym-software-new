import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faCalendarAlt, faClipboardList } from '@fortawesome/free-solid-svg-icons';

const MemberWorkoutLog = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const memberId = user.id;

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const res = await axiosInstance.get(`/workout/member/${memberId}`);
        if (res.data.success) {
          setWorkouts(res.data.data);
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
      <div className="d-flex align-items-center mb-4">
        <FontAwesomeIcon icon={faDumbbell} className="fs-3 text-primary me-3" />
        <div>
          <h2 className="mb-0 fw-bold text-dark">My Workouts</h2>
          <p className="text-muted mb-0">View your customized exercise routines assigned by your trainer.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading your workouts...</p>
        </div>
      ) : workouts.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 text-center py-5">
          <div className="card-body">
            <FontAwesomeIcon icon={faClipboardList} className="fs-1 text-muted mb-3" />
            <h4 className="fw-bold">No Workouts Assigned</h4>
            <p className="text-muted">Your trainer hasn't assigned any workout plans to you yet.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {workouts.map(plan => (
            <div key={plan.id} className="col-lg-6 mb-4">
              <div className="card border-0 shadow-sm rounded-4 h-100 border-start border-primary border-4">
                <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                  <h4 className="fw-bold text-dark d-flex align-items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-muted me-2 fs-5" />
                    {plan.title}
                  </h4>
                  {plan.notes && <p className="text-muted small mt-2 mb-0"><strong>Trainer Notes:</strong> {plan.notes}</p>}
                </div>
                <div className="card-body p-4">
                  <div className="table-responsive">
                    <table className="table table-hover table-borderless align-middle mb-0">
                      <thead className="table-light rounded-top">
                        <tr>
                          <th className="ps-3 py-2 rounded-start">Exercise</th>
                          <th className="py-2 text-center">Sets</th>
                          <th className="py-2 text-center">Reps</th>
                          <th className="py-2 rounded-end">Tips</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.exercises && plan.exercises.length > 0 ? (
                          plan.exercises.map(ex => (
                            <tr key={ex.id} className="border-bottom">
                              <td className="ps-3 py-3 fw-semibold">{ex.name}</td>
                              <td className="py-3 text-center">
                                <span className="badge bg-light text-dark border px-3 py-2">{ex.sets}</span>
                              </td>
                              <td className="py-3 text-center">
                                <span className="badge bg-light text-dark border px-3 py-2">{ex.reps}</span>
                              </td>
                              <td className="py-3 text-muted small">{ex.notes || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-3 text-muted">No exercises added to this plan.</td>
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
