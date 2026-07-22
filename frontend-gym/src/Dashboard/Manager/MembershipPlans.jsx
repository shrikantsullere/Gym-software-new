import React, { useState } from 'react';
import { 
  Search, Plus, Eye, Pencil, Trash, Download, 
  Person, Calendar, CurrencyDollar, X, Check 
} from 'react-bootstrap-icons';

const MembershipPlans = () => {
  const [activeView, setActiveView] = useState('list');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Basic Plan",
      duration: "1 Month",
      price: "$29.99",
      description: "Access to basic gym equipment",
      status: "Active",
      members: 15
    },
    {
      id: 2,
      name: "Premium Plan",
      duration: "3 Months",
      price: "$79.99",
      description: "Access to all gym facilities including pool and sauna",
      status: "Active",
      members: 24
    },
    {
      id: 3,
      name: "Gold Plan",
      duration: "12 Months",
      price: "$299.99",
      description: "All premium features + personal trainer sessions",
      status: "Inactive",
      members: 8
    }
  ]);

  const [planForm, setPlanForm] = useState({
    name: '',
    duration: '1',
    price: '',
    description: '',
    status: 'Active'
  });

  const [assignForm, setAssignForm] = useState({
    member: '',
    plan: '',
    startDate: '',
    endDate: '',
    paymentMethod: 'Cash',
    amountPaid: ''
  });

  // Handle view changes
  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setActiveView('view');
    setPlanForm(plan);
  };

  const handleEditPlan = () => {
    setActiveView('edit');
  };

  const handleDeleteClick = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setPlans(plans.filter(p => p.id !== selectedPlan.id));
    setShowDeleteModal(false);
    setActiveView('list');
  };

  const handleAssignClick = () => {
    setShowAssignModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPlanForm({ ...planForm, [name]: value });
  };

  const handleAssignFormChange = (e) => {
    const { name, value } = e.target;
    setAssignForm({ ...assignForm, [name]: value });
    
    // Auto-calculate end date if start date and plan are selected
    if (name === 'startDate' && assignForm.plan) {
      const selectedPlan = plans.find(p => p.id.toString() === assignForm.plan);
      if (selectedPlan) {
        const durationMonths = parseInt(selectedPlan.duration);
        const startDate = new Date(value);
        const endDate = new Date(startDate.setMonth(startDate.getMonth() + durationMonths));
        setAssignForm({...assignForm, startDate: value, endDate: endDate.toISOString().split('T')[0]});
      }
    }
  };

  const handleSavePlan = (e) => {
    e.preventDefault();
    if (activeView === 'edit') {
      // Update existing plan
      setPlans(plans.map(p => p.id === selectedPlan.id ? {...planForm, id: selectedPlan.id} : p));
    } else {
      // Add new plan
      const newPlan = {...planForm, id: Math.max(...plans.map(p => p.id)) + 1, members: 0};
      setPlans([...plans, newPlan]);
    }
    setActiveView('list');
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the assignment to your backend
    console.log("Assigning plan:", assignForm);
    setShowAssignModal(false);
    setAssignForm({
      member: '',
      plan: '',
      startDate: '',
      endDate: '',
      paymentMethod: 'Cash',
      amountPaid: ''
    });
  };

  // Filter plans based on search and filter criteria
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && plan.status === 'Active') || 
                         (filter === 'inactive' && plan.status === 'Inactive');
    return matchesSearch && matchesFilter;
  });

  // Render the appropriate view
  const renderView = () => {
    switch(activeView) {
      case 'view':
      case 'edit':
        return renderPlanForm();
      default:
        return renderPlanList();
    }
  };

  // Render the plan list view
  const renderPlanList = () => {
    return (
      <div className="plan-list">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Membership Plans</h2>
          <div>
            <button className=" btn btn-light me-2" style={{ backgroundColor: '#2f6a87', color: '#fff' }} onClick={() => setActiveView('edit')}>
              <Plus size={18} className="me-1" /> Add New Plan
            </button>
            <button className="btn btn-outline-secondary">
              <Download size={18} className="me-1" /> Export
            </button>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by plan name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Plan Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Description</th>
                <th>Status</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map(plan => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.duration}</td>
                  <td>{plan.price}</td>
                  <td>{plan.description}</td>
                  <td>
                    <span className={`badge ${plan.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                      {plan.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setActiveView('members');
                      }}
                    >
                      {plan.members} Members
                    </button>
                  </td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-sm btn-outline-info"
                        onClick={() => handleViewPlan(plan)}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setActiveView('edit');
                          setPlanForm(plan);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteClick(plan)}
                      >
                        <Trash size={16} />
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-success"
                        onClick={handleAssignClick}
                      >
                        <Person size={16} /> Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render the plan form (view/edit)
  const renderPlanForm = () => {
    return (
      <div className="plan-form">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>{activeView === 'edit' ? 'Edit Plan' : 'Plan Details'}</h2>
          <button 
            className="btn btn-outline-secondary"
            onClick={() => setActiveView('list')}
          >
            Back to List
          </button>
        </div>

        <form onSubmit={handleSavePlan}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Plan Name</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={planForm.name}
                onChange={handleFormChange}
                required
                disabled={activeView === 'view'}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Duration</label>
              <select
                className="form-select"
                name="duration"
                value={planForm.duration}
                onChange={handleFormChange}
                disabled={activeView === 'view'}
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Price</label>
              <input
                type="number"
                className="form-control"
                name="price"
                value={planForm.price}
                onChange={handleFormChange}
                required
                disabled={activeView === 'view'}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              rows="3"
              value={planForm.description}
              onChange={handleFormChange}
              disabled={activeView === 'view'}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="form-label">Status</label>
            <div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="status"
                  checked={planForm.status === 'Active'}
                  onChange={(e) => setPlanForm({...planForm, status: e.target.checked ? 'Active' : 'Inactive'})}
                  disabled={activeView === 'view'}
                />
                <label className="form-check-label">
                  {planForm.status === 'Active' ? 'Active' : 'Inactive'}
                </label>
              </div>
            </div>
          </div>

          {activeView === 'edit' && (
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-outline-light" style={{ backgroundColor: '#2f6a87', color: '#fff' }} >Save Changes</button>
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => setActiveView('list')}
              >
                Cancel
              </button>
            </div>
          )}

          {activeView === 'view' && (
            <div>
              <button 
                type="button" 
                className="btn btn-warning me-2"
                onClick={handleEditPlan}
              >
                <Pencil size={16} className="me-1" /> Edit Plan
              </button>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={handleAssignClick}
              >
                <Person size={16} className="me-1" /> Assign to Member
              </button>
            </div>
          )}
        </form>
      </div>
    );
  };

  // Render assign plan modal
  const renderAssignModal = () => {
    if (!showAssignModal) return null;

    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Assign Plan to Member</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowAssignModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAssignSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Select Member</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Person size={18} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by Name, ID, or Phone"
                        value={assignForm.member}
                        onChange={(e) => setAssignForm({...assignForm, member: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Select Plan</label>
                    <select
                      className="form-select"
                      name="plan"
                      value={assignForm.plan}
                      onChange={handleAssignFormChange}
                      required
                    >
                      <option value="">Choose a plan</option>
                      {plans.filter(p => p.status === 'Active').map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.duration}) - {plan.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Start Date</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <Calendar size={18} />
                      </span>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={assignForm.startDate}
                        onChange={handleAssignFormChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="endDate"
                      value={assignForm.endDate}
                      onChange={handleAssignFormChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <h6>Payment Details</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        name="paymentMethod"
                        value={assignForm.paymentMethod}
                        onChange={handleAssignFormChange}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Amount Paid</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <CurrencyDollar size={18} />
                        </span>
                        <input
                          type="number"
                          className="form-control"
                          name="amountPaid"
                          value={assignForm.amountPaid}
                          onChange={handleAssignFormChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Assign Plan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render delete confirmation modal
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Deletion</h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>Deleting this plan will affect members who are assigned to it. Are you sure?</p>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      {renderView()}
      {renderAssignModal()}
      {renderDeleteModal()}
      
      {(showAssignModal || showDeleteModal) && (
        <div className="modal-backdrop show"></div>
      )}
    </div>
  );
};

export default MembershipPlans;
