import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import BaseUrl from '../../Api/BaseUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMedal, 
  faFire, 
  faDumbbell, 
  faBalanceScale, 
  faTrophy, 
  faRedo, 
  faUserCheck, 
  faFileExcel,
  faCalendarAlt,
  faArrowUp,
  faArrowDown,
  faMinus
} from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import './MemberLeaderboard.css';

const MemberLeaderboard = () => {
  const [activeTab, setActiveTab] = useState('fat_loss');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMonthLabel, setSelectedMonthLabel] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const loggedInMemberId = user.memberId || user.id || null;
  const [selectedBranchId, setSelectedBranchId] = useState(user.branchId || 1);
  const [selectedBranchName, setSelectedBranchName] = useState(user.branchName || "Main Branch");
  const [branches, setBranches] = useState([]);

  const userRole = user.roleName || user.role || '';
  const isSuperAdmin = (userRole || '').toUpperCase() === 'SUPERADMIN';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, selectedBranchId, selectedMonth]);

  const fetchBranches = async () => {
    try {
      const res = await axiosInstance.get('v1/branches');
      let branchesData = Array.isArray(res.data) 
        ? res.data 
        : res.data?.branches || res.data?.branch 
        ? (Array.isArray(res.data.branches) ? res.data.branches : [res.data.branch]) 
        : [];
      setBranches(branchesData);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const monthQuery = selectedMonth ? `&month=${selectedMonth}` : '';
      let response;
      try {
        response = await axiosInstance.get(`v1/leaderboard?branchId=${selectedBranchId}&goal=${activeTab}${monthQuery}`);
      } catch (err1) {
        response = await axiosInstance.get(`leaderboard?branchId=${selectedBranchId}&goal=${activeTab}${monthQuery}`);
      }

      if (response && response.data) {
        const list = response.data.leaderboard || response.data.data || [];
        setLeaderboardData(Array.isArray(list) ? list : []);

        if (response.data.availableMonths && Array.isArray(response.data.availableMonths)) {
          setAvailableMonths(response.data.availableMonths);
        }

        if (response.data.selectedMonth && !selectedMonth) {
          setSelectedMonth(response.data.selectedMonth);
        }
        if (response.data.monthLabel) {
          setSelectedMonthLabel(response.data.monthLabel);
        }
      } else {
        setLeaderboardData([]);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getMetricLabel = (score) => {
    const roundedScore = typeof score === 'number' ? score.toFixed(2) : score;
    if (activeTab === 'fat_loss') {
      return `${roundedScore}% Body Fat Improvement`;
    }
    if (activeTab === 'muscle_gain') {
      return `${roundedScore}% Lean Mass Improvement`;
    }
    return `${roundedScore} Maintenance Score`;
  };

  const getAvatarUrl = (member) => {
    const imgPath = member.avatar || member.profile_image || member.profileImage;
    if (!imgPath) {
      const name = member.fullName || member.member_name || 'Member';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f6a87&color=fff`;
    }
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      return imgPath;
    }
    const cleanBase = (BaseUrl || 'http://localhost:4000/api/').replace('/api/', '');
    return `${cleanBase}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
  };

  const isCurrentUser = (member) => {
    if (!loggedInMemberId) return false;
    const mId = member.member_id || member.memberId || member.id;
    return String(mId) === String(loggedInMemberId);
  };

  const handleExportExcel = () => {
    if (!leaderboardData || leaderboardData.length === 0) return;

    const exportData = leaderboardData.map(item => ({
      "Rank": item.rank,
      "Member ID": item.member_id || item.memberId,
      "Member Name": item.fullName || item.member_name,
      "Fitness Goal": item.fitness_goal ? item.fitness_goal.replace('_', ' ').toUpperCase() : '',
      "Leaderboard Month": item.month_label || item.monthLabel || selectedMonthLabel,
      "Age": item.age || "-",
      "Gender": item.gender || "-",
      "Height (cm)": item.height_cm || "-",
      "Start Weight (kg)": item.start_weight ?? "-",
      "Current Weight (kg)": item.current_weight ?? "-",
      "Weight Change": item.weight_change_str || "-",
      "Baseline Body Fat %": item.baseline_bf_percent ? `${item.baseline_bf_percent}%` : "-",
      "Current Body Fat %": item.current_bf_percent ? `${item.current_bf_percent}%` : "-",
      "Baseline Muscle Mass (kg)": item.baseline_lbm ? `${item.baseline_lbm} kg` : "-",
      "Current Muscle Mass (kg)": item.current_lbm ? `${item.current_lbm} kg` : "-",
      "Baseline BMI": item.baseline_bmi ?? "-",
      "Current BMI": item.current_bmi ?? "-",
      "Member Gain": item.member_gain || "-",
      "Member Loss": item.member_loss || "-",
      "Overall Improvement": item.overall_improvement || "-",
      "Previous Rank": item.previous_rank ? `#${item.previous_rank}` : "-",
      "Rank Change": item.rank_change || "NEW",
      "Status": item.status || "Active"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard");

    const monthFileStr = (selectedMonth || 'current').replace('-', '_');
    const fileName = `leaderboard_${activeTab}_${monthFileStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderPodium = () => {
    const top3 = leaderboardData.slice(0, 3);
    if (top3.length === 0) return null;

    // Podium visual ordering: 2nd (left), 1st (center), 3rd (right)
    const order = top3.length === 1 ? [0] : top3.length === 2 ? [1, 0] : [1, 0, 2];
    const podiumHeights = { 0: '110px', 1: '80px', 2: '60px' };

    return (
      <div className="podium-container d-flex justify-content-center align-items-end mt-2 mb-5" style={{ gap: '8px' }}>
        {order.map((index) => {
          const member = top3[index];
          if (!member) return null;
          
          const isWinner = index === 0;
          const isMe = isCurrentUser(member);

          return (
            <div 
              key={member.member_id || member.memberId || index} 
              className={`podium-step step-${index + 1} d-flex flex-column align-items-center ${isMe ? 'podium-highlight' : ''}`} 
              style={{ flex: 1, maxWidth: '140px' }}
            >
              <div className="podium-avatar mb-2 position-relative">
                {isWinner && <FontAwesomeIcon icon={faMedal} className="winner-crown position-absolute text-warning" style={{ top: '-14px', fontSize: '1.2rem' }} />}
                <img 
                  src={getAvatarUrl(member)} 
                  alt={member.fullName || member.member_name} 
                  className={`rounded-circle shadow-sm ${isWinner ? 'winner-avatar border border-3 border-warning' : 'border border-2 border-secondary'}`} 
                  style={{ width: isWinner ? '58px' : '48px', height: isWinner ? '58px' : '48px', objectFit: 'cover' }}
                />
                {isMe && (
                  <span className="position-absolute bottom-0 start-50 translate-middle-x badge bg-primary rounded-pill text-white" style={{ fontSize: '9px', padding: '2px 5px' }}>
                    You
                  </span>
                )}
              </div>

              <div className="text-center fw-bold mb-1 text-dark w-100 px-1" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.fullName || member.member_name}
              </div>

              <div className="text-primary fw-bold bg-primary bg-opacity-10 px-2 py-1 rounded-pill mb-2 text-center" style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', whiteSpace: 'nowrap' }}>
                {getMetricLabel(member.score)}
              </div>

              <div
                className={`podium-base base-${index + 1} d-flex justify-content-center align-items-center text-white fw-bold shadow rounded-top w-100`}
                style={{ 
                  minHeight: podiumHeights[index], 
                  fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                  backgroundColor: index === 0 ? '#ffb703' : index === 1 ? '#94a3b8' : '#cd7f32'
                }}
              >
                #{index + 1}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailedTable = () => {
    if (leaderboardData.length === 0) return null;

    return (
      <div className="detailed-table-container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
            Monthly Member Details ({selectedMonthLabel || 'Current Month'})
          </h5>
          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-3 py-1 fs-6">
            {leaderboardData.length} Member{leaderboardData.length > 1 ? 's' : ''} Qualified
          </span>
        </div>

        <div className="table-responsive shadow-sm rounded-3 border">
          <table className="table table-hover align-middle mb-0 text-nowrap" style={{ width: '100%' }}>
            <thead className="table-light">
              <tr style={{ fontSize: '13px', letterSpacing: '0.3px' }}>
                <th className="px-3 py-3">Rank</th>
                <th className="py-3">Member</th>
                <th className="py-3">Goal</th>
                <th className="py-3">Month</th>
                <th className="py-3">Age / Gender</th>
                <th className="py-3">Start Wt</th>
                <th className="py-3">Current Wt</th>
                <th className="py-3">Wt Change</th>
                <th className="py-3">Body Fat %</th>
                <th className="py-3">Muscle Mass</th>
                <th className="py-3">Member Gain</th>
                <th className="py-3">Member Loss</th>
                <th className="py-3 text-center">Overall Improvement</th>
                <th className="py-3 text-center px-3">Rank Change</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((member) => {
                const isMe = isCurrentUser(member);
                const rankChangeStr = member.rank_change || member.rankChange || 'NEW';
                const isRankUp = rankChangeStr.includes('↑');
                const isRankDown = rankChangeStr.includes('↓');

                return (
                  <tr 
                    key={member.member_id || member.memberId || member.rank}
                    className={isMe ? 'bg-primary bg-opacity-10' : ''}
                  >
                    <td className="px-3 py-3 fw-bold text-dark">
                      <span className={`badge rounded-circle p-2 ${member.rank === 1 ? 'bg-warning text-dark' : member.rank === 2 ? 'bg-secondary text-white' : member.rank === 3 ? 'bg-amber text-white' : 'bg-light text-dark'}`} style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {member.rank}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="d-flex align-items-center">
                        <img 
                          src={getAvatarUrl(member)} 
                          alt={member.fullName || member.member_name}
                          className="rounded-circle me-2 border" 
                          width="36" 
                          height="36"
                          style={{ objectFit: 'cover' }}
                        />
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '14px' }}>
                            {member.fullName || member.member_name}
                            {isMe && (
                              <span className="badge bg-primary text-white rounded-pill ms-2" style={{ fontSize: '10px' }}>
                                You
                              </span>
                            )}
                          </div>
                          <small className="text-muted" style={{ fontSize: '11px' }}>ID: {member.member_id || member.memberId}</small>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-capitalize fw-semibold text-muted" style={{ fontSize: '13px' }}>
                      {(member.fitness_goal || activeTab).replace('_', ' ')}
                    </td>
                    <td className="py-3 text-muted" style={{ fontSize: '13px' }}>
                      {member.month_label || member.monthLabel || selectedMonthLabel}
                    </td>
                    <td className="py-3 text-muted" style={{ fontSize: '13px' }}>
                      {member.age || '-'} / <span className="text-capitalize">{member.gender || '-'}</span>
                    </td>
                    <td className="py-3 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                      {member.start_weight ? `${member.start_weight} kg` : '-'}
                    </td>
                    <td className="py-3 fw-semibold text-dark" style={{ fontSize: '13px' }}>
                      {member.current_weight ? `${member.current_weight} kg` : '-'}
                    </td>
                    <td className={`py-3 fw-bold ${member.weight_change < 0 ? 'text-success' : member.weight_change > 0 ? 'text-danger' : 'text-muted'}`} style={{ fontSize: '13px' }}>
                      {member.weight_change_str || '-'}
                    </td>
                    <td className="py-3 text-muted" style={{ fontSize: '13px' }}>
                      <span className="text-secondary">{member.baseline_bf_percent}%</span> → <span className="fw-bold text-dark">{member.current_bf_percent}%</span>
                    </td>
                    <td className="py-3 text-muted" style={{ fontSize: '13px' }}>
                      <span className="text-secondary">{member.baseline_lbm} kg</span> → <span className="fw-bold text-dark">{member.current_lbm} kg</span>
                    </td>
                    <td className="py-3 text-success fw-bold" style={{ fontSize: '13px' }}>
                      {member.member_gain || '-'}
                    </td>
                    <td className="py-3 text-primary fw-bold" style={{ fontSize: '13px' }}>
                      {member.member_loss || '-'}
                    </td>
                    <td className="py-3 text-center">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill" style={{ fontSize: '12px' }}>
                        {member.overall_improvement || `${member.score}%`}
                      </span>
                    </td>
                    <td className="py-3 text-center px-3">
                      {isRankUp ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                          {rankChangeStr}
                        </span>
                      ) : isRankDown ? (
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                          {rankChangeStr}
                        </span>
                      ) : rankChangeStr === '—' ? (
                        <span className="badge bg-light text-secondary border px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                          —
                        </span>
                      ) : (
                        <span className="badge bg-info bg-opacity-10 text-info border border-info px-2 py-1 rounded-pill" style={{ fontSize: '11px' }}>
                          NEW
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'fat_loss', icon: faFire, label: 'Fat Loss' },
    { key: 'muscle_gain', icon: faDumbbell, label: 'Muscle Gain' },
    { key: 'maintenance', icon: faBalanceScale, label: 'Maintenance' },
  ];

  return (
    <div className="leaderboard-wrapper pb-5" style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-4 mt-2">
        <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-pill px-3 py-1 mb-2 border shadow-sm">
          <FontAwesomeIcon icon={faDumbbell} className="text-primary me-2" style={{ fontSize: '12px' }} />
          {isSuperAdmin ? (
            <select 
              className="form-select form-select-sm border-0 bg-transparent fw-bold text-dark py-0" 
              style={{ fontSize: '13px', letterSpacing: '0.5px', boxShadow: 'none', cursor: 'pointer', outline: 'none', paddingRight: '30px' }}
              value={selectedBranchId}
              onChange={(e) => {
                const branch = branches.find(b => b.id === parseInt(e.target.value));
                if (branch) {
                  setSelectedBranchId(branch.id);
                  setSelectedBranchName(branch.name);
                } else {
                  setSelectedBranchId(parseInt(e.target.value));
                }
              }}
            >
              {branches.length > 0 ? (
                branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))
              ) : (
                <option value={selectedBranchId}>{selectedBranchName}</option>
              )}
            </select>
          ) : (
            <span className="text-dark fw-bold pe-2" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>{selectedBranchName}</span>
          )}
        </div>

        <h2 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', color: '#2f6a87' }}>
          <FontAwesomeIcon icon={faMedal} className="me-2 text-warning" /> 
          Fitness Leaderboard
        </h2>
        <p className="text-muted mb-0" style={{ fontSize: 'clamp(13px, 3vw, 15px)' }}>
          Compete with members who share the same fitness goal and track your progress.
        </p>
      </div>

      {/* Goal Tabs / Filter */}
      <div
        className="bg-white p-1 rounded-4 shadow-sm mb-4 d-flex justify-content-center"
        style={{ gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn border-0 rounded-pill fw-bold flex-shrink-0 ${activeTab !== tab.key ? 'text-muted bg-transparent' : 'shadow-sm'}`}
            style={{ 
              padding: '8px 22px', 
              fontSize: '14px', 
              transition: 'all 0.3s',
              backgroundColor: activeTab === tab.key ? '#2f6a87' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : '#64748b'
            }}
          >
            <FontAwesomeIcon icon={tab.icon} className="me-2" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Controls Bar: Month Selector & Export Excel */}
      <div className="bg-white p-3 rounded-4 shadow-sm mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <FontAwesomeIcon icon={faCalendarAlt} className="text-primary fs-5 me-1" />
          <span className="fw-semibold text-dark" style={{ fontSize: '14px' }}>Leaderboard Month:</span>
          
          <div className="d-flex align-items-center gap-2">
            <input
              type="month"
              className="form-control form-control-sm border shadow-none rounded-pill fw-bold text-dark px-3 py-2 bg-light"
              style={{ minWidth: '165px', cursor: 'pointer' }}
              value={selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Click to select month from calendar"
            />
            {availableMonths.length > 0 && (
              <select
                className="form-select form-select-sm border shadow-none rounded-pill fw-semibold text-muted px-3 py-2 bg-light"
                style={{ width: 'auto', cursor: 'pointer', fontSize: '13px' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                title="Or choose from months with data"
              >
                <option value="">-- Months with Data --</option>
                {availableMonths.map(m => (
                  <option key={m.monthKey || m.key} value={m.monthKey || m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button
          className="btn btn-success rounded-pill px-4 py-2 fw-semibold shadow-sm text-nowrap"
          onClick={handleExportExcel}
          disabled={leaderboardData.length === 0}
        >
          <FontAwesomeIcon icon={faFileExcel} className="me-2" /> Export Excel
        </button>
      </div>

      {/* Main Content Area */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-3 p-md-4 bg-white">
          {loading ? (
            <div className="text-center my-5 py-4">
              <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}></div>
              <div className="mt-3 text-muted fw-semibold">Loading Leaderboard...</div>
            </div>
          ) : error ? (
            <div className="text-center py-5 my-2">
              <div className="text-danger mb-3" style={{ fontSize: '2.5rem' }}>⚠️</div>
              <h5 className="fw-bold text-dark mb-2">Unable to Load Leaderboard</h5>
              <p className="text-muted mb-3">{error}</p>
              <button className="btn btn-outline-primary rounded-pill px-4 py-2 fw-semibold" onClick={fetchLeaderboard}>
                <FontAwesomeIcon icon={faRedo} className="me-2" /> Retry
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center text-muted py-5 my-3">
              <FontAwesomeIcon icon={faTrophy} className="mb-3 text-secondary" style={{ fontSize: '3.5rem', opacity: 0.25 }} />
              <h5 className="fw-bold text-dark mb-2">
                No leaderboard data available for {selectedMonthLabel || 'this month'}.
              </h5>
              <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                Complete assessments to earn your rank on the {activeTab.replace('_', ' ')} leaderboard.
              </p>
            </div>
          ) : (
            <>
              {renderPodium()}
              {renderDetailedTable()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberLeaderboard;
