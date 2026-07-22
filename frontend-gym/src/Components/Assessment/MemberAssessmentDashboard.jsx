import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../Api/axiosInstance';
import AssessmentHistory from './AssessmentHistory';
import 'bootstrap/dist/css/bootstrap.min.css';

const MemberAssessmentDashboard = ({ memberId }) => {
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Month selector state (defaults to current YYYY-MM)
  const today = new Date();
  const currentMonthDefault = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthDefault);

  const getPreviousMonthStr = (monthStr) => {
    if (!monthStr) return '';
    const [y, m] = monthStr.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const prevMonthStr = getPreviousMonthStr(selectedMonth);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch latest assessment
      const resLatest = await axiosInstance.get(`/v1/assessments/member/${memberId}/latest`);
      if (resLatest.data.success && resLatest.data.data) {
        setAssessment(resLatest.data.data);
      } else {
        setAssessment({
          id: null,
          assessment_date: null,
          fitness_goal: 'N/A',
          metrics: {
            bmi: '-',
            body_fat_percentage: '-',
            lean_body_mass: '-',
            ideal_body_weight: '-',
            waist_to_hip_ratio: null,
            bmr: '-',
            tdee: '-',
            target_calories: '-'
          },
          inputs: {
            fitness_goal: '',
            weight_kg: '-',
            height_cm: '-'
          },
          macros: { protein_grams: 0, fat_grams: 0, carb_grams: 0 },
          dashboard_data: { bmi_risk_label: '-', cardio_zones: { fat_burn_low: '-', fat_burn_high: '-', cardio_low: '-', cardio_high: '-' } }
        });
      }

      // 2. Fetch full history for month-over-month comparison
      try {
        const resHist = await axiosInstance.get(`/v1/assessments/member/${memberId}/history`);
        if (resHist.data.success && Array.isArray(resHist.data.data)) {
          setHistory(resHist.data.data);
        }
      } catch (hErr) {
        console.error("Failed to fetch history for dashboard comparison", hErr);
      }

      // 3. Fetch member info for report header
      try {
        const resMember = await axiosInstance.get(`/members/detail/${memberId}`);
        if (resMember.data && (resMember.data.data || resMember.data.member)) {
          setMemberInfo(resMember.data.data || resMember.data.member);
        }
      } catch (mErr) {
        console.error("Failed to fetch member details", mErr);
      }

    } catch (err) {
      if (err.response?.status === 404) {
        setAssessment({
          id: null,
          assessment_date: null,
          fitness_goal: 'N/A',
          metrics: { bmi: '-', body_fat_percentage: '-', lean_body_mass: '-', ideal_body_weight: '-', waist_to_hip_ratio: null, bmr: '-', tdee: '-', target_calories: '-' },
          inputs: { fitness_goal: '', weight_kg: '-', height_cm: '-' },
          macros: { protein_grams: 0, fat_grams: 0, carb_grams: 0 },
          dashboard_data: { bmi_risk_label: '-', cardio_zones: { fat_burn_low: '-', fat_burn_high: '-', cardio_low: '-', cardio_high: '-' } }
        });
      } else {
        setError({
          type: 'network',
          title: "Temporary Network Issue",
          message: "Could not fetch assessment data from server. Please retry or log a new assessment."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) fetchDashboardData();
  }, [memberId]);

  if (!memberId) return <div className="container mt-5"><div className="alert alert-warning">Please specify a member ID to view dashboard.</div></div>;
  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{height: '50vh'}}>
      <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
    </div>
  );
  if (error) return (
    <div className="container mt-5">
      <div className="card shadow-sm border-0 text-center py-5 px-4 rounded-3">
        <div className="mb-3">
          <i className={`bi ${error.type === '404' ? 'bi-journal-x' : 'bi-exclamation-triangle'} display-4 text-secondary`}></i>
        </div>
        <h4 className="fw-bold text-dark">{error.title}</h4>
        <p className="text-muted small mb-4">{error.message}</p>
        <div className="d-flex justify-content-center gap-2">
          {error.type === 'network' && (
            <button className="btn btn-outline-primary px-4 py-2 fw-semibold" onClick={fetchDashboardData}>
              <i className="bi bi-arrow-clockwise me-1"></i> Retry
            </button>
          )}
          <button className="btn btn-primary px-4 py-2 fw-semibold" onClick={() => navigate('/personaltrainer/assessment-form', { state: { preselectMember: memberId } })}>
            + Log New Assessment for Member
          </button>
        </div>
      </div>
    </div>
  );
  if (!assessment) return null;

  // Defensive null checks for nested properties
  const metrics = assessment.metrics || {
    bmi: assessment.bmi || '-',
    body_fat_percentage: assessment.body_fat_percentage || '-',
    lean_body_mass: assessment.lean_body_mass || '-',
    ideal_body_weight: assessment.ideal_body_weight || '-',
    waist_to_hip_ratio: assessment.waist_to_hip_ratio || null,
    bmr: assessment.bmr || '-',
    tdee: assessment.tdee || '-',
    target_calories: assessment.target_calories || '-'
  };
  const inputs = assessment.inputs || {
    fitness_goal: assessment.fitness_goal || '',
    weight_kg: assessment.weight_kg,
    height_cm: assessment.height_cm
  };
  const macros = assessment.macros || {
    protein_grams: assessment.protein_grams || 0,
    fat_grams: assessment.fat_grams || 0,
    carb_grams: assessment.carb_grams || 0
  };
  let dashboardData = assessment.dashboard_data || {};
  if (!dashboardData || Object.keys(dashboardData).length === 0) {
    try {
      if (typeof assessment.metrics_output === 'string') {
        dashboardData = JSON.parse(assessment.metrics_output);
      } else if (typeof assessment.metrics_output === 'object') {
        dashboardData = assessment.metrics_output || {};
      }
    } catch (e) {
      dashboardData = {};
    }
  }
  const cardioZones = dashboardData.cardio_zones || {};
  const goalStr = inputs.fitness_goal || assessment.fitness_goal || '';
  const fitnessGoal = goalStr ? goalStr.replace(/_/g, ' ').toUpperCase() : 'N/A';

  // --- MONTH-OVER-MONTH COMPARISON CALCULATIONS ---
  const currentMonthLogs = history.filter(item => {
    if (!item.assessment_date) return false;
    const d = new Date(item.assessment_date);
    const itemMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemMonthStr === selectedMonth;
  });

  const previousMonthLogs = history.filter(item => {
    if (!item.assessment_date) return false;
    const d = new Date(item.assessment_date);
    const itemMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemMonthStr === prevMonthStr;
  });

  const currentLog = currentMonthLogs[0] || history[0] || assessment;
  const previousLog = previousMonthLogs[0] || history.find(item => {
    if (!item.assessment_date) return false;
    const d = new Date(item.assessment_date);
    const itemMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemMonthStr < selectedMonth;
  }) || history[1] || null;

  const extractMetric = (logObj, key1, key2) => {
    if (!logObj) return null;
    if (logObj.metrics && logObj.metrics[key1] !== undefined) return parseFloat(logObj.metrics[key1]);
    if (logObj.inputs && logObj.inputs[key1] !== undefined) return parseFloat(logObj.inputs[key1]);
    if (logObj[key1] !== undefined) return parseFloat(logObj[key1]);
    if (key2 && logObj[key2] !== undefined) return parseFloat(logObj[key2]);
    return null;
  };

  const currWeight = extractMetric(currentLog, 'weight_kg');
  const prevWeight = extractMetric(previousLog, 'weight_kg');

  const currFat = extractMetric(currentLog, 'body_fat_percentage');
  const prevFat = extractMetric(previousLog, 'body_fat_percentage');

  const currLean = extractMetric(currentLog, 'lean_body_mass');
  const prevLean = extractMetric(previousLog, 'lean_body_mass');

  const currBMI = extractMetric(currentLog, 'bmi');
  const prevBMI = extractMetric(previousLog, 'bmi');

  const currTDEE = extractMetric(currentLog, 'tdee');
  const prevTDEE = extractMetric(previousLog, 'tdee');

  const formatDiff = (curr, prev, unit = '', isLowerBetter = true) => {
    if (curr === null || prev === null || isNaN(curr) || isNaN(prev)) {
      return { prevStr: prev !== null && !isNaN(prev) ? `${prev.toFixed(1)}${unit}` : '-', currStr: curr !== null && !isNaN(curr) ? `${curr.toFixed(1)}${unit}` : '-', diffStr: '-', status: 'N/A', badgeClass: 'bg-secondary' };
    }
    const diff = curr - prev;
    const diffSign = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
    const prevStr = `${prev.toFixed(1)}${unit}`;
    const currStr = `${curr.toFixed(1)}${unit}`;
    const diffStr = `${diffSign}${unit}`;

    let status = 'No Change';
    let badgeClass = 'bg-secondary';

    if (diff < 0) {
      status = isLowerBetter ? 'Improved (Reduced)' : 'Decreased';
      badgeClass = isLowerBetter ? 'bg-success' : 'bg-warning text-dark';
    } else if (diff > 0) {
      status = isLowerBetter ? 'Increased' : 'Improved (Increased)';
      badgeClass = isLowerBetter ? 'bg-warning text-dark' : 'bg-success';
    }

    return { prevStr, currStr, diffStr, status, badgeClass };
  };

  const compWeight = formatDiff(currWeight, prevWeight, ' kg', true);
  const compFat = formatDiff(currFat, prevFat, '%', true);
  const compLean = formatDiff(currLean, prevLean, ' kg', false);
  const compBMI = formatDiff(currBMI, prevBMI, '', true);
  const compTDEE = formatDiff(currTDEE, prevTDEE, ' kcal', false);

  const comparisonRows = [
    { metric: 'Weight', ...compWeight },
    { metric: 'Body Fat %', ...compFat },
    { metric: 'Lean Body Mass', ...compLean },
    { metric: 'BMI', ...compBMI },
    { metric: 'TDEE (Active Calories)', ...compTDEE }
  ];

  // --- EXPORT CSV FUNCTION ---
  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      alert("No assessment history available to export.");
      return;
    }

    const memberName = memberInfo?.fullName || memberInfo?.name || `Member_${memberId}`;
    const selectedMonthLabel = new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const prevMonthLabel = new Date(`${prevMonthStr}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let csvRows = [];
    csvRows.push(['MEMBER ASSESSMENT & MONTH-OVER-MONTH PROGRESS REPORT']);
    csvRows.push(['Member Name', memberName]);
    csvRows.push(['Member ID', memberId]);
    csvRows.push(['Report Month', selectedMonthLabel]);
    csvRows.push(['Baseline / Compared Month', prevMonthLabel]);
    csvRows.push(['Generated On', `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
    csvRows.push([]);

    csvRows.push(['MONTH-OVER-MONTH IMPROVEMENT COMPARISON']);
    csvRows.push(['Metric', `Previous Month (${prevMonthLabel})`, `Selected Month (${selectedMonthLabel})`, 'Difference / Change', 'Improvement Status']);
    
    comparisonRows.forEach(r => {
      csvRows.push([r.metric, r.prevStr, r.currStr, r.diffStr, r.status]);
    });

    csvRows.push([]);
    csvRows.push(['HISTORICAL ASSESSMENT RECORDS']);
    csvRows.push(['Assessment Date', 'Goal', 'Weight (kg)', 'Height (cm)', 'BMI', 'Body Fat %', 'Lean Mass (kg)', 'BMR (kcal)', 'TDEE (kcal)', 'Target Calories (kcal)']);

    history.forEach(item => {
      const dateStr = item.assessment_date ? new Date(item.assessment_date).toLocaleDateString() : 'N/A';
      const goal = (item.inputs?.fitness_goal || item.fitness_goal || '-').replace(/_/g, ' ');
      const weight = item.inputs?.weight_kg ?? item.weight_kg ?? '-';
      const height = item.inputs?.height_cm ?? item.height_cm ?? '-';
      const bmi = item.metrics?.bmi ?? item.bmi ?? '-';
      const bodyFat = item.metrics?.body_fat_percentage ?? item.body_fat_percentage ?? '-';
      const leanMass = item.metrics?.lean_body_mass ?? item.lean_body_mass ?? '-';
      const bmr = item.metrics?.bmr ?? item.bmr ?? '-';
      const tdee = item.metrics?.tdee ?? item.tdee ?? '-';
      const targetCal = item.metrics?.target_calories ?? item.target_calories ?? '-';

      csvRows.push([dateStr, goal, weight, height, bmi, bodyFat, leanMass, bmr, tdee, targetCal]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${memberName.replace(/\s+/g, '_')}_Progress_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedMonthObj = new Date(`${selectedMonth}-01`);
  const selectedMonthText = isNaN(selectedMonthObj) ? selectedMonth : selectedMonthObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-11">
          
          {/* Header Toolbar Card */}
          <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white p-3 p-md-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
              
              {/* Left: Title, Goal & Last Updated */}
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h2 className="text-dark fw-bold mb-0 text-nowrap">Assessment Dashboard</h2>
                  <span className="badge bg-primary py-2 px-3 fw-semibold">
                    Goal: {fitnessGoal}
                  </span>
                </div>
                <p className="text-muted mb-0 small mt-1">
                  <i className="bi bi-clock-history me-1"></i>Last Updated: {assessment.assessment_date ? new Date(assessment.assessment_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              {/* Right: Actions (Month Picker, Export CSV, Log New Assessment) */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                {/* Month Picker */}
                <div className="d-flex align-items-center bg-light border rounded-3 px-3 py-1 me-1">
                  <i className="bi bi-calendar-event text-primary me-2"></i>
                  <span className="small text-muted me-2 fw-medium text-nowrap">Month:</span>
                  <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="form-control form-control-sm border-0 bg-transparent shadow-none p-0 fw-semibold text-dark"
                    style={{ width: '130px', cursor: 'pointer' }}
                  />
                </div>

                {/* Export CSV Button */}
                <button 
                  onClick={handleExportCSV}
                  className="btn btn-outline-success btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 shadow-none"
                  title="Download CSV Progress Report"
                >
                  <i className="bi bi-file-earmark-spreadsheet-fill"></i>
                  <span className="text-nowrap">Export CSV</span>
                </button>

                {/* Log New Assessment Button */}
                <button 
                  className="btn btn-primary btn-sm px-3 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm text-nowrap"
                  onClick={() => navigate('/personaltrainer/assessment-form', { state: { preselectMember: memberId } })}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Log New Assessment</span>
                </button>
              </div>

            </div>
          </div>

          {/* Component Metrics Cards */}
          <div className="row g-4 mb-4">
            
            {/* Component A - Vital Composition */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-primary border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-person-lines-fill text-primary me-2"></i>Vital Composition
                  </h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">BMI</span>
                      <strong>{metrics.bmi} <span className="badge bg-light text-dark border ms-1">{dashboardData.bmi_risk_label || '-'}</span></strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Body Fat</span>
                      <strong>{metrics.body_fat_percentage}%</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Lean Mass</span>
                      <strong>{metrics.lean_body_mass} kg</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Ideal Weight</span>
                      <strong>{metrics.ideal_body_weight} kg</strong>
                    </li>
                    {metrics.waist_to_hip_ratio && (
                      <li className="list-group-item d-flex justify-content-between px-0">
                        <span className="text-muted">WHR</span>
                        <strong>{metrics.waist_to_hip_ratio}</strong>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Component B - Energy Analytics */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-warning border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-lightning-charge-fill text-warning me-2"></i>Energy Analytics
                  </h5>
                  <ul className="list-group list-group-flush mb-3">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">BMR (Resting)</span>
                      <strong>{metrics.bmr} kcal</strong>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">TDEE (Active)</span>
                      <strong>{metrics.tdee} kcal</strong>
                    </li>
                  </ul>
                  <div className="p-3 bg-warning bg-opacity-10 rounded text-center mt-auto border border-warning border-opacity-25">
                    <div className="text-warning text-uppercase small fw-bold">Daily Target Calories</div>
                    <div className="fs-3 fw-bold text-dark">{metrics.target_calories} <span className="fs-6 text-muted fw-normal">kcal</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Component C - Macro Blueprint */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-success border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-pie-chart-fill text-success me-2"></i>Macro Blueprint
                  </h5>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 mb-2 bg-danger bg-opacity-10 rounded border border-danger border-opacity-25">
                    <span className="text-danger fw-semibold">Protein</span>
                    <strong className="text-danger fs-5">{macros.protein_grams}g</strong>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 mb-2 bg-warning bg-opacity-10 rounded border border-warning border-opacity-25">
                    <span className="text-warning fw-semibold text-dark">Fat</span>
                    <strong className="text-warning text-dark fs-5">{macros.fat_grams}g</strong>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-info bg-opacity-10 border border-info border-opacity-25">
                    <span className="text-info text-dark fw-semibold">Carbs</span>
                    <strong className="text-info text-dark fs-5">{macros.carb_grams}g</strong>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Component D - Cardio Guidance */}
            <div className="col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 border-top border-danger border-4 rounded-3">
                <div className="card-body">
                  <h5 className="card-title text-secondary fw-bold mb-4">
                    <i className="bi bi-heart-pulse-fill text-danger me-2"></i>Cardio Guidance
                  </h5>
                  
                  <div className="mb-4">
                    <div className="text-muted small text-uppercase fw-bold mb-1">Fat Burn Zone (60-70%)</div>
                    <div className="d-flex align-items-center">
                      <h3 className="text-danger mb-0 me-2">{cardioZones.fat_burn_low || '-'}</h3>
                      <span className="text-muted mx-1">-</span>
                      <h3 className="text-danger mb-0 ms-2">{cardioZones.fat_burn_high || '-'}</h3>
                      <span className="ms-2 text-muted small">BPM</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-muted small text-uppercase fw-bold mb-1">Cardio Zone (70-80%)</div>
                    <div className="d-flex align-items-center">
                      <h3 className="text-dark mb-0 me-2">{cardioZones.cardio_low || '-'}</h3>
                      <span className="text-muted mx-1">-</span>
                      <h3 className="text-dark mb-0 ms-2">{cardioZones.cardio_high || '-'}</h3>
                      <span className="ms-2 text-muted small">BPM</span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

          </div>

          {/* Month-over-Month Improvement & Progress Comparison Card */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title text-secondary fw-bold mb-0">
                  <i className="bi bi-[#198754] bi-arrow-down-up text-success me-2"></i>Month-over-Month Improvement ({selectedMonthText})
                </h5>
                <small className="text-muted">Comparing {selectedMonthText} metrics against previous baseline</small>
              </div>
            </div>
            <div className="card-body p-4">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Metric</th>
                      <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Previous Month</th>
                      <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Selected Month</th>
                      <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Change</th>
                      <th scope="col" className="text-muted text-uppercase" style={{fontSize: '0.8rem'}}>Improvement Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold text-dark">{row.metric}</td>
                        <td className="text-muted">{row.prevStr}</td>
                        <td className="fw-bold text-dark">{row.currStr}</td>
                        <td className="fw-bold">{row.diffStr}</td>
                        <td>
                          <span className={`badge ${row.badgeClass} px-3 py-2 fw-medium`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Historical Graph & Detailed Table */}
          <AssessmentHistory memberId={memberId} />

        </div>
      </div>
    </div>
  );
};

export default MemberAssessmentDashboard;
