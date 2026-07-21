import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxes, faTools, faExclamationTriangle, faPlus, faSearch, faFilter, faEdit, faTrash, faEye, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import BaseUrl from '../../../Api/BaseUrl';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, lowStockCount: 0, maintenanceCount: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: 'Cardio', quantity: 1, condition: 'Good',
    purchaseDate: '', purchaseCost: '', location: '', notes: '', nextMaintenanceDate: ''
  });
  const [equipmentImage, setEquipmentImage] = useState(null);
  const [equipmentImagePreview, setEquipmentImagePreview] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editEquipmentImage, setEditEquipmentImage] = useState(null);
  const [editEquipmentImagePreview, setEditEquipmentImagePreview] = useState(null);

  const [requestData, setRequestData] = useState({
    itemName: '', category: 'Other', quantity: 1, reason: ''
  });
  const [requestImage, setRequestImage] = useState(null);
  const [requestImagePreview, setRequestImagePreview] = useState(null);

  const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' or 'requests'
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = (localStorage.getItem('userRole') || user.role || '').toUpperCase();
  // adminId for Admin/Manager/SalesAgent; branchId for trainers/receptionist
  const adminId = user.adminId || user.id;
  const branchId = user.branchId || user.branch?.id || null;
  const token = localStorage.getItem('authToken');
  
  const isAdminOrManager = ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(userRole);
  // Use admin-level routes for roles without a fixed branchId
  const useAdminRoutes = isAdminOrManager || ['SALES_AGENT', 'PERSONALTRAINER', 'GENERALTRAINER'].includes(userRole);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    setLoading(true);

    // Fetch equipment list
    try {
      let equipRes;
      if (useAdminRoutes) {
        // Admin/Manager/SalesAgent: get all equipment across their branches
        const searchQ = searchTerm ? `?search=${searchTerm}` : '?';
        const catQ = filterCategory !== 'All' ? `&category=${filterCategory}` : '';
        equipRes = await axios.get(`${BaseUrl}v1/equipment/admin/${adminId}/list${searchQ}${catQ}`, axiosConfig);
      } else {
        // Staff with a specific branchId (trainers, receptionist)
        const effectiveBranch = branchId || 1;
        equipRes = await axios.get(`${BaseUrl}v1/equipment/branch/${effectiveBranch}?search=${searchTerm}&category=${filterCategory === 'All' ? '' : filterCategory}`, axiosConfig);
      }
      setInventory(equipRes.data.equipment || []);
    } catch (err) {
      console.error("Error fetching equipment list:", err.response?.data || err.message);
    }

    // Fetch stats
    try {
      let statsRes;
      if (useAdminRoutes) {
        statsRes = await axios.get(`${BaseUrl}v1/equipment/admin/${adminId}/stats`, axiosConfig);
      } else {
        const effectiveBranch = branchId || 1;
        statsRes = await axios.get(`${BaseUrl}v1/equipment/stats/${effectiveBranch}`, axiosConfig);
      }
      if (statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error("Error fetching equipment stats:", err.response?.data || err.message);
    }

    // Fetch requests
    fetchRequests();

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [adminId, branchId, searchTerm, filterCategory]);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      if (isAdminOrManager) {
        const reqRes = await axios.get(`${BaseUrl}v1/equipment/requests/admin/${user.id}`, axiosConfig);
        setRequests(reqRes.data.requests || []);
      } else {
        const reqRes = await axios.get(`${BaseUrl}v1/equipment/requests/member/${user.id}`, axiosConfig);
        setRequests(reqRes.data.requests || []);
      }
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      // Use formData.branchId if set (for multi-branch admin), or user's branchId
      const targetBranch = formData.branchId || branchId || (user.branchId) || 1;
      Object.entries({ ...formData, branchId: targetBranch }).forEach(([k, v]) => fd.append(k, v));
      if (equipmentImage) fd.append('image', equipmentImage);
      await axios.post(`${BaseUrl}v1/equipment/create`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setShowAddModal(false);
      setFormData({ name: '', category: 'Cardio', quantity: 1, condition: 'Good', purchaseDate: '', purchaseCost: '', location: '', notes: '', nextMaintenanceDate: '' });
      setEquipmentImage(null);
      setEquipmentImagePreview(null);
      fetchData();
    } catch (err) {
      console.error("Equipment add error:", err.response?.data || err);
      alert("Error adding item: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditClick = (item) => {
    setEditFormData({
      name: item.name || '',
      category: item.category || 'Cardio',
      quantity: item.quantity || 1,
      condition: item.condition || 'Good',
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
      purchaseCost: item.purchaseCost || '',
      location: item.location || '',
      notes: item.notes || '',
      nextMaintenanceDate: item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0] : ''
    });
    setEditEquipmentImage(null);
    setEditEquipmentImagePreview(item.imageUrl || null);
    setSelectedEquipment(item);
    setShowEditModal(true);
  };

  const handleViewClick = (item) => {
    setSelectedEquipment(item);
    setShowViewModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(editFormData).forEach(([k, v]) => fd.append(k, v));
      if (editEquipmentImage) fd.append('image', editEquipmentImage);
      await axios.put(`${BaseUrl}v1/equipment/update/${selectedEquipment.id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setShowEditModal(false);
      setEditEquipmentImage(null);
      fetchData();
      alert("Equipment updated successfully");
    } catch (err) {
      console.error("Equipment update error:", err.response?.data || err);
      alert("Error updating item");
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries({ ...requestData, branchId, requestedBy: user.id, role: user.roleName || user.role || 'ADMIN', adminId: user.adminId || user.id }).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (requestImage) fd.append('image', requestImage);
      await axios.post(`${BaseUrl}v1/equipment/requests/create`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setShowRequestModal(false);
      setRequestData({ itemName: '', category: 'Other', quantity: 1, reason: '' });
      setRequestImage(null);
      setRequestImagePreview(null);
      alert("Request submitted successfully!");
      fetchRequests();
    } catch (err) {
      alert("Error submitting request");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`${BaseUrl}v1/equipment/delete/${id}`, axiosConfig);
        fetchData();
      } catch (err) {
        alert("Error deleting item");
      }
    }
  };

  const handleRequestStatusChange = async (reqId, newStatus) => {
    try {
      const adminRemarks = window.prompt(`Enter remarks for marking as ${newStatus} (Optional):`, "");
      if (adminRemarks === null) return; // User cancelled

      await axios.patch(`${BaseUrl}v1/equipment/requests/${reqId}/status`, { status: newStatus, adminRemarks }, axiosConfig);
      fetchRequests();
    } catch (err) {
      alert("Error updating status");
    }
  };

  const displayedInventory = inventory.filter(item => {
    if (statusFilter === 'LowStock') {
      return item.quantity <= 2 || item.status === 'Low Stock' || item.status === 'Out of Stock' || item.condition === 'Low Stock';
    }
    if (statusFilter === 'NeedsMaintenance') {
      return item.status === 'Maintenance Due' || item.status === 'Under Repair' || item.condition === 'Under Repair' || (item.nextMaintenanceDate && new Date(item.nextMaintenanceDate) <= new Date());
    }
    return true;
  });

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row mb-4 align-items-center g-3">
        <div className="col-12 col-xl-8">
          <h2 className="text-primary fw-bold mb-1">
            <FontAwesomeIcon icon={faBoxes} className="me-2" /> Equipment & Inventory
          </h2>
          <p className="text-muted mb-0">Manage gym equipment, assets, and submit procurement requests.</p>
        </div>
        <div className="col-12 col-xl-4 text-xl-end">
          <div className="d-flex flex-wrap gap-2 justify-content-xl-end">
            {!isAdminOrManager && (
              <button className="btn btn-outline-primary shadow-sm fw-semibold" onClick={() => setShowRequestModal(true)}>
                <FontAwesomeIcon icon={faPaperPlane} className="me-2" /> Request Item
              </button>
            )}
            {isAdminOrManager && (
              <button className="btn btn-primary shadow-sm fw-semibold" onClick={() => setShowAddModal(true)}>
                <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Equipment
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4">
          <div 
            className={`card border-0 shadow-sm rounded-4 bg-white h-100 ${statusFilter === 'All' ? 'ring-2 ring-primary border border-primary' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
            onClick={() => { setStatusFilter('All'); setActiveTab('equipment'); }}
          >
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faBoxes} className="text-primary fs-3" />
              </div>
              <div>
                <h6 className="text-muted mb-1" style={{fontSize: 'clamp(12px, 3vw, 14px)'}}>Total Equipment Count</h6>
                <h3 className="mb-0 fw-bold">{stats.totalQuantity || 0}</h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-12 col-sm-6 col-md-4">
          <div 
            className={`card border-0 shadow-sm rounded-4 bg-white h-100 ${statusFilter === 'LowStock' ? 'border border-2 border-warning shadow' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
            onClick={() => { setStatusFilter(prev => prev === 'LowStock' ? 'All' : 'LowStock'); setActiveTab('equipment'); }}
          >
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning fs-3" />
              </div>
              <div>
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="text-muted mb-1 me-2" style={{fontSize: 'clamp(12px, 3vw, 14px)'}}>Low / Out of Stock</h6>
                  {statusFilter === 'LowStock' && <span className="badge bg-warning text-dark style-sm">Active Filter</span>}
                </div>
                <h3 className="mb-0 fw-bold text-warning">{(Number(stats.lowStockCount) || 0) + (Number(stats.outOfStockCount) || 0)}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4">
          <div 
            className={`card border-0 shadow-sm rounded-4 bg-white h-100 ${statusFilter === 'NeedsMaintenance' ? 'border border-2 border-danger shadow' : ''}`}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
            onClick={() => { setStatusFilter(prev => prev === 'NeedsMaintenance' ? 'All' : 'NeedsMaintenance'); setActiveTab('equipment'); }}
          >
            <div className="card-body d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                <FontAwesomeIcon icon={faTools} className="text-danger fs-3" />
              </div>
              <div>
                <div className="d-flex align-items-center justify-content-between">
                  <h6 className="text-muted mb-1 me-2" style={{fontSize: 'clamp(12px, 3vw, 14px)'}}>Needs Maintenance</h6>
                  {statusFilter === 'NeedsMaintenance' && <span className="badge bg-danger text-white style-sm">Active Filter</span>}
                </div>
                <h3 className="mb-0 fw-bold text-danger">{stats.maintenanceCount || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Segmented Tabs */}
      <div className="bg-white p-2 rounded-4 shadow-sm mb-4 d-inline-flex flex-nowrap overflow-auto w-100" style={{ whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
        <button 
          className={`btn border-0 rounded-pill px-4 py-2 me-2 fw-semibold ${activeTab === 'equipment' ? 'bg-primary shadow-sm text-white' : 'text-muted bg-transparent'}`}
          onClick={() => setActiveTab('equipment')}
          style={{ transition: 'all 0.3s' }}
        >
          <FontAwesomeIcon icon={faBoxes} className="me-2" /> Equipment Register
        </button>
        <button 
          className={`btn border-0 rounded-pill px-4 py-2 fw-semibold d-flex align-items-center ${activeTab === 'requests' ? 'bg-primary shadow-sm text-white' : 'text-muted bg-transparent'}`}
          onClick={() => setActiveTab('requests')}
          style={{ transition: 'all 0.3s' }}
        >
          <FontAwesomeIcon icon={faPaperPlane} className="me-2" /> 
          {isAdminOrManager ? 'Procurement Requests' : 'My Requests'}
          {isAdminOrManager && requests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className={`badge rounded-pill ms-2 ${activeTab === 'requests' ? 'bg-white text-primary' : 'bg-danger'}`}>
              {requests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* Data Table Section */}
      {activeTab === 'equipment' && (
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center flex-wrap gap-2">
            <span className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle me-1">
              <FontAwesomeIcon icon={faBoxes} />
            </span>
            Equipment List
            {statusFilter !== 'All' && (
              <span 
                className="badge bg-warning bg-opacity-10 text-warning border border-warning px-3 py-2 ms-2 rounded-pill fw-normal fs-6 shadow-sm"
                style={{ cursor: 'pointer' }}
                onClick={() => setStatusFilter('All')}
                title="Click to clear filter"
              >
                Filtered: {statusFilter === 'LowStock' ? 'Low / Out of Stock' : 'Needs Maintenance'} ✕
              </span>
            )}
          </h5>
          
          <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
            <div className="input-group shadow-sm rounded-3 overflow-hidden flex-grow-1">
              <span className="input-group-text bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0 shadow-none py-2" 
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="input-group shadow-sm rounded-3 overflow-hidden flex-grow-1" style={{ minWidth: '180px' }}>
              <span className="input-group-text bg-white border-end-0">
                <FontAwesomeIcon icon={faFilter} className="text-muted" />
              </span>
              <select 
                className="form-select border-start-0 shadow-none py-2"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Cardio">Cardio</option>
                <option value="Strength">Strength</option>
                <option value="Free Weights">Free Weights</option>
                <option value="Accessories">Accessories</option>
                <option value="Cleaning Supplies">Cleaning Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Equipment Name</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Location</th>
                  <th className="py-3">Quantity</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Maintenance Due</th>
                  {isAdminOrManager && (
                    <th className="py-3 text-end px-4">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-5">Loading...</td></tr>
                ) : displayedInventory.length > 0 ? (
                  displayedInventory.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 fw-semibold text-dark">{item.name}</td>
                      <td className="py-3 text-muted">{item.category}</td>
                      <td className="py-3">{item.location || '-'}</td>
                      <td className="py-3 fw-bold">{item.quantity}</td>
                      <td className="py-3">
                        <span className={`badge rounded-pill ${
                          item.status === 'Active' ? 'bg-success bg-opacity-10 text-success border border-success' : 
                          item.status === 'Low Stock' ? 'bg-warning bg-opacity-10 text-warning border border-warning' : 
                          'bg-danger bg-opacity-10 text-danger border border-danger'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 text-muted">{item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toLocaleDateString() : 'N/A'}</td>
                      {isAdminOrManager && (
                        <td className="py-3 text-end px-4">
                          <button className="btn btn-sm btn-light me-2 text-primary border shadow-sm" title="View Details" onClick={() => handleViewClick(item)}>
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button className="btn btn-sm btn-light me-2 text-secondary border shadow-sm" title="Edit Item" onClick={() => handleEditClick(item)}>
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button className="btn btn-sm btn-light text-danger border shadow-sm" title="Delete" onClick={() => handleDelete(item.id)}>
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faBoxes} className="fs-1 mb-3 text-light" />
                      <h5>No equipment found</h5>
                      <p>Try adjusting your search or add a new equipment item.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'requests' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom p-4">
            <h5 className="mb-0 fw-bold text-dark">{isAdminOrManager ? 'Procurement & Item Requests' : 'My Requests'}</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4 py-3">Item Requested</th>
                    <th className="py-3">Requested By</th>
                    <th className="py-3">Quantity</th>
                    <th className="py-3">Reason</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-end px-4">{isAdminOrManager ? 'Actions' : 'Admin Remarks'}</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr><td colSpan="6" className="text-center py-5">Loading...</td></tr>
                  ) : requests.length > 0 ? (
                    requests.map(req => (
                      <tr key={req.id}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-2">
                            {req.imageUrl && (
                              <a href={req.imageUrl} target="_blank" rel="noopener noreferrer">
                                <img src={req.imageUrl} alt={req.itemName} className="rounded-2 shadow-sm border" style={{ width: '44px', height: '40px', objectFit: 'cover', flexShrink: 0 }} title="View image" />
                              </a>
                            )}
                            <div>
                              <span className="fw-semibold text-dark d-block">{req.itemName}</span>
                              <span className="text-muted fs-6">{req.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">{req.requestedByName || `ID: ${req.requestedBy}`} <span className="badge bg-secondary ms-1">{req.role}</span></td>
                        <td className="py-3 fw-bold">{req.quantity}</td>
                        <td className="py-3 text-muted" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason || '-'}</td>
                        <td className="py-3">
                          <span className={`badge rounded-pill ${
                            req.status === 'APPROVED' ? 'bg-success' : 
                            req.status === 'REJECTED' ? 'bg-danger' : 
                            req.status === 'COMPLETED' ? 'bg-info' : 'bg-warning text-dark'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 text-end px-4">
                          {isAdminOrManager ? (
                            req.status === 'PENDING' ? (
                              <>
                                <button className="btn btn-sm btn-success shadow-sm me-2" onClick={() => handleRequestStatusChange(req.id, 'APPROVED')}>Approve</button>
                                <button className="btn btn-sm btn-outline-danger shadow-sm" onClick={() => handleRequestStatusChange(req.id, 'REJECTED')}>Reject</button>
                              </>
                            ) : req.status === 'APPROVED' ? (
                              <button className="btn btn-sm btn-primary shadow-sm" onClick={() => handleRequestStatusChange(req.id, 'COMPLETED')}>Mark Completed</button>
                            ) : (
                              <span className="text-muted fst-italic">No actions</span>
                            )
                          ) : (
                            <span className="text-muted fst-italic">{req.adminRemarks || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <p>No procurement requests found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD EQUIPMENT MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title><FontAwesomeIcon icon={faPlus} className="me-2 text-primary" /> Add New Equipment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Equipment Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Treadmill Pro" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min="1" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Condition</Form.Label>
                  <Form.Select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Under Repair">Under Repair</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Location in Gym</Form.Label>
                  <Form.Control type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. First Floor Cardio" />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control type="date" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Purchase Cost</Form.Label>
                  <Form.Control type="number" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} placeholder="e.g. 15000" />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Next Maintenance Date</Form.Label>
                  <Form.Control type="date" value={formData.nextMaintenanceDate || ''} onChange={e => setFormData({...formData, nextMaintenanceDate: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any additional details, warranty info, etc." />
                </Form.Group>
              </div>
              {/* Image Upload */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-semibold">Equipment Photo <span className="text-muted fw-normal">(Optional)</span></Form.Label>
                  <div className="border rounded-3 p-3" style={{ background: '#f8f9fa' }}>
                    {equipmentImagePreview ? (
                      <div className="d-flex align-items-center gap-3">
                        <img src={equipmentImagePreview} alt="Preview" className="rounded-3 shadow-sm" style={{ width: '90px', height: '70px', objectFit: 'cover' }} />
                        <div>
                          <p className="mb-1 fw-semibold text-dark" style={{fontSize: '13px'}}>{equipmentImage?.name}</p>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setEquipmentImage(null); setEquipmentImagePreview(null); }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="d-flex flex-column align-items-center justify-content-center py-3" style={{ cursor: 'pointer' }}>
                        <span style={{ fontSize: '2rem' }}>📷</span>
                        <span className="text-muted mt-1" style={{ fontSize: '13px' }}>Click to upload equipment photo</span>
                        <input type="file" accept="image/*" className="d-none" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setEquipmentImage(file);
                            setEquipmentImagePreview(URL.createObjectURL(file));
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="me-2">Cancel</Button>
              <Button variant="primary" type="submit">Save Equipment</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* EDIT EQUIPMENT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title><FontAwesomeIcon icon={faEdit} className="me-2 text-primary" /> Edit Equipment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Equipment Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" required value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={editFormData.category || ''} onChange={e => setEditFormData({...editFormData, category: e.target.value})}>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min="1" required value={editFormData.quantity || 1} onChange={e => setEditFormData({...editFormData, quantity: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Condition</Form.Label>
                  <Form.Select value={editFormData.condition || ''} onChange={e => setEditFormData({...editFormData, condition: e.target.value})}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Under Repair">Under Repair</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Location in Gym</Form.Label>
                  <Form.Control type="text" value={editFormData.location || ''} onChange={e => setEditFormData({...editFormData, location: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Purchase Date</Form.Label>
                  <Form.Control type="date" value={editFormData.purchaseDate || ''} onChange={e => setEditFormData({...editFormData, purchaseDate: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Purchase Cost</Form.Label>
                  <Form.Control type="number" step="0.01" value={editFormData.purchaseCost || ''} onChange={e => setEditFormData({...editFormData, purchaseCost: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Next Maintenance Date</Form.Label>
                  <Form.Control type="date" value={editFormData.nextMaintenanceDate || ''} onChange={e => setEditFormData({...editFormData, nextMaintenanceDate: e.target.value})} />
                </Form.Group>
              </div>
              <div className="col-12">
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control as="textarea" rows={3} value={editFormData.notes || ''} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} />
                </Form.Group>
              </div>
              {/* Image Upload */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-semibold">Equipment Photo <span className="text-muted fw-normal">(Optional)</span></Form.Label>
                  <div className="border rounded-3 p-3" style={{ background: '#f8f9fa' }}>
                    {editEquipmentImagePreview ? (
                      <div className="d-flex align-items-center gap-3">
                        <img src={editEquipmentImagePreview} alt="Preview" className="rounded-3 shadow-sm" style={{ width: '90px', height: '70px', objectFit: 'cover' }} />
                        <div>
                          <p className="mb-1 fw-semibold text-dark" style={{fontSize: '13px'}}>{editEquipmentImage?.name || 'Existing Image'}</p>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setEditEquipmentImage(null); setEditEquipmentImagePreview(null); }}>
                            Remove/Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="d-flex flex-column align-items-center justify-content-center py-3" style={{ cursor: 'pointer' }}>
                        <span style={{ fontSize: '2rem' }}>📷</span>
                        <span className="text-muted mt-1" style={{ fontSize: '13px' }}>Click to upload equipment photo</span>
                        <input type="file" accept="image/*" className="d-none" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setEditEquipmentImage(file);
                            setEditEquipmentImagePreview(URL.createObjectURL(file));
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </Form.Group>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} className="me-2">Cancel</Button>
              <Button variant="primary" type="submit">Update Equipment</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* VIEW EQUIPMENT MODAL */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title><FontAwesomeIcon icon={faEye} className="me-2 text-primary" /> View Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEquipment && (
            <div className="row g-3">
              {selectedEquipment.imageUrl && (
                <div className="col-12 text-center mb-3">
                  <img src={selectedEquipment.imageUrl} alt={selectedEquipment.name} className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                </div>
              )}
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Equipment Name</p>
                <h6 className="fw-semibold">{selectedEquipment.name}</h6>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Category</p>
                <h6 className="fw-semibold">{selectedEquipment.category || 'N/A'}</h6>
              </div>
              <div className="col-md-4">
                <p className="mb-1 text-muted small">Quantity</p>
                <h6 className="fw-semibold">{selectedEquipment.quantity}</h6>
              </div>
              <div className="col-md-4">
                <p className="mb-1 text-muted small">Condition</p>
                <h6 className="fw-semibold">{selectedEquipment.condition || 'N/A'}</h6>
              </div>
              <div className="col-md-4">
                <p className="mb-1 text-muted small">Status</p>
                <h6 className="fw-semibold">{selectedEquipment.status || 'N/A'}</h6>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Location in Gym</p>
                <h6 className="fw-semibold">{selectedEquipment.location || 'N/A'}</h6>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Purchase Date</p>
                <h6 className="fw-semibold">{selectedEquipment.purchaseDate ? new Date(selectedEquipment.purchaseDate).toLocaleDateString() : 'N/A'}</h6>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Purchase Cost</p>
                <h6 className="fw-semibold">{selectedEquipment.purchaseCost ? `₹${selectedEquipment.purchaseCost}` : 'N/A'}</h6>
              </div>
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Next Maintenance</p>
                <h6 className="fw-semibold">{selectedEquipment.nextMaintenanceDate ? new Date(selectedEquipment.nextMaintenanceDate).toLocaleDateString() : 'N/A'}</h6>
              </div>
              <div className="col-12">
                <p className="mb-1 text-muted small">Notes</p>
                <h6 className="fw-semibold">{selectedEquipment.notes || 'No additional notes.'}</h6>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* REQUEST ITEM MODAL */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><FontAwesomeIcon icon={faPaperPlane} className="me-2 text-primary" /> Request Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleRequestSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Item / Equipment Name <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" required value={requestData.itemName} onChange={e => setRequestData({...requestData, itemName: e.target.value})} placeholder="e.g. Resistance Bands" />
            </Form.Group>
            
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select value={requestData.category} onChange={e => setRequestData({...requestData, category: e.target.value})}>
                    <option value="Accessories">Accessories</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Machine">Machine</option>
                    <option value="Cleaning Supplies">Cleaning Supplies</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="number" min="1" required value={requestData.quantity} onChange={e => setRequestData({...requestData, quantity: e.target.value})} />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-4">
              <Form.Label>Reason for Request</Form.Label>
              <Form.Control as="textarea" rows={3} value={requestData.reason} onChange={e => setRequestData({...requestData, reason: e.target.value})} placeholder="Why is this item needed?" />
            </Form.Group>

            {/* Image Upload for Request */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">Reference Image <span className="text-muted fw-normal">(Optional – attach photo of required item)</span></Form.Label>
              <div className="border rounded-3 p-3" style={{ background: '#f8f9fa' }}>
                {requestImagePreview ? (
                  <div className="d-flex align-items-center gap-3">
                    <img src={requestImagePreview} alt="Preview" className="rounded-3 shadow-sm" style={{ width: '90px', height: '70px', objectFit: 'cover' }} />
                    <div>
                      <p className="mb-1 fw-semibold text-dark" style={{fontSize: '13px'}}>{requestImage?.name}</p>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setRequestImage(null); setRequestImagePreview(null); }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="d-flex flex-column align-items-center justify-content-center py-3" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: '2rem' }}>🖼️</span>
                    <span className="text-muted mt-1" style={{ fontSize: '13px' }}>Click to attach a reference image</span>
                    <input type="file" accept="image/*" className="d-none" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setRequestImage(file);
                        setRequestImagePreview(URL.createObjectURL(file));
                      }
                    }} />
                  </label>
                )}
              </div>
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowRequestModal(false)} className="me-2">Cancel</Button>
              <Button variant="primary" type="submit">Submit Request</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default InventoryManagement;
