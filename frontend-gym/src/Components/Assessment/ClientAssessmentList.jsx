import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const ClientAssessmentList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const userStr = localStorage.getItem("user");
        let adminId = null;
        if (userStr) {
          const userObj = JSON.parse(userStr);
          adminId = userObj.adminId || userObj.id;
        }
        if (adminId) {
          const res = await axiosInstance.get(`/members/admin/${adminId}`);
          if (res.data && res.data.success) {
            setMembers(res.data.data || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch members", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 pb-2 border-bottom gap-3">
            <h2 className="text-dark fw-bold mb-0" style={{fontSize: 'clamp(1.2rem, 4vw, 1.6rem)'}}>Client Progress &amp; Assessments</h2>
            <button className="btn btn-primary shadow-sm flex-shrink-0" onClick={() => navigate('/personaltrainer/assessment-form')}>
              <i className="bi bi-plus-circle me-2"></i>New Assessment
            </button>
          </div>

          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <h5>No clients found.</h5>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3 text-muted" style={{fontSize: '0.85rem'}}>CLIENT NAME</th>
                        <th className="py-3 text-muted" style={{fontSize: '0.85rem'}}>CONTACT</th>
                        <th className="py-3 text-muted" style={{fontSize: '0.85rem'}}>JOIN DATE</th>
                        <th className="px-4 py-3 text-end text-muted" style={{fontSize: '0.85rem'}}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id || m.userId}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center">
                              <img src={`https://ui-avatars.com/api/?name=${m.fullName}&background=random`} alt={m.fullName} className="rounded-circle me-3" width="40" height="40" />
                              <div>
                                <h6 className="mb-0 fw-bold">{m.fullName}</h6>
                                <small className="text-muted">ID: {m.userId || m.id}</small>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div>{m.phone}</div>
                            <small className="text-muted">{m.email}</small>
                          </td>
                          <td className="py-3">
                            {m.joinDate || m.createdAt ? new Date(m.joinDate || m.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-2 py-3 text-end">
                            <div className="d-flex flex-column flex-sm-row justify-content-end gap-1">
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                onClick={() => navigate(`/personaltrainer/member-assessment/${m.userId || m.id}`)}
                                title="View Assessment Dashboard"
                              >
                                <i className="bi bi-graph-up me-1"></i>View Progress
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-success" 
                                onClick={() => navigate('/personaltrainer/assessment-form', { state: { preselectMember: m.userId || m.id } })}
                                title="Log New Assessment"
                              >
                                <i className="bi bi-plus me-1"></i>Log New
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAssessmentList;
