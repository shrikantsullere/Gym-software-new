import React, { useState, useEffect } from "react";
import { Row, Col, Card, ProgressBar } from "react-bootstrap";
import { FaUsers, FaChartBar, FaStar } from "react-icons/fa";
import axiosInstance from '../../Api/axiosInstance';

const ReportsClasses = () => {
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

    useEffect(() => {
        const fetchClassPerformanceData = async () => {
            if (!adminId) {
                setError('Admin ID not found. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const response = await axiosInstance.get(`/generaltrainer/${adminId}/class-performance`);

                if (response.data?.success && response.data.data) {
                    setClassPerformanceData(response.data.data);
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
    }, [adminId]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="alert alert-danger" role="alert">
                    Error loading report data: {error}
                </div>
            </div>
        );
    }

    const { summary, studentAttendanceByClass } = classPerformanceData;

    return (
        <div className="trainer-dashboard">
            <div className="dashboard-header">
                <h1 className="text-center fw-bold mb-2">Class Attendance Report</h1>
                <p className="text-center text-muted">
                    Overview of student attendance across all classes
                </p>
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
                            <h5>Student Attendance by Class</h5>
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
                                                <small className="text-muted">{cls.date || 'No date'}</small>
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
                            No class attendance data available
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

export default ReportsClasses;