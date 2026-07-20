import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import BaseUrl from '../../Api/BaseUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faFire, faDumbbell, faBalanceScale, faTrophy, faRedo, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import './MemberLeaderboard.css';

const MemberLeaderboard = () => {
  const [activeTab, setActiveTab] = useState('fat_loss');
  const [leaderboardData, setLeaderboardData] = useState([]);
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
  }, [activeTab, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await axiosInstance.get('v1/branches');
      let branchesData = Array.isArray(res.data) ? res.data : res.data?.branches || res.data?.branch ? (Array.isArray(res.data.branches) ? res.data.branches : [res.data.branch]) : [];
      setBranches(branchesData);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try both v1/leaderboard and leaderboard API endpoints
      let response;
      try {
        response = await axiosInstance.get(`v1/leaderboard?branchId=${selectedBranchId}&goal=${activeTab}`);
      } catch (err1) {
        response = await axiosInstance.get(`leaderboard?branchId=${selectedBranchId}&goal=${activeTab}`);
      }

      if (response && response.data) {
        const list = response.data.leaderboard || response.data.data || [];
        setLeaderboardData(Array.isArray(list) ? list : []);
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

  const renderPodium = () => {
    const top3 = leaderboardData.slice(0, 3);
    if (top3.length === 0) return null;

    // Podium visual ordering: 2nd (left), 1st (center), 3rd (right)
    const order = top3.length === 1 ? [0] : top3.length === 2 ? [1, 0] : [1, 0, 2];
    const podiumHeights = { 0: '110px', 1: '80px', 2: '60px' };

    return (
      <div className="podium-container d-flex justify-content-center align-items-end mt-2 mb-4" style={{ gap: '8px' }}>
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

  const renderList = () => {
    const others = leaderboardData.slice(3);
    if (others.length === 0 && leaderboardData.length > 0 && leaderboardData.length <= 3) return null;

    const listToRender = leaderboardData.length <= 3 ? [] : others;

    return (
      <div className="leaderboard-list mt-3">
        {listToRender.length > 0 && (
          <h6 className="mb-3 text-secondary border-bottom pb-2 fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" /> Qualified Members
          </h6>
        )}
        <div className="list-group shadow-sm rounded-3 overflow-hidden">
          {listToRender.map((member) => {
            const isMe = isCurrentUser(member);
            return (
              <div 
                key={member.member_id || member.memberId || member.rank} 
                className={`list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3 px-3 transition-all ${isMe ? 'bg-primary bg-opacity-10 border-start border-4 border-primary' : 'hover-bg-light'}`}
              >
                <div className="d-flex align-items-center overflow-hidden me-2">
                  <div className={`rank-circle fw-bold me-3 d-flex justify-content-center align-items-center rounded-circle flex-shrink-0 ${isMe ? 'bg-primary text-white' : 'bg-light text-secondary'}`} style={{ width: '34px', height: '34px', fontSize: '13px' }}>
                    {member.rank}
                  </div>
                  <img 
                    src={getAvatarUrl(member)} 
                    alt={member.fullName || member.member_name} 
                    className="rounded-circle me-3 list-avatar border border-2 border-light flex-shrink-0" 
                    width="40" height="40"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className="text-truncate">
                    <span className="fw-bold text-dark me-2">{member.fullName || member.member_name}</span>
                    {isMe && (
                      <span className="badge bg-primary text-white rounded-pill px-2 py-1" style={{ fontSize: '10px' }}>
                        <FontAwesomeIcon icon={faUserCheck} className="me-1" /> You
                      </span>
                    )}
                  </div>
                </div>

                <div className="score-badge text-primary fw-bold bg-primary bg-opacity-10 px-3 py-1 rounded-pill flex-shrink-0 ms-2" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                  {getMetricLabel(member.score)}
                </div>
              </div>
            );
          })}
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
    <div className="leaderboard-wrapper pb-5" style={{ maxWidth: '750px', margin: '0 auto' }}>
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
              padding: '8px 18px', 
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
              <h5 className="fw-bold text-dark mb-2">No members have qualified for this leaderboard yet.</h5>
              <p className="mb-0 text-muted" style={{ fontSize: '14px' }}>
                Complete assessments to earn your rank on the {activeTab.replace('_', ' ')} leaderboard.
              </p>
            </div>
          ) : (
            <>
              {renderPodium()}
              {renderList()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberLeaderboard;
