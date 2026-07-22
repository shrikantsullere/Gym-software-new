import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrashAlt, FaUserPlus, FaTimes } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import GetAdminId from '../../Api/GetAdminId';
import axiosInstance from '../../Api/axiosInstance';
import CustomTimePicker from '../../Components/CustomTimePicker';

const ClassesSchedule = () => {
  const adminId = GetAdminId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedClass, setSelectedClass] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [classes, setClasses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [members, setMembers] = useState([]); // For member dropdown
  const [trainers, setTrainers] = useState([]); // For trainers from API

  useEffect(() => {
    if (!adminId) {
      setError('Admin ID not found. Please log in.');
      return;
    }
    fetchAllData();
  }, [adminId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch branches
      const branchesRes = await axiosInstance.get(`branches/by-admin/${adminId}`);
      let branchList = [];
      console.log('Branches API response:', branchesRes.data);
      
      if (branchesRes.data.success) {
        // Handle different response structures
        if (branchesRes.data.branch) {
          branchList = Array.isArray(branchesRes.data.branch) ? branchesRes.data.branch : [branchesRes.data.branch];
        } else if (branchesRes.data.branches) {
          branchList = Array.isArray(branchesRes.data.branches) ? branchesRes.data.branches : [];
        } else if (Array.isArray(branchesRes.data)) {
          branchList = branchesRes.data;
        }
      }
      setBranches(branchList);
      console.log('Processed branches:', branchList);

      // Fetch trainers
      const trainersRes = await axiosInstance.get(`booking/unifiedbyPersonalGeneral/${adminId}`);
      let trainerList = [];
      console.log('Trainers API response:', trainersRes.data);
      
      if (trainersRes.data.success) {
        let rawTrainers = Array.isArray(trainersRes.data.trainers) ? trainersRes.data.trainers : [];
        
        // Deduplicate trainers by case-insensitive name to remove duplicates like 'Rahul' and 'rahul'
        const uniqueTrainersMap = new Map();
        rawTrainers.forEach(t => {
          if (t.name && t.name.trim() !== '') {
            const nameKey = t.name.trim().toLowerCase();
            if (!uniqueTrainersMap.has(nameKey)) {
              uniqueTrainersMap.set(nameKey, t);
            }
          }
        });
        
        trainerList = Array.from(uniqueTrainersMap.values());
      }
      setTrainers(trainerList);
      console.log('Processed trainers:', trainerList);

      // Fetch members (plans = members)
      const membersRes = await axiosInstance.get(`MemberPlan?adminId=${adminId}`);
      let memberList = [];
      console.log('Members API response:', membersRes.data);
      
      if (membersRes.data.success) {
        // Handle different response structures
        let plans = [];
        if (membersRes.data.plans) {
          plans = Array.isArray(membersRes.data.plans) ? membersRes.data.plans : [];
        } else if (membersRes.data.plan) {
          plans = Array.isArray(membersRes.data.plan) ? membersRes.data.plan : [membersRes.data.plan];
        } else if (Array.isArray(membersRes.data)) {
          plans = membersRes.data;
        }
        
        memberList = plans.map(plan => ({
          id: plan.id,
          name: plan.name || plan.fullName || `Member ${plan.id}`
        }));
      }
      setMembers(memberList);
      console.log('Processed members:', memberList);

      // Fetch classes
      const classesRes = await axiosInstance.get(`class/scheduled/all/${adminId}`);
      if (classesRes.data.success) {
        setClasses(classesRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to get role name from roleId
  const getRoleName = (roleId) => {
    switch(roleId) {
      case 5: return 'Personal Trainer';
      case 6: return 'General Trainer';
      default: return 'Trainer';
    }
  };

  // Function to add a member
  const addMember = () => {
    if (!memberSearch.trim()) return;

    // Check if already added
    if (selectedClass?.members?.some(m => m.name === memberSearch.trim())) {
      alert(`"${memberSearch}" is already in this class.`);
      return;
    }

    const newMember = {
      id: Date.now(), // Temporary ID
      name: memberSearch.trim()
    };

    setSelectedClass({
      ...selectedClass,
      members: [...(selectedClass.members || []), newMember]
    });
    setMemberSearch('');
  };

  // Function to remove a member
  const removeMember = (memberToRemove) => {
    if (!selectedClass) return;
    setSelectedClass({
      ...selectedClass,
      members: selectedClass.members.filter(m => m.id !== memberToRemove.id)
    });
  };

  const handleAddNew = () => {
    setModalType('add');
    setSelectedClass({
      className: '',
      trainerId: trainers.length > 0 ? trainers[0].trainerId : '', // Default to first trainer
      branchId: branches.length > 0 ? branches[0].id : '',
      date: '',
      day: '',
      startTime: '',
      endTime: '',
      capacity: 20,
      status: 'Active',
      members: []
    });
    setMemberSearch('');
    setIsModalOpen(true);
  };

  const handleView = (gymClass) => {
    setModalType('view');
    // Parse time string to get start and end times
    const timeString = gymClass.time || '';
    let startTime = '';
    let endTime = '';
    
    if (timeString.includes(' - ')) {
      const [start, end] = timeString.split(' - ');
      startTime = start.trim();
      endTime = end.trim();
    }
    
    // Find branch ID from name
    const branch = branches.find(b => b.name === gymClass.branch);
    
    // Find trainer ID from name
    let trainerId = '';
    if (gymClass.trainer) {
      const trainer = trainers.find(t => t.name === gymClass.trainer);
      trainerId = trainer ? trainer.trainerId : '';
    }
    
    setSelectedClass({ 
      ...gymClass, 
      members: [], // API doesn't return members, so leave empty
      trainerId,
      branchId: branch?.id || '',
      startTime,
      endTime
    });
    setMemberSearch('');
    setIsModalOpen(true);
  };

  const handleEdit = (gymClass) => {
    setModalType('edit');
    // Parse time string to get start and end times
    const timeString = gymClass.time || '';
    let startTime = '';
    let endTime = '';
    
    if (timeString.includes(' - ')) {
      const [start, end] = timeString.split(' - ');
      startTime = start.trim();
      endTime = end.trim();
    }
    
    // Find branch ID from name
    const branch = branches.find(b => b.name === gymClass.branch);
    
    // Find trainer ID from name
    let trainerId = '';
    if (gymClass.trainer) {
      const trainer = trainers.find(t => t.name === gymClass.trainer);
      trainerId = trainer ? trainer.trainerId : '';
    }
    
    setSelectedClass({ 
      ...gymClass, 
      members: [], // No member editing from list
      trainerId,
      branchId: branch?.id || '',
      startTime,
      endTime
    });
    setMemberSearch('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (gymClass) => {
    setSelectedClass(gymClass);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      // Assuming delete endpoint exists
      await axiosInstance.delete(`class/scheduled/delete/${selectedClass.id}`);
      setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
      alert(`Class "${selectedClass.className}" has been deleted.`);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete class.');
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
    setMemberSearch('');
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedClass(null);
  };

  const getStatusBadge = (status) => {
    const badgeClasses = {
      Active: "bg-success-subtle text-success-emphasis",
      Inactive: "bg-danger-subtle text-danger-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
        {status}
      </span>
    );
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || '—';
  };

  const getTrainerName = (trainerId) => {
    const trainer = trainers.find(t => t.trainerId === trainerId);
    return trainer?.name || '—';
  };

  const saveClass = async () => {
    const {
      className,
      trainerId,
      branchId,
      date,
      day,
      startTime,
      endTime,
      capacity,
      status
    } = selectedClass;

    if (!className || !trainerId || !date || !startTime || !endTime) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        adminId: Number(adminId),
        className,
        trainerId: Number(trainerId),
        branchId: branchId ? Number(branchId) : null,
        date,
        day,
        startTime,
        endTime,
        capacity: Number(capacity),
        status
      };

      console.log('Sending payload:', payload); // Debug log

      if (modalType === 'add') {
        const res = await axiosInstance.post(`class/schedule/create`, payload);
        if (res.data.success) {
          await fetchAllData();
          alert('New class added successfully!');
        } else {
          throw new Error(res.data.message || 'Failed to create class');
        }
      } else if (modalType === 'edit') {
        const res = await axiosInstance.put(`class/scheduled/update/${selectedClass.id}`, payload);
        if (res.data.success) {
          await fetchAllData();
          alert('Class updated successfully!');
        } else {
          throw new Error(res.data.message || 'Failed to update class');
        }
      }
      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      alert(err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MobileClassCard = ({ gymClass }) => (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0">{gymClass.className}</h5>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-outline-secondary" title="View" onClick={() => handleView(gymClass)}>
              <FaEye size={14} />
            </button>
            <button className="btn btn-sm" title="Edit" onClick={() => handleEdit(gymClass)} style={{ borderColor: '#6EB2CC', color: '#6EB2CC' }}>
              <FaEdit size={14} />
            </button>
            <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDeleteClick(gymClass)}>
              <FaTrashAlt size={14} />
            </button>
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <p className="mb-1"><strong>Trainer:</strong> {gymClass.trainer}</p>
            {/* <p className="mb-1"><strong>Branch:</strong> {gymClass.branch}</p> Commented out branch field */}
          </div>
          <div className="col-6">
            <p className="mb-1"><strong>Date:</strong> {gymClass.date ? gymClass.date.split('T')[0] : ''}</p>
            <p className="mb-1"><strong>Time:</strong> {gymClass.time}</p>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="me-2"><strong>Day:</strong> {gymClass.day}</span>
            <span><strong>Status:</strong> {getStatusBadge(gymClass.status)}</span>
          </div>
          <div>
            {gymClass.membersCount !== undefined && gymClass.membersCount > 0 ? (
              <span className="badge bg-light text-dark">
                {gymClass.membersCount} {gymClass.membersCount === 1 ? 'Member' : 'Members'}
              </span>
            ) : (
              <span className="text-muted">No members</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const formatTime = (timeStr) => timeStr ? timeStr.slice(0, 5) : '';

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">All Class Scheduled</h2>
          <p className="text-muted mb-0">Manage all gym classes, trainers, and member assignments.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn w-100 w-lg-auto"
            style={{
              backgroundColor: '#6EB2CC',
              color: 'white',
              borderRadius: '8px',
              padding: '10px 20px',
              fontWeight: '500'
            }}
            onClick={handleAddNew}
            disabled={loading}
          >
            <FaUserPlus className="me-2" /> Add Class
          </button>
        </div>
      </div>

      {loading && classes.length === 0 ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading classes...</p>
        </div>
      ) : (
        <>
          <div className="d-none d-md-block">
            <div className="card shadow-sm border-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>CLASS NAME</th>
                      <th>TRAINER</th>
                      {/* <th>BRANCH</th> Commented out branch field */}
                      <th>DATE</th>
                      <th>TIME</th>
                      <th>DAY</th>
                      <th>STATUS</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(c => (
                      <tr key={c.id}>
                        <td>{c.className}</td>
                        <td>{c.trainer}</td>
                        {/* <td><span className="badge bg-primary-subtle text-primary-emphasis px-3 py-1">{c.branch}</span></td> Commented out branch field */}
                        <td>{c.date ? c.date.split('T')[0] : ''}</td>
                        <td>{c.time}</td>
                        <td>{c.day}</td>
                        <td>{getStatusBadge(c.status)}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button className="btn btn-sm btn-outline-secondary" title="View" onClick={() => handleView(c)}>
                              <FaEye size={14} />
                            </button>
                            <button className="btn btn-sm" title="Edit" onClick={() => handleEdit(c)} style={{ borderColor: '#6EB2CC', color: '#6EB2CC' }}>
                              <FaEdit size={14} />
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => handleDeleteClick(c)}>
                              <FaTrashAlt size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {classes.length === 0 && (
                  <div className="text-center py-4 text-muted">No classes scheduled.</div>
                )}
              </div>
            </div>
          </div>

          <div className="d-md-none">
            {classes.length > 0 ? (
              classes.map(c => <MobileClassCard key={c.id} gymClass={c} />)
            ) : (
              <div className="text-center py-4 text-muted">No classes scheduled.</div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && selectedClass && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0" style={{ backgroundColor: '#6EB2CC', color: 'white' }}>
                <h5 className="modal-title fw-bold">
                  {modalType === 'add' ? 'Add New Class' : modalType === 'view' ? 'Class Details' : 'Edit Class'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-4">
                {/* {branches.length === 0 && (
                  <div className="alert alert-warning">
                    No branches found. Please add branches first before creating classes.
                  </div>
                )} Commented out branch field */}
                {trainers.length === 0 && (
                  <div className="alert alert-warning">
                    No trainers found. Please add trainers first before creating classes.
                  </div>
                )}
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Class Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control rounded-3"
                      value={selectedClass.className || ''}
                      readOnly={modalType === 'view'}
                      onChange={e => setSelectedClass({ ...selectedClass, className: e.target.value })}
                      placeholder="Enter class name"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Trainer <span className="text-danger">*</span></label>
                    {modalType === 'view' ? (
                      <input
                        className="form-control rounded-3"
                        value={getTrainerName(selectedClass.trainerId)}
                        readOnly
                      />
                    ) : (
                      <select
                        className="form-select rounded-3"
                        value={selectedClass.trainerId || ''}
                        onChange={e => setSelectedClass({ ...selectedClass, trainerId: e.target.value })}
                        disabled={modalType === 'view' || trainers.length === 0}
                      >
                        <option value="">Select trainer</option>
                        {trainers.map(t => (
                          <option key={t.trainerId} value={t.trainerId}>{t.name} (ID: {t.trainerId}) - {getRoleName(t.roleId)}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                {/* Commented out branch field
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Branch <span className="text-danger">*</span></label>
                    {modalType === 'view' ? (
                      <input
                        className="form-control rounded-3"
                        value={selectedClass.branch || ''}
                        readOnly
                      />
                    ) : (
                      <select
                        className="form-select rounded-3"
                        value={selectedClass.branchId || ''}
                        onChange={e => setSelectedClass({ ...selectedClass, branchId: e.target.value })}
                        disabled={modalType === 'view' || branches.length === 0}
                      >
                        <option value="">Select branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control rounded-3"
                      value={selectedClass.date ? selectedClass.date.split('T')[0] : ''}
                      onChange={e => setSelectedClass({ ...selectedClass, date: e.target.value })}
                      disabled={modalType === 'view'}
                    />
                  </div>
                </div>
                */}
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className="form-control rounded-3"
                      value={selectedClass.date ? selectedClass.date.split('T')[0] : ''}
                      onChange={e => setSelectedClass({ ...selectedClass, date: e.target.value })}
                      disabled={modalType === 'view'}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Start Time <span className="text-danger">*</span></label>
                    <CustomTimePicker
                      className="form-control rounded-3"
                      name="startTime"
                      value={formatTime(selectedClass.startTime)}
                      onChange={e => setSelectedClass({ ...selectedClass, startTime: e.target.value })}
                      disabled={modalType === 'view'}
                    />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">End Time <span className="text-danger">*</span></label>
                    <CustomTimePicker
                      className="form-control rounded-3"
                      name="endTime"
                      value={formatTime(selectedClass.endTime)}
                      onChange={e => setSelectedClass({ ...selectedClass, endTime: e.target.value })}
                      disabled={modalType === 'view'}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Day</label>
                    <select
                      className="form-select rounded-3"
                      value={selectedClass.day || ''}
                      onChange={e => setSelectedClass({ ...selectedClass, day: e.target.value })}
                      disabled={modalType === 'view'}
                    >
                      <option value="">Auto</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-semibold">Capacity</label>
                    <input
                      type="number"
                      className="form-control rounded-3"
                      value={selectedClass.capacity || 20}
                      onChange={e => setSelectedClass({ ...selectedClass, capacity: Number(e.target.value) })}
                      disabled={modalType === 'view'}
                    />
                  </div>
                  <div className={modalType === 'view' ? "col-md-6 mb-3" : "col-md-6 mb-3"}>
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select rounded-3"
                      value={selectedClass.status || 'Active'}
                      onChange={e => setSelectedClass({ ...selectedClass, status: e.target.value })}
                      disabled={modalType === 'view'}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  {modalType === 'view' && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Members Count</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={selectedClass.membersCount !== undefined ? selectedClass.membersCount : 0}
                        readOnly
                      />
                    </div>
                  )}
                </div>

                {/* Members section */}
                {/* {modalType !== 'view' && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Members
                      <span className="text-muted ms-2">Add members from plan list</span>
                    </label>
                    <div className="border rounded-3 p-3 bg-light">
                      <div className="d-flex flex-column flex-sm-row mb-3 gap-2">
                        <select
                          className="form-select rounded-3"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        >
                          <option value="">Select a member</option>
                          {members.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-primary rounded-3"
                          onClick={addMember}
                          disabled={!memberSearch}
                        >
                          Add
                        </button>
                      </div>

                      {(selectedClass?.members || []).length > 0 && (
                        <div>
                          <small className="text-muted d-block mb-2">
                            {selectedClass.members.length} member{selectedClass.members.length > 1 ? 's' : ''} in this class:
                          </small>
                          <div className="d-flex flex-wrap gap-2">
                            {(selectedClass?.members || []).map(member => (
                              <span key={member.id} className="badge bg-light text-dark px-3 py-1 d-flex align-items-center">
                                {member.name}
                                <FaTimes
                                  className="ms-2"
                                  style={{ cursor: 'pointer', fontSize: '12px' }}
                                  onClick={() => removeMember(member)}
                                />
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                {modalType !== 'view' && (
                  <div className="d-flex justify-content-end mt-4">
                    <button className="btn btn-outline-secondary me-2 px-4" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="btn px-4"
                      style={{ background: '#6EB2CC', color: 'white' }}
                      onClick={saveClass}
                      disabled={loading || trainers.length === 0} // Removed branches.length check
                    >
                      {loading ? 'Saving...' : modalType === 'add' ? 'Add Class' : 'Update Class'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedClass && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeDeleteModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0" style={{ backgroundColor: '#6EB2CC', color: 'white' }}>
                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete <strong>{selectedClass.className}</strong>.<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button className="btn btn-outline-secondary px-4" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button className="btn btn-danger px-4" onClick={confirmDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesSchedule;