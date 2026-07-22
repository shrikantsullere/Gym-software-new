import React, { useEffect, useRef, useState } from 'react';
import { 
  RiCalendarLine, 
  RiTaskLine, 
  RiToolsLine, 
  RiUserLine,
  RiArrowRightSLine,
  RiAddLine,
  RiMore2Fill,
  RiBarChartLine
} from 'react-icons/ri';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as echarts from 'echarts';
import axiosInstance from '../../Api/axiosInstance';

const HouseKeepingDashboard = () => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Default data to use if API fails
  const defaultDashboardData = {
    todayShifts: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    pendingMaintenance: 0,
    attendancePresent: 0,
    attendanceTotal: 0,
    weeklyRoster: [],
    taskGraph: [],
    maintenanceStats: {
      completed: 0,
      pending: 0
    }
  };

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
  const name = user?.fullName || 'Housekeeping Staff';
  const adminId = user?.adminId || 'null';

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // ?adminId=${adminId}
        const response = await axiosInstance.get(`housekeepingdashboard?adminId=${adminId}`);
        if (response.data && response.data.success) {
          setDashboardData(response.data.housekeepingDashboard);
        } else {
          // If API returns success: false, set data to default
          setDashboardData(defaultDashboardData);
        }
      } catch (err) {
        // Log error for debugging but don't show it to the user
        console.error('Error fetching dashboard data:', err);
        // Set data to default on error
        setDashboardData(defaultDashboardData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this runs once on mount

  // Get status styling
  const getStatusStyling = (status) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'completed':
        return {
          bgClass: 'bg-success bg-opacity-10',
          borderClass: 'border-success',
          textClass: 'text-success',
          icon: '✅',
          label: 'Completed'
        };
      case 'pending':
        return {
          bgClass: 'bg-primary bg-opacity-10',
          borderClass: 'border-primary',
          textClass: 'text-primary',
          icon: '🔄',
          label: 'Pending'
        };
      case 'upcoming':
        return {
          bgClass: 'bg-light',
          borderClass: 'border-secondary',
          textClass: 'text-secondary',
          icon: '⏳',
          label: 'Upcoming'
        };
      case 'overtime':
        return {
          bgClass: 'bg-warning bg-opacity-10',
          borderClass: 'border-warning',
          textClass: 'text-warning',
          icon: '⚡',
          label: 'Overtime'
        };
      case 'off':
        return {
          bgClass: 'bg-white',
          borderClass: 'border-light',
          textClass: 'text-muted',
          icon: '🏠',
          label: 'Day Off'
        };
      default:
        return {
          bgClass: 'bg-light',
          borderClass: 'border-secondary',
          textClass: 'text-secondary',
          icon: '⏳',
          label: 'Unknown'
        };
    }
  };

  // Initialize and update charts when dashboardData is available
  useEffect(() => {
    // Use the actual data if available, otherwise use the default data
    const data = dashboardData || defaultDashboardData;

    // FIX 1: Check if the ref is attached to a DOM element before initializing
    if (!barChartRef.current || !pieChartRef.current) {
      return;
    }

    // Initialize Bar Chart
    const barChart = echarts.init(barChartRef.current);
    
    const taskGraphData = data.taskGraph && data.taskGraph.length > 0 
      ? data.taskGraph.map(item => item.count)
      : [0]; 

    const taskGraphLabels = data.taskGraph && data.taskGraph.length > 0
      ? data.taskGraph.map(item => {
          const date = new Date(item.day);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        })
      : ['Mon']; 

    // FIX 2: Handle the case where there is no data for the bar chart
    if (taskGraphData.length === 1 && taskGraphData[0] === 0) {
      barChart.setOption({
        title: {
          text: 'No Data',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#aaa',
            fontSize: 16
          }
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      });
    } else {
      const barOption = {
        animation: false,
        grid: {
          top: 20,
          right: 20,
          bottom: 40,
          left: 40
        },
        xAxis: {
          type: 'category',
          data: taskGraphLabels,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisTick: { show: false },
          axisLabel: { color: '#6b7280' }
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        series: [{
          data: taskGraphData,
          type: 'bar',
          itemStyle: {
            color: '#2f6a87',
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: '#6eb2cc'
            }
          }
        }],
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#e5e7eb',
          textStyle: { color: '#1f2937' }
        }
      };
      barChart.setOption(barOption);
    }
    
    // Initialize Pie Chart
    const pieChart = echarts.init(pieChartRef.current);
    
    const completed = data.maintenanceStats ? data.maintenanceStats.completed : 0;
    const pending = data.maintenanceStats ? data.maintenanceStats.pending : 0;
    
    const pieOption = {
      animation: false,
      grid: { top: 0, right: 0, bottom: 0, left: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        data: [
          { value: completed, name: 'Completed', itemStyle: { color: '#10b981' } },
          { value: pending, name: 'Pending', itemStyle: { color: '#f59e0b' } }
        ],
        itemStyle: {
          borderRadius: 4
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}',
          color: '#1f2937'
        }
      }],
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937' }
      }
    };
    pieChart.setOption(pieOption);
    
    // Handle window resize
    const handleResize = () => {
      barChart.resize();
      pieChart.resize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      barChart.dispose();
      pieChart.dispose();
    };
  }, [dashboardData]); // Rerun effect when data changes

  if (loading) {
    return (
      <div className='w-100 min-vh-100 bg-light d-flex justify-content-center align-items-center'>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Use the actual data if available, otherwise use the default data
  const data = dashboardData || defaultDashboardData;
  
  // Calculate percentage for tasks
  const tasksPercentage = data.tasksTotal > 0 
    ? Math.round((data.tasksCompleted / data.tasksTotal) * 100) 
    : 0;

  // Calculate percentage for attendance
  const attendancePercentage = data.attendanceTotal > 0 
    ? Math.round((data.attendancePresent / data.attendanceTotal) * 100) 
    : 0;

  return (
    <div className='w-100 min-vh-100 bg-light p-0'>
      <div className="p-2 p-sm-3 p-md-4">
        
        {/* Header */}
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-bold">Welcome, {name}!</h1>
          <p className="text-muted">Your schedule, tasks, and alerts for today</p>
        </div>
        
        {/* Summary Widgets */}
        <div className="row g-3 g-md-4 mb-4 mb-md-5">
          
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 border-0 transition-all hover-lift">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded me-2">
                      <RiCalendarLine className="text-primary fs-4 fs-md-5" />
                    </div>
                    <span className="h2 fw-bold text-gray-900">
                      {data.todayShifts}
                    </span>
                  </div>
                  <h3 className="h6 fw-semibold mb-1">Shifts Today</h3>
                  <p className="text-muted small mb-0">
                    {data.weeklyRoster && data.weeklyRoster.length > 0 
                      ? `Next: ${data.weeklyRoster[0].start.substring(0, 5)} – ${data.weeklyRoster[0].end.substring(0, 5)}`
                      : 'No upcoming shifts'
                    }
                  </p>
                </div>
                {/* <div className="ms-2">
                  <button className="btn btn-sm btn-light rounded-circle p-1">
                    <RiArrowRightSLine className="text-primary" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 border-0 transition-all hover-lift">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded me-2">
                      <RiTaskLine className="text-success fs-4 fs-md-5" />
                    </div>
                    <span className="h2 fw-bold text-gray-900">
                      {data.tasksCompleted}/{data.tasksTotal}
                    </span>
                  </div>
                  <h3 className="h6 fw-semibold mb-1">Tasks Completed</h3>
                  <div className="d-flex align-items-center">
                    <div className="w-100 bg-gray-200 rounded-full h-2 me-2">
                      <div className="bg-success h-2 rounded-full" style={{ width: `${tasksPercentage}%` }}></div>
                    </div>
                    <span className="text-success small fw-medium">{tasksPercentage}%</span>
                  </div>
                </div>
                {/* <div className="ms-2">
                  <button className="btn btn-sm btn-light rounded-circle p-1">
                    <RiArrowRightSLine className="text-success" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 border-0 transition-all hover-lift">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded me-2">
                      <RiToolsLine className="text-warning fs-4 fs-md-5" />
                    </div>
                    <span className="h2 fw-bold text-gray-900">
                      {data.pendingMaintenance}
                    </span>
                  </div>
                  <h3 className="h6 fw-semibold mb-1">Pending Maintenance</h3>
                  <p className="text-muted small mb-0">Requires attention</p>
                </div>
                {/* <div className="ms-2">
                  <button className="btn btn-sm btn-light rounded-circle p-1">
                    <RiArrowRightSLine className="text-warning" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>
          
          <div className="col-6 col-md-3">
            <div className="card shadow-sm h-100 border-0 transition-all hover-lift">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="d-flex align-items-center mb-3">
                    <div className="bg-info bg-opacity-10 p-2 rounded me-2">
                      <RiUserLine className="text-info fs-4 fs-md-5" />
                    </div>
                    <span className="h2 fw-bold text-gray-900">
                      {data.attendancePresent}/{data.attendanceTotal}
                    </span>
                  </div>
                  <h3 className="h6 fw-semibold mb-1">Attendance This Week</h3>
                  <div className="d-flex align-items-center">
                    <span className="text-success me-1">✅</span>
                    <span className="text-muted small">
                      {attendancePercentage >= 85 ? 'Excellent record' : 'Good record'}
                    </span>
                  </div>
                </div>
                {/* <div className="ms-2">
                  <button className="btn btn-sm btn-light rounded-circle p-1">
                    <RiArrowRightSLine className="text-info" />
                  </button>
                </div> */}
              </div>
            </div>
          </div>

        </div>
        
        {/* Weekly Duty Roster */}
        {/* <div className="card shadow-sm border-0 mb-4 mb-md-5">
          <div className="card-header bg-white border-0 py-3 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h5 fw-semibold mb-0">Upcoming Shifts</h2>
              <button 
                className="btn btn-sm btn-outline-secondary d-md-none"
                onClick={() => setShowMore(!showMore)}
              >
                {showMore ? 'Show Less' : 'Show More'}
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="p-3 p-md-4">
              {data.weeklyRoster && data.weeklyRoster.length > 0 ? (
                (showMore ? data.weeklyRoster : data.weeklyRoster.slice(0, 3)).map((shift, index) => {
                  const styling = getStatusStyling(shift.status);
                  const shiftDate = new Date(shift.date);
                  const formattedDate = shiftDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  const startTime = shift.start.substring(0, 5);
                  const endTime = shift.end.substring(0, 5);

                  return (
                    <div key={index} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                      <div>
                        <div className="fw-medium">{formattedDate}</div>
                        <div className="text-muted small">Branch ID: {shift.branch}</div>
                      </div>
                      <div className="text-center">
                        <div className="fw-medium">{startTime} - {endTime}</div>
                        <div className={`text-${styling.textClass} small`}>{styling.icon} {styling.label}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-4 text-muted">
                  No upcoming shifts scheduled.
                </div>
              )}
            </div>
          </div>
        </div> */}
        
        {/* Charts Section */}
        <div className="row g-3 g-md-4">
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 py-3 px-4">
                <h3 className="h5 fw-semibold mb-0">Tasks Completed (Last 7 Days)</h3>
              </div>
              <div className="card-body">
                <div ref={barChartRef} style={{ height: '300px' }}></div>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white border-0 py-3 px-4">
                <h3 className="h5 fw-semibold mb-0">Maintenance Status</h3>
              </div>
              <div className="card-body">
                <div ref={pieChartRef} style={{ height: '300px' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <style jsx>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default HouseKeepingDashboard;