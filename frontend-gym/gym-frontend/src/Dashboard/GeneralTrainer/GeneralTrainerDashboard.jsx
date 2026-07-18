import React, { useEffect, useRef, useState } from 'react';
import { 
  RiCalendarEventLine, 
  RiGroupLine, 
  RiMessage2Line, 
  RiTrophyLine,
  RiCheckLine,
  RiTimeLine,
  RiClipboardLine,
  RiChat3Line,
  RiBarChartLine
} from 'react-icons/ri';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as echarts from 'echarts';
import axiosInstance from '../../Api/axiosInstance';
import AnnouncementBanner from '../../Components/AnnouncementBanner';

const GeneralTrainerDashboard = () => {
  const attendanceChartRef = useRef(null);
  const engagementChartRef = useRef(null);
  const [dashboardData, setDashboardData] = useState({
    weeklyAttendanceTrend: [],
    classDistribution: [],
    classesToday: { total: 0, next: "No more classes today" },
    membersToTrain: { count: 0, label: "Active members" },
    pendingFeedback: { count: 0, label: "Requires attention" },
    classesThisWeek: { total: 0, completed: 0 },
    dailyClassSchedule: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const memberId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = user?.adminId || 90;
  const fullName = user?.fullName || null;


  // Fetch data from API using axios
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get branchId from localStorage user object
        let branchId = '2'; // Default fallback
        
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.branchId) {
              branchId = user.branchId;
            }
          }
        } catch (err) {
          console.error('Error parsing user from localStorage:', err);
        }
        
        // Using axios instead of fetch
        const response = await axiosInstance.get(`generaltrainer/dashboard?adminId=${adminId}`);
        
        // Process the response data to convert statistics to English
        const data = response.data;
        
        // Convert statistics to English
        const processedData = {
          ...data,
          classesToday: {
            ...data.classesToday,
            next: data.classesToday.next === "आज कोई क्लास नहीं" ? "No more classes today" : data.classesToday.next
          },
          membersToTrain: {
            ...data.membersToTrain,
            label: data.membersToTrain.label === "सक्रिय सदस्य" ? "Active members" : data.membersToTrain.label
          },
          pendingFeedback: {
            ...data.pendingFeedback,
            label: data.pendingFeedback.label === "ध्यान आवश्यक" ? "Requires attention" : data.pendingFeedback.label
          }
        };
        
        setDashboardData(processedData);
      } catch (err) {
        // Axios provides more detailed error information
        const errorMessage = err.response ? 
          `Server responded with ${err.response.status}: ${err.response.data.message || err.response.statusText}` :
          err.message;
        setError(errorMessage);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // This effect runs only once on mount

  // Initialize charts
  useEffect(() => {
    // 1. If still loading or refs not bound to DOM elements, don't execute
    if (loading || !attendanceChartRef.current || !engagementChartRef.current) {
      return;
    }

    // 2. Initialize chart instances
    const attendanceChart = echarts.init(attendanceChartRef.current);
    const engagementChart = echarts.init(engagementChartRef.current);

    // 3. Prepare chart data, prioritize API data, otherwise use default data
    const attendanceDays = dashboardData.weeklyAttendanceTrend.length > 0 
      ? dashboardData.weeklyAttendanceTrend.map(item => item.day)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
    const attendanceCounts = dashboardData.weeklyAttendanceTrend.length > 0
      ? dashboardData.weeklyAttendanceTrend.map(item => item.count)
      : [85, 92, 78, 94, 88, 76, 82];

    const classData = dashboardData.classDistribution.length > 0
      ? dashboardData.classDistribution
      : [
          { value: 35, name: 'Cardio', itemStyle: { color: 'rgba(87, 181, 231, 1)' } },
          { value: 25, name: 'Strength', itemStyle: { color: 'rgba(141, 211, 199, 1)' } },
          { value: 20, name: 'Yoga', itemStyle: { color: 'rgba(251, 191, 114, 1)' } },
          { value: 20, name: 'HIIT', itemStyle: { color: 'rgba(252, 141, 98, 1)' } }
        ];

    // 4. Set chart options
    const attendanceOption = {
      animation: false,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#1f2937' }
      },
      grid: {
        top: 10, right: 10, bottom: 20, left: 40, containLabel: true
      },
      xAxis: {
        type: 'category',
        data: attendanceDays,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#1f2937' }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: '#1f2937' },
        splitLine: { lineStyle: { color: '#e5e7eb' } }
      },
      series: [{
        name: 'Attendance',
        type: 'line',
        smooth: true,
        data: attendanceCounts,
        lineStyle: { color: 'rgba(87, 181, 231, 1)' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0, color: 'rgba(87, 181, 231, 0.2)'
          }, {
            offset: 1, color: 'rgba(87, 181, 231, 0.05)'
          }])
        },
        symbol: 'none'
      }]
    };
    attendanceChart.setOption(attendanceOption);

    const engagementOption = {
      animation: false,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#eee',
        borderWidth: 1,
        textStyle: { color: '#1f2937' }
      },
      legend: {
        bottom: '0', left: 'center',
        textStyle: { color: '#1f2937' }
      },
      series: [{
        name: 'Class Distribution',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: '14', fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: classData
      }]
    };
    engagementChart.setOption(engagementOption);

    // 5. Handle window resize
    const handleResize = () => {
      attendanceChart.resize();
      engagementChart.resize();
    };
    window.addEventListener('resize', handleResize);

    // 6. Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      attendanceChart.dispose();
      engagementChart.dispose();
    };
  // 7. Key: Add loading and dashboardData as dependencies
  }, [loading, dashboardData]); 

  // Handle class block click
  const handleClassClick = (className, time) => {
    alert(`Class Details:\n${className}\n${time}\n\nClick to view full details or mark attendance.`);
  };

  // Get current date for the schedule
  const getCurrentDate = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const currentDate = today.getDate();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    return {
      today: currentDay,
      dates: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date.getDate();
      })
    };
  };

  const { today, dates } = getCurrentDate();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light p-0">
      <div className="p-2 p-sm-3 p-md-4">
        {/* Header */}
        <header className="bg-white border-bottom border-gray-200 p-3 p-sm-4 mb-4 rounded shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="mb-3 mb-md-0 text-center text-md-start">
              <h1 className="h3 h2-md fw-bold text-dark">Welcome, {fullName}!</h1>
              <p className="text-secondary">Your schedule and tasks for today</p>
            </div>
          </div>
        </header>

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Statistics Section */}
        <div className="row mb-4">
          <div className="col-12 mb-4 mb-lg-0">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <h3 className="h5 h4-md fw-semibold text-dark mb-2 mb-md-0">Weekly Attendance Trend</h3>
                <select className="form-select form-select-sm w-auto">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Last 3 Months</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                {/* Ensure ref is bound to this div */}
                <div ref={attendanceChartRef} style={{ height: '250px', width: '100%' }}></div>
              </div>
            </div>
          </div>
          <div className="col-12 mt-4">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                <h3 className="h5 h4-md fw-semibold text-dark mb-2 mb-md-0">Class Distribution</h3>
                <select className="form-select form-select-sm w-auto">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                {/* Ensure ref is bound to this div */}
                <div ref={engagementChartRef} style={{ height: '250px', width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-6 col-md-3 mb-3">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-secondary small fw-medium">Classes Today</p>
                  <p className="h4 h3-md fw-bold text-dark mt-2">{dashboardData.classesToday.total}</p>
                  <p className="text-primary small mt-1">{dashboardData.classesToday.next}</p>
                </div>
                <div className="bg-primary bg-opacity-10 rounded p-2">
                  <RiCalendarEventLine className="text-primary fs-4 fs-3-md" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-secondary small fw-medium">Members to Train</p>
                  <p className="h4 h3-md fw-bold text-dark mt-2">{dashboardData.membersToTrain.count}</p>
                  <p className="text-success small mt-1">{dashboardData.membersToTrain.label}</p>
                </div>
                <div className="bg-success bg-opacity-10 rounded p-2">
                  <RiGroupLine className="text-success fs-4 fs-3-md" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-secondary small fw-medium">Pending Feedback</p>
                  <p className="h4 h3-md fw-bold text-dark mt-2">{dashboardData.pendingFeedback.count}</p>
                  <p className="text-warning small mt-1">{dashboardData.pendingFeedback.label}</p>
                </div>
                <div className="bg-warning bg-opacity-10 rounded p-2">
                  <RiMessage2Line className="text-warning fs-4 fs-3-md" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="bg-white rounded shadow-sm p-3 p-md-4 border h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-secondary small fw-medium">Classes This Week</p>
                  <p className="h4 h3-md fw-bold text-dark mt-2">{dashboardData.classesThisWeek.total}</p>
                  <p className="text-info small mt-1">{dashboardData.classesThisWeek.completed} Completed classes</p>
                </div>
                <div className="bg-info bg-opacity-10 rounded p-2">
                  <RiTrophyLine className="text-info fs-4 fs-3-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Class Schedule */}
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <div className="p-3 p-md-4 border-bottom">
            <h2 className="h4 h3-md fw-semibold text-dark">Daily Class Schedule</h2>
            <p className="text-secondary small">Weekly view - {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="p-3 p-md-4">
            <div className="overflow-x-auto">
              {/* Mobile View - List Format */}
              <div className="d-block d-lg-none">
                {weekDays.map((day, dayIndex) => (
                  <div key={day} className="mb-4">
                    <h5 className="fw-semibold text-dark mb-3">{day} ({dates[dayIndex]})</h5>
                    <div className="list-group">
                      {dashboardData.dailyClassSchedule
                        .filter(classItem => {
                          const classDate = new Date(classItem.date);
                          return classDate.getDay() === dayIndex;
                        })
                        .map((classItem, index) => (
                          <div 
                            key={index}
                            className={`list-group-item p-2 mb-2 rounded cursor-pointer ${
                              classItem.status === 'completed' ? '' : 'bg-warning text-white'
                            }`}
                            onClick={() => handleClassClick(classItem.name, `${classItem.startTime}-${classItem.endTime}`)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="small fw-semibold">{classItem.name}</div>
                                <div className="small opacity-90">{classItem.startTime}-{classItem.endTime}</div>
                                <div className="small opacity-90">{classItem.location} • {classItem.attendance}/{classItem.capacity}</div>
                              </div>
                              <div className="small">
                                {classItem.status === 'completed' ? (
                                  <>
                                    <RiCheckLine />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <RiTimeLine />
                                    Upcoming
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {dashboardData.dailyClassSchedule.filter(classItem => {
                        const classDate = new Date(classItem.date);
                        return classDate.getDay() === dayIndex;
                      }).length === 0 && (
                        <div className="list-group-item p-2 mb-2 rounded">
                          <div className="text-center text-muted">No classes scheduled</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop View - Grid Format */}
              <div className="d-none d-lg-block">
                {/* Calendar Header */}
                <div className="d-grid border border-gray-200" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', gap: '1px' }}>
                  <div className="bg-light p-2 text-center fw-medium text-secondary">Time</div>
                  {weekDays.map((day, index) => (
                    <div key={day} className="bg-light p-2 text-center fw-medium text-secondary">
                      {day}<br/><span className="text-muted small">{dates[index]}</span>
                    </div>
                  ))}
                </div>
                
                {/* Calendar Body */}
                <div className="d-grid border border-gray-200 mt-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', gap: '1px' }}>
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = i + 6;
                    const displayHour = hour <= 12 ? hour : hour - 12;
                    const period = hour < 12 ? 'AM' : hour === 12 ? 'PM' : 'PM';
                    
                    return (
                      <React.Fragment key={hour}>
                        <div className="bg-light p-2 d-flex align-items-center justify-content-center small fw-medium text-secondary">
                          {displayHour}:00 {period}
                        </div>
                        
                        {weekDays.map((day, dayIndex) => {
                          const classesForSlot = dashboardData.dailyClassSchedule.filter(classItem => {
                            const classDate = new Date(classItem.date);
                            const classHour = classItem.startTime ? parseInt(classItem.startTime.split(':')[0]) : 0;
                            
                            return (
                              classDate.getDay() === dayIndex && 
                              classHour === hour
                            );
                          });
                          
                          return (
                            <div key={`${day}-${hour}`} className="bg-white p-2">
                              {classesForSlot.map((classItem, index) => (
                                <div 
                                  key={index}
                                  className={`text-white p-2 rounded cursor-pointer mb-2 ${
                                    classItem.status === 'completed' ? '' : 'bg-warning'
                                  }`}
                                  style={{ backgroundColor: classItem.status === 'completed' ? '#2f6a87' : undefined }}
                                  onClick={() => handleClassClick(classItem.name, `${classItem.startTime}-${classItem.endTime}`)}
                                >
                                  <div className="small fw-semibold">{classItem.name}</div>
                                  <div className="small opacity-90">{classItem.startTime}-{classItem.endTime}</div>
                                  <div className="small opacity-90">{classItem.location} • {classItem.attendance}/{classItem.capacity}</div>
                                  <div className="small mt-1">
                                    <span className="d-flex align-items-center">
                                      {classItem.status === 'completed' ? (
                                        <>
                                          <RiCheckLine className="me-1" />
                                          Completed
                                        </>
                                      ) : (
                                        <>
                                          <RiTimeLine className="me-1" />
                                          Upcoming
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTrainerDashboard;