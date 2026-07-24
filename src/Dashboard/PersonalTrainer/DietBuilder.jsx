import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FaPlus, FaTrash, FaEdit, FaUserPlus, FaSave, FaTimes } from 'react-icons/fa';
import { getCurrentStaffId } from '../../utils/staffUtils';

const DietBuilder = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for Create/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', notes: '', dietType: 'Any', meals: [] });

  // Assign state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const branchId = user?.branchId || 0;
  const adminId = user?.adminId || user?.id || 0;

  useEffect(() => {
    fetchPlans();
    fetchMembers();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axiosInstance.get(`/diet/all?branchId=${branchId}`);
      if (res.data.success) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error("Error fetching diet plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      let endpoint = `/members/admin/${adminId}`;
      if (Number(user.roleId) === 5 || user.roleName === 'PERSONAL TRAINER') {
        const staffId = getCurrentStaffId(user);
        endpoint = `/members/trainer/${staffId}`;
      }
      const res = await axiosInstance.get(endpoint);
      if (res.data.success) {
        setMembers(res.data.data || res.data.items || res.data.members || []);
      }
    } catch (err) {
      // Fallback to branch route
      try {
        const res2 = await axiosInstance.get(`/members/branch/${branchId}`);
        if (res2.data.success) {
          setMembers(res2.data.items || res2.data.data || res2.data.members || []);
        }
      } catch (err2) {
        console.error("Error fetching members:", err2);
      }
    }
  };

  const handleAddMeal = () => {
    setFormData({
      ...formData,
      meals: [...formData.meals, { time: '', food: '' }]
    });
  };

  const handleMealChange = (index, field, value) => {
    const newMeals = [...formData.meals];
    newMeals[index][field] = value;
    setFormData({ ...formData, meals: newMeals });
  };

  const handleRemoveMeal = (index) => {
    const newMeals = [...formData.meals];
    newMeals.splice(index, 1);
    setFormData({ ...formData, meals: newMeals });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, branchId, createdBy: user.id };
      
      if (editingId) {
        await axiosInstance.put(`/diet/update/${editingId}`, payload);
        alert('Diet plan updated successfully!');
      } else {
        await axiosInstance.post('/diet/create', payload);
        alert('Diet plan created successfully!');
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ title: '', notes: '', dietType: 'Any', meals: [] });
      fetchPlans();
    } catch (err) {
      console.error(err);
      alert('Error saving diet plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setFormData({
      title: plan.title,
      notes: plan.notes || '',
      dietType: plan.dietType || 'Any',
      meals: plan.meals.map(m => ({ time: m.time, food: m.food }))
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this diet plan?")) {
      try {
        await axiosInstance.delete(`/diet/delete/${id}`);
        fetchPlans();
        alert('Deleted successfully');
      } catch (err) {
        console.error(err);
        alert('Error deleting plan');
      }
    }
  };

  const openAssignModal = (planId) => {
    setSelectedPlanId(planId);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedMember) return alert("Select a member first");
    try {
      await axiosInstance.post('/diet/assign', {
        memberId: selectedMember,
        dietPlanId: selectedPlanId
      });
      alert('Assigned successfully!');
      setShowAssignModal(false);
      setSelectedMember('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error assigning plan');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading Diet Builder...</div>;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>🥗 Dynamic Diet Builder</h3>
        {!showForm && (
          <button 
            className="btn text-white fw-bold shadow-sm px-4 py-2"
            style={{ backgroundColor: "#2f6a87", borderRadius: "8px", width: "auto" }}
            onClick={() => {
              setEditingId(null);
              setFormData({ title: '', notes: '', dietType: 'Any', meals: [] });
              setShowForm(true);
            }}
          >
            <FaPlus className="me-2" /> Create New Plan
          </button>
        )}
      </div>

      {showForm ? (
        <div className="card shadow-sm border-0" style={{ borderRadius: "12px" }}>
          <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-dark">{editingId ? 'Edit Diet Plan' : 'Create New Diet Plan'}</h5>
            <button className="btn btn-light rounded-circle" onClick={() => setShowForm(false)}>
              <FaTimes />
            </button>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row mb-4">
                <div className="col-md-5">
                  <label className="form-label fw-bold">Plan Title</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    placeholder="e.g. Extreme Weight Loss" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    required 
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Notes (Optional)</label>
                  <input 
                    type="text" 
                    className="form-control form-control-lg" 
                    placeholder="e.g. Drink 3L water daily" 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold d-block mb-1">Diet Type</label>
                  <div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" type="radio" name="dietType" id="dietAny" value="Any" checked={formData.dietType === 'Any'} onChange={e => setFormData({...formData, dietType: e.target.value})} />
                      <label className="form-check-label text-secondary" htmlFor="dietAny">Any</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" style={{ borderColor: '#198754' }} type="radio" name="dietType" id="dietVeg" value="Veg" checked={formData.dietType === 'Veg'} onChange={e => setFormData({...formData, dietType: e.target.value})} />
                      <label className="form-check-label text-success fw-bold" htmlFor="dietVeg">🟢 Veg</label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input className="form-check-input" style={{ borderColor: '#dc3545' }} type="radio" name="dietType" id="dietNonVeg" value="Non-Veg" checked={formData.dietType === 'Non-Veg'} onChange={e => setFormData({...formData, dietType: e.target.value})} />
                      <label className="form-check-label text-danger fw-bold" htmlFor="dietNonVeg">🔴 Non-Veg</label>
                    </div>
                  </div>
                </div>
              </div>

              <h5 className="fw-bold mb-3 border-bottom pb-2">Meals Schedule</h5>
              
              {formData.meals.map((meal, index) => (
                <div key={index} className="row g-3 align-items-center mb-3 bg-light p-3 rounded shadow-sm">
                  <div className="col-md-3">
                    <label className="form-label fw-bold text-muted small">Meal Time</label>
                    <select 
                      className="form-select" 
                      value={meal.time}
                      onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                      required
                    >
                      <option value="">-- Select Time --</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Mid-Morning Snack">Mid-Morning Snack</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Pre-Workout">Pre-Workout</option>
                      <option value="Post-Workout">Post-Workout</option>
                      <option value="Evening Snack">Evening Snack</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Before Bed">Before Bed</option>
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-bold text-muted small">Food Items</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 2 Boiled Eggs, 1 Apple" 
                      value={meal.food}
                      onChange={(e) => handleMealChange(index, 'food', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-1 d-flex align-items-end justify-content-center">
                    <button type="button" className="btn btn-outline-danger w-100 mt-4" onClick={() => handleRemoveMeal(index)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" className="btn btn-light border fw-bold w-100 py-2 mb-4" onClick={handleAddMeal}>
                <FaPlus className="me-2 text-primary" /> Add Another Meal
              </button>

              <div className="d-flex justify-content-end gap-3">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn text-white px-5 fw-bold" style={{ backgroundColor: "#2f6a87" }}>
                  <FaSave className="me-2" /> Save Diet Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {plans.map(plan => (
            <div key={plan.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 hover-shadow" style={{ borderRadius: "12px", transition: "0.3s", borderLeft: plan.dietType === 'Veg' ? '5px solid #198754' : plan.dietType === 'Non-Veg' ? '5px solid #dc3545' : 'none' }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-0">{plan.title}</h5>
                    <span className="badge bg-light text-dark border">{plan.meals.length} Meals</span>
                  </div>
                  
                  <div className="mb-3">
                    {plan.dietType === 'Veg' && <span className="badge bg-success-subtle text-success border border-success me-2">🟢 Vegetarian</span>}
                    {plan.dietType === 'Non-Veg' && <span className="badge bg-danger-subtle text-danger border border-danger me-2">🔴 Non-Vegetarian</span>}
                    {(!plan.dietType || plan.dietType === 'Any') && <span className="badge bg-secondary-subtle text-secondary border border-secondary me-2">⚪ Any Diet</span>}
                  </div>

                  {plan.notes && <p className="text-muted small mb-3">"{plan.notes}"</p>}
                  
                  <div className="bg-light p-3 rounded mb-4" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {plan.meals.map((m, idx) => (
                      <div key={idx} className="d-flex flex-column flex-sm-row justify-content-between border-bottom py-2 small">
                        <span className="fw-bold text-primary mb-1 mb-sm-0">{m.time}</span>
                        <span className="text-start text-sm-end text-muted">{m.food}</span>
                      </div>
                    ))}
                    {plan.meals.length === 0 && <div className="text-center text-muted small py-2">No meals added</div>}
                  </div>
                  
                  <div className="d-flex flex-wrap gap-2 mt-auto">
                    <button className="btn btn-sm btn-outline-primary flex-grow-1 py-2" onClick={() => handleEdit(plan)}>
                      <FaEdit className="me-1" /> Edit
                    </button>
                    <button className="btn btn-sm btn-outline-danger flex-grow-1 py-2" onClick={() => handleDelete(plan.id)}>
                      <FaTrash className="me-1" /> Delete
                    </button>
                    <button className="btn btn-sm text-white w-100 py-2 mt-1 fw-bold" style={{ backgroundColor: "#2f6a87" }} onClick={() => openAssignModal(plan.id)}>
                      <FaUserPlus className="me-1" /> Assign to Member
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-12 text-center py-5">
              <h5 className="text-muted">No Diet Plans created yet.</h5>
              <button className="btn text-white mt-3" style={{ backgroundColor: "#2f6a87" }} onClick={() => setShowForm(true)}>Create the first one</button>
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold">Assign Diet Plan</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <div className="modal-body">
                <label className="form-label fw-bold">Select Member</label>
                <select className="form-select form-select-lg mb-4" value={selectedMember} onChange={e => setSelectedMember(e.target.value)}>
                  <option value="">-- Choose Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.phone})</option>
                  ))}
                </select>
                <button className="btn text-white w-100 py-2 fw-bold" style={{ backgroundColor: "#2f6a87" }} onClick={handleAssign}>
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietBuilder;
