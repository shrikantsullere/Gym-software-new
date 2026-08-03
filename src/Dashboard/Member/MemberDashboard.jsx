import React, { useState, useEffect, useRef } from 'react';
import {
  RiDashboardLine,
  RiVipCrownLine,
  RiCalendarCheckLine,
  RiTimeLine,
  RiCheckLine
} from 'react-icons/ri';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as echarts from 'echarts';
import axiosInstance from '../../Api/axiosInstance';
import AnnouncementBanner from '../../Components/AnnouncementBanner';

const MemberDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const workoutChartRef = useRef(null);
  const chartInstance = useRef(null);

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
  const memberId = user?.memberId || null;
  const adminId = user?.adminId || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || '';

  console.log('MemberDashboard - memberId:', memberId, 'adminId:', adminId, 'branchId:', branchId);

  useEffect(() => {
    if (!memberId) {
      setError('Member ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await axiosInstance.get(`member-dashboard/${memberId}/dashboard`);

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Unable to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [memberId]);

  useEffect(() => {
    if (!dashboardData || !workoutChartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    chartInstance.current = echarts.init(workoutChartRef.current);

    const daysData = dashboardData.workoutProgress?.days || [];
    const dayLabels = daysData.map(day => day.dayLabel);

    const chartData = daysData.map(day => {
      if (day.status === 'PRESENT') {
        return { value: 1, name: 'Present', itemStyle: { color: '#10b981' }, status: day.status };
      } else if (day.status === 'ABSENT') {
        return { value: 1, name: 'Absent', itemStyle: { color: '#ef4444' }, status: day.status };
      } else if (day.status === 'NON_APPLICABLE') {
        return { value: 0.1, name: 'N/A', itemStyle: { color: '#9ca3af' }, status: day.status };
      } else {
        return { value: 0, name: 'Future', itemStyle: { color: '#e5e7eb' }, status: day.status };
      }
    });

    const option = {
      animation: true,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
        padding: [8, 12],
        formatter: function (params) {
          const item = params[0].data;
          const label = params[0].axisValueLabel;
          if (item.status === 'FUTURE') return `${label}: Future Date`;
          if (item.status === 'NON_APPLICABLE') return `${label}: Not Applicable`;
          return `${label}: <strong style="color:${item.itemStyle.color}">${item.name}</strong>`;
        }
      },
      grid: {
        top: '10px',
        right: '10px',
        bottom: '20px',
        left: '20px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dayLabels,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#1f2937', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        show: false, // Hide y-axis since it's just binary Present/Absent
        max: 1 // Max value is 1
      },
      series: [
        {
          name: 'Status',
          type: 'bar',
          barWidth: '40%',
          data: chartData,
          itemStyle: {
            borderRadius: [4, 4, 0, 0] // Rounded tops for a premium look
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // ✅ Safely extract data with fallbacks
  const membership = dashboardData?.membership || {};
  const classesThisWeek = dashboardData?.classesThisWeek || { count: 0 };
  const nextSession = dashboardData?.nextSession || null;

  return (
    <div className="container-fluid bg-light p-0 min-vh-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="p-3 p-md-4">
        <div className="mb-4">
          <h1 className="display-6 fw-bold">Welcome, {name}!</h1>
          <p className="text-muted">Your fitness journey at a glance</p>
        </div>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Summary Widgets */}
        <div className="row g-4 mb-4">
          {/* Workout Progress Chart */}
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h3 className="h5 fw-semibold">Workout Progress</h3>
                  <span className="badge bg-light text-dark">This Week</span>
                </div>
                <div ref={workoutChartRef} style={{ height: '256px', width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Membership Status */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-start border-primary border-4 h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="h6 fw-semibold mb-1">Membership Status</h3>
                    <p className={`fw-medium ${membership.status === 'Active' ? 'text-success' : 'text-warning'}`}>
                      {membership.status || 'Unknown'}
                    </p>
                    <p className="small text-muted">
                      {membership.expiresOn
                        ? `Expires: ${new Date(membership.expiresOn).toLocaleDateString()}`
                        : 'No expiry date'}
                    </p>
                  </div>
                  <div className="d-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3" style={{ width: '60px', height: '60px' }}>
                    <RiVipCrownLine className="text-primary fs-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Classes This Week */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-start border-success border-4 h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="h6 fw-semibold mb-1">Classes This Week</h3>
                    <p className="text-primary fw-medium d-flex align-items-center">
                      {classesThisWeek.count}
                      {classesThisWeek.count > 0 && <RiCheckLine className="ms-2 text-success" />}
                    </p>
                    <p className="small text-muted">
                      {classesThisWeek.count === 0 ? 'No classes attended yet' : 'Keep it up!'}
                    </p>
                  </div>
                  <div className="d-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3" style={{ width: '60px', height: '60px' }}>
                    <RiCalendarCheckLine className="text-success fs-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Session */}
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm border-start border-warning border-4 h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="h6 fw-semibold mb-1">Next Session</h3>
                    {nextSession ? (
                      <>
                        <p className="text-warning fw-medium">{nextSession.className || 'Session'}</p>
                        <p className="small text-muted">
                          {nextSession.date ? new Date(nextSession.date).toLocaleDateString() : 'TBD'},{' '}
                          {nextSession.time || 'Time not set'}
                        </p>
                      </>
                    ) : (
                      <p className="small text-muted">No upcoming session</p>
                    )}
                  </div>
                  <div className="d-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3" style={{ width: '60px', height: '60px' }}>
                    <RiTimeLine className="text-warning fs-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Recent Payments Section */}
        {dashboardData?.recentPayments && dashboardData.recentPayments.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 pt-4 pb-0">
                  <h3 className="h5 fw-semibold mb-0">Recent Payments</h3>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="fw-semibold">Invoice No</th>
                          <th className="fw-semibold">Date</th>
                          <th className="fw-semibold">Amount</th>
                          <th className="fw-semibold">Mode</th>
                          <th className="fw-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentPayments.map(payment => (
                          <tr key={payment.id}>
                            <td>{payment.invoiceNo}</td>
                            <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                            <td className="fw-bold">₹{payment.amount}</td>
                            <td>{payment.paymentMode}</td>
                            <td>
                              <span className={`badge ${payment.status === 'Paid' || payment.status === 'Approved' ? 'bg-success' : payment.status === 'Pending' ? 'bg-warning' : 'bg-danger'}`}>
                                {payment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;