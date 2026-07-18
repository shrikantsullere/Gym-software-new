import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedal, faFire, faDumbbell, faBalanceScale, faTrophy, faCrown } from '@fortawesome/free-solid-svg-icons';
import BaseUrl from '../../Api/BaseUrl';
import './MemberLeaderboard.css';

const MemberLeaderboard = () => {
  const [activeTab, setActiveTab] = useState('fat_loss');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const [selectedBranchId, setSelectedBranchId] = useState(user.branchId || 1);
  const [selectedBranchName, setSelectedBranchName] = useState(user.branchName || "Main Branch");
  const [branches, setBranches] = useState([]);

  const userRole = user.roleName || user.role || '';
  const isSuperAdmin = userRole === 'Superadmin' || userRole === 'SUPERADMIN';

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
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BaseUrl}v1/branches`, { headers: { Authorization: `Bearer ${token}` } });
      let branchesData = Array.isArray(res.data) ? res.data : res.data?.branches || res.data?.branch ? (Array.isArray(res.data.branches) ? res.data.branches : [res.data.branch]) : [];
      setBranches(branchesData);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BaseUrl}v1/leaderboard?branchId=${selectedBranchId}&goal=${activeTab}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status) {
        setLeaderboardData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPodium = () => {
    const top3 = leaderboardData.slice(0, 3);
    if (top3.length === 0) return (
      <div className="text-center text-muted py-5">
        <FontAwesomeIcon icon={faTrophy} className="mb-3" style={{ fontSize: '3rem', opacity: 0.2 }} />
        <p className="mb-1 fw-semibold">No rankings available yet.</p>
        <small>Rankings will appear as members log their progress.</small>
      </div>
    );

    // Podium visual order: 2nd, 1st, 3rd
    const order = [1, 0, 2];
    const podiumHeights = { 0: '100px', 1: '70px', 2: '55px' }; // index -> height

    return (
      <div className="podium-container d-flex justify-content-center align-items-end mt-3 mb-4" style={{ gap: '6px' }}>
        {order.map((index) => {
          const member = top3[index];
          if (!member) return <div key={`placeholder-${index}`} className="podium-placeholder" style={{ flex: 1 }} />;
          
          const isWinner = index === 0;
          return (
            <div key={member.memberId} className={`podium-step step-${index + 1} d-flex flex-column align-items-center`} style={{ flex: 1, maxWidth: '120px' }}>
              <div className="podium-avatar mb-2 position-relative">
                {isWinner && <FontAwesomeIcon icon={faMedal} className="winner-crown position-absolute text-warning" />}
                <img 
                  src={member.avatar ? `${BaseUrl.replace('/api/', '')}${member.avatar}` : "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.fullName) + "&background=2f6a87&color=fff"} 
                  alt={member.fullName} 
                  className={`rounded-circle shadow-sm ${isWinner ? 'winner-avatar border border-3 border-warning' : 'border border-2 border-secondary'}`} 
                />
              </div>
              <div className="text-center fw-bold mb-1 text-dark w-100 px-1" style={{ fontSize: 'clamp(9px, 2.5vw, 13px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.fullName}
              </div>
              <div className="text-success fw-bold bg-light px-2 rounded mb-2" style={{ fontSize: 'clamp(9px, 2.5vw, 12px)', whiteSpace: 'nowrap' }}>
                {member.score} pts
              </div>
              <div
                className={`podium-base base-${index + 1} d-flex justify-content-center align-items-center text-white fw-bold shadow rounded-top w-100`}
                style={{ minHeight: podiumHeights[index], fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}
              >
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderList = () => {
    const others = leaderboardData.slice(3);
    if (others.length === 0) return null;

    return (
      <div className="leaderboard-list mt-4">
        <h6 className="mb-3 text-secondary border-bottom pb-2 fw-bold">
          <FontAwesomeIcon icon={faTrophy} className="me-2 text-muted" /> Global Rankings
        </h6>
        <div className="list-group shadow-sm">
          {others.map((member) => (
            <div key={member.memberId} className="list-group-item d-flex justify-content-between align-items-center border-0 border-bottom py-3 list-item-custom">
              <div className="d-flex align-items-center overflow-hidden">
                <div className="rank-circle fw-bold text-secondary me-2 d-flex justify-content-center align-items-center rounded-circle bg-light flex-shrink-0" style={{width: '32px', height: '32px', fontSize: '13px'}}>
                  {member.rank}
                </div>
                <img 
                  src={member.avatar ? `${BaseUrl.replace('/api/', '')}${member.avatar}` : "https://ui-avatars.com/api/?name=" + encodeURIComponent(member.fullName) + "&background=2f6a87&color=fff"} 
                  alt={member.fullName} 
                  className="rounded-circle me-2 list-avatar border border-2 border-light flex-shrink-0" 
                  width="38" height="38"
                />
                <span className="fw-bold text-dark text-truncate">{member.fullName}</span>
              </div>
              <div className="score-badge text-success fw-bold bg-success bg-opacity-10 px-2 py-1 rounded-pill flex-shrink-0 ms-2" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                {member.score} pts
              </div>
            </div>
          ))}
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
    <div className="leaderboard-wrapper pb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-3 mt-1">
        <div className="d-inline-flex align-items-center justify-content-center bg-white rounded-pill px-3 py-1 mb-2 border shadow-sm" style={{ transition: 'all 0.3s' }}>
          <FontAwesomeIcon icon={faDumbbell} className="text-primary me-2" style={{fontSize: '12px'}} />
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
            <span className="text-dark fw-bold pe-2" style={{fontSize: '13px', letterSpacing: '0.5px'}}>{selectedBranchName}</span>
          )}
        </div>
        <h2 className="fw-bold mb-0" style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)', color: '#2f6a87' }}>
          <FontAwesomeIcon icon={faMedal} className="me-2 text-warning" /> 
          GymCatalyst Leaderboard
        </h2>
        <p className="text-muted mt-1 mb-0" style={{ fontSize: 'clamp(12px, 3vw, 15px)' }}>
          Push your limits, track your progress, dominate the rankings.
        </p>
      </div>

      {/* Premium Segmented Tabs - scrollable on mobile */}
      <div
        className="bg-white p-1 rounded-4 shadow-sm mb-4 d-flex justify-content-center"
        style={{ gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`btn border-0 rounded-pill fw-semibold flex-shrink-0 ${activeTab !== tab.key ? 'text-muted bg-transparent' : 'shadow-sm'}`}
            style={{ 
              padding: 'clamp(6px, 2vw, 10px) clamp(10px, 3vw, 20px)', 
              fontSize: 'clamp(11px, 2.5vw, 14px)', 
              transition: 'all 0.3s',
              backgroundColor: activeTab === tab.key ? '#2f6a87' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : ''
            }}
          >
            <FontAwesomeIcon icon={tab.icon} className="me-1" /> {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content Card */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-body p-3 p-md-4 bg-white">
          {loading ? (
            <div className="text-center my-5 py-3">
              <div className="spinner-border text-primary" role="status" style={{width: '2.5rem', height: '2.5rem'}}></div>
              <div className="mt-3 text-muted fw-bold">Crunching numbers...</div>
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
