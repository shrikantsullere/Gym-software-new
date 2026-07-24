import React, { useState, useEffect } from "react";
import { Row, Col, Card, ProgressBar } from "react-bootstrap";
import { FaUsers, FaChartBar, FaStar } from "react-icons/fa";
import axiosInstance from '../../Api/axiosInstance';

const PersonsalReportsClasses = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classPerformanceData, setClassPerformanceData] = useState({
    summary: {
      totalStudents: 0,
      presentStudents: 0,
      avgAttendance: "0%"
    },
    studentAttendanceByClass: []
  });

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const adminId = user?.adminId || null;
  const trainerId = user?.id || null;

  useEffect(() => {
    const fetchClassPerformanceData = async () => {
      if (!adminId || !trainerId) {
        setError('Admin ID or Trainer ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/generaltrainer/${adminId}/class-performance`);

        if (response.data?.success && response.data.data) {
          const data = response.data.data;
          console.log('API Response:', data); // Debug log
          console.log('Current trainer ID:', trainerId); // Debug log

          // Filter studentAttendanceByClass to show only current trainer's classes
          const filteredClasses = data.studentAttendanceByClass.filter(
            (cls) => {
              // Match by trainer ID if available
              if (cls.trainerId && trainerId) {
                return cls.trainerId === parseInt(trainerId);
              }
              // Fall back to role-based filtering
              return cls.trainerRole === 'personaltrainer' ||
                cls.trainerName?.toLowerCase().includes('personal');
            }
          );

          console.log('Filtered classes:', filteredClasses); // Debug log
          console.log('Filtered classes count:', filteredClasses.length); // Debug log

          // Recalculate summary for filtered data
          const totalCapacity = filteredClasses.reduce((sum, cls) => {
            const [, total] = (cls.attendance || '0/0').split('/').map(Number);
            return sum + total;
          }, 0);

          const totalPresent = filteredClasses.reduce((sum, cls) => {
            const [present] = (cls.attendance || '0/0').split('/').map(Number);
            return sum + present;
          }, 0);

          const filteredSummary = {
            totalStudents: data.summary.totalStudents, // Keep original total students from admin
            presentStudents: totalPresent,
            avgAttendance: filteredClasses.length > 0
              ? Math.round(filteredClasses.reduce((sum, cls) => sum + cls.attendancePercentage, 0) / filteredClasses.length) + '%'
              : '0%'
          };

          setClassPerformanceData({
            summary: filteredSummary,
            studentAttendanceByClass: filteredClasses
          });
        } else {
          throw new Error('Invalid or empty response from server');
        }
      } catch (err) {
        const errorMessage = err.response
          ? `Server error: ${err.response.data.message || err.response.statusText}`
          : err.message || 'Failed to load data';
        setError(errorMessage);
        console.error('Error fetching class performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassPerformanceData();
  }, [adminId, trainerId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const { summary, studentAttendanceByClass } = classPerformanceData;

  return (
    <div className="trainer-dashboard">
      <div className="mb-4 text-center text-md-start">
        <h1 className="fw-bold mb-2 fs-3 text-dark">Personal Trainer Class Report</h1>
        <p className="text-muted mb-3">
          Overview of your class attendance and performance data
        </p>
        {trainerId && (
          <div>
            <span className="badge bg-info text-white px-3 py-2 fs-6">Personal Trainer</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <Row className="mb-4 g-3">
        <Col xs={6} md={3}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-3">
              <div className="icon-circle bg-primary bg-opacity-10 text-primary mb-3">
                <FaUsers className="fs-4" />
              </div>
              <Card.Title className="fs-6">Total Students</Card.Title>
              <h2 className="my-2">{summary.totalStudents}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-3">
              <div className="icon-circle bg-success bg-opacity-10 text-success mb-3">
                <FaUsers className="fs-4" />
              </div>
              <Card.Title className="fs-6">Present Students</Card.Title>
              <h2 className="my-2">{summary.presentStudents}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-3">
              <div className="icon-circle bg-info bg-opacity-10 text-info mb-3">
                <FaChartBar className="fs-4" />
              </div>
              <Card.Title className="fs-6">Avg. Attendance</Card.Title>
              <h2 className="my-2">{summary.avgAttendance}</h2>
              <ProgressBar
                now={parseInt(summary.avgAttendance) || 0}
                variant="info"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="h-100 border-0 shadow-sm text-center">
            <Card.Body className="p-3">
              <div className="icon-circle bg-warning bg-opacity-10 text-warning mb-3">
                <FaStar className="fs-4" />
              </div>
              <Card.Title className="fs-6">Classes Tracked</Card.Title>
              <h2 className="my-2">{studentAttendanceByClass.length}</h2>
              <ProgressBar
                now={studentAttendanceByClass.length > 0 ? 100 : 0}
                variant="warning"
                className="mt-2"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Graphical Report */}
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h5" className="bg-white text-dark">
          <FaChartBar className="me-2" /> Class Attendance Details
        </Card.Header>
        <Card.Body className="p-3 p-md-4">
          <Row className="mb-3">
            <Col>
              <h5>My Personal Training Classes</h5>
              <p className="text-muted mb-0">Classes filtered by your trainer ID and personal trainer role</p>
              {studentAttendanceByClass.length > 0 && (
                <small className="text-success">
                  Found {studentAttendanceByClass.length} class(es) assigned to you
                </small>
              )}
            </Col>
          </Row>

          {studentAttendanceByClass.length > 0 ? (
            studentAttendanceByClass.map((cls, index) => {
              // Optional: validate attendance format
              const [present, total] = (cls.attendance || '0/0').split('/').map(Number);
              const percentage = cls.attendancePercentage || 0;

              return (
                <Card key={index} className="mb-3 border-0 shadow-sm">
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12} md={4} className="mb-2 mb-md-0">
                        <h6 className="fw-bold">{cls.className || 'Unnamed Class'}</h6>
                        <small className="text-muted d-block">{cls.date || 'No date'}</small>
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          <span className="badge bg-primary-subtle text-primary-emphasis">
                            {cls.trainerName || 'Personal Trainer'}
                          </span>
                          {cls.trainerRole && (
                            <span className="badge bg-success-subtle text-success-emphasis">
                              {cls.trainerRole.replace('personaltrainer', 'Personal Trainer')}
                            </span>
                          )}
                          {cls.trainerId && (
                            <span className="badge bg-secondary-subtle text-secondary-emphasis">
                              ID: {cls.trainerId}
                            </span>
                          )}
                        </div>
                      </Col>
                      <Col xs={12} md={8}>
                        <div className="d-flex align-items-center flex-column flex-md-row">
                          <div className="me-3 mb-2 mb-md-0" style={{ width: '120px' }}>
                            {present}/{total} students
                          </div>
                          <div className="flex-grow-1 mb-2 mb-md-0">
                            <ProgressBar
                              now={percentage}
                              variant={
                                percentage >= 80 ? "success" :
                                  percentage >= 60 ? "warning" : "danger"
                              }
                              min={0}
                              max={100}
                            />
                          </div>
                          <div className="ms-md-3" style={{ width: '50px' }}>
                            {percentage}%
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              );
            })
          ) : (
            <div className="text-center text-muted py-4">
              <FaUsers className="mb-3 fs-1 opacity-50" />
              <p className="mb-0">No personal training class attendance data available</p>
              <small>Classes you conduct as a personal trainer will appear here</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Optional: Add inline styles or use CSS module */}
      <style jsx>{`
                .trainer-dashboard {
                    padding: 15px;
                    background-color: #f8f9fa;
                    min-height: 100vh;
                }
                .icon-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                }
                @media (max-width: 768px) {
                    .icon-circle {
                        width: 50px;
                        height: 50px;
                    }
                }
            `}</style>
    </div>
  );
};

export default PersonsalReportsClasses;