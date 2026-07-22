import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaCalendarCheck, FaDollarSign, FaChevronRight } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from '../../Api/axiosInstance';
import AnnouncementBanner from '../../Components/AnnouncementBanner';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const PersonalTrainerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    todaysCheckIns: 0,
    earningsOverview: [],
    sessionsOverview: null,
    recentActivities: [],
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
  const userId = user?.id || null;

  // Fetch data on component mount
  useEffect(() => {
    if (!userId) {
      setError('User ID not available');
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get(`personal-trainer-dashboard/trainer/${userId}`);
        if (response.data.success && response.data.data) {
          // Process the API response to match frontend expectations
          const apiData = response.data.data;
          
          // Transform earnings data
          const transformedEarnings = apiData.earningsOverview.map(item => {
            // Extract day from date
            const dateObj = new Date(item.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            return {
              day: dayName,
              amount: item.total || 0
            };
          });
          
          // Transform recent activities
          const transformedActivities = apiData.recentActivities.map(item => ({
            id: item.id,
            memberId: item.memberId,
            name: item.memberName,
            action: `${item.status} - ${item.notes}`,
            time: new Date(item.time).toLocaleString(),
            image: `https://ui-avatars.com/api/?name=${item.memberName}&background=random`
          }));
          
          // Set the transformed data
          setDashboardData({
            totalMembers: apiData.totalMembers || 0,
            todaysCheckIns: apiData.todaysCheckIns || 0,
            earningsOverview: transformedEarnings,
            sessionsOverview: apiData.sessionsOverview || { completed: 0, upcoming: 0, cancelled: 0 },
            recentActivities: transformedActivities,
          });
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  // Format earnings data for chart
  const earningsData = {
    labels: dashboardData.earningsOverview.map(item => item.day || ''),
    datasets: [
      {
        label: 'Earnings',
        data: dashboardData.earningsOverview.map(item => item.amount || 0),
        borderColor: '#6EB2CC',
        backgroundColor: 'rgba(110, 178, 204, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Sessions pie chart
  const sessions = dashboardData.sessionsOverview || { completed: 0, upcoming: 0, cancelled: 0 };
  const sessionsData = {
    labels: ['Completed', 'Upcoming', 'Cancelled'],
    datasets: [
      {
        data: [sessions.completed, sessions.upcoming, sessions.cancelled],
        backgroundColor: ['#A3D5E3', '#A7F3D0', '#FDE68A'],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  // Chart options
  const earningsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
    },
  };

  const sessionsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                return {
                  text: label,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: style.borderWidth,
                  pointStyle: 'circle',
                  hidden: !chart.getDataVisibility(i),
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.label}: ${context.raw} sessions`;
          },
        },
      },
    },
  };

  // Stats cards
  const statsCards = [
    {
      title: 'Total Members',
      value: dashboardData.totalMembers.toLocaleString(),
      icon: <FaUserFriends style={{ color: '#6EB2CC' }} />,
    },
    {
      title: "Today's Check-ins",
      value: dashboardData.todaysCheckIns.toLocaleString(),
      icon: <FaCalendarCheck style={{ color: '#6EB2CC' }} />,
    },
  ];

  // Recent Activities
  const recentActivities = dashboardData.recentActivities.length
    ? dashboardData.recentActivities
    : [
        {
          id: 1,
          name: 'No recent activity',
          action: '',
          time: '',
          image: 'https://ui-avatars.com/api/?name=Activity&background=random',
        },
      ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`container-fluid bg-light min-vh-100 ${sidebarOpen ? 'ps-5' : ''}`}>
      {/* Sidebar (toggleable) */}
      <div
        className={`position-fixed top-0 start-0 vh-100 bg-dark p-3 ${
          sidebarOpen ? 'd-block' : 'd-none'
        }`}
        style={{ width: '64px' }}
      >
        <button className="btn btn-light" onClick={toggleSidebar}>
          X
        </button>
      </div>

      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center mb-3"
        style={{ paddingLeft: sidebarOpen ? '64px' : '0' }}
      >
        <h1 className="fw-bold">Dashboard</h1>
      </div>

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        {statsCards.map((card, index) => (
          <div key={index} className="col-12 col-sm-6 col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h6 className="card-subtitle text-muted">{card.title}</h6>
                  <div className="fs-4">{card.icon}</div>
                </div>
                <h3 className="card-title fw-bold">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-4">Earnings Overview</h5>
              <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                <Line data={earningsData} options={earningsOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-4">Sessions Overview</h5>
              <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                <Pie data={sessionsData} options={sessionsOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title fw-bold mb-4">Recent Activities</h5>
          <div className="list-group list-group-flush">
            {recentActivities.map((activity) => (
              <div key={activity.id || activity.name} className="list-group-item px-0 border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <img
                      src={activity.image || 'https://ui-avatars.com/api/?name=Activity&background=random'}
                      alt={activity.name}
                      className="rounded-circle me-3"
                      width="40"
                      height="40"
                    />
                    <div>
                      <p className="mb-0 fw-medium">
                        {activity.name} {activity.action}
                      </p>
                      {activity.time && (
                        <p className="mb-0 text-muted small">{activity.time}</p>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-link p-0" style={{ color: '#6EB2CC' }} onClick={() => navigate(`/personaltrainer/member-assessment/${activity.memberId}`)}>
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalTrainerDashboard;