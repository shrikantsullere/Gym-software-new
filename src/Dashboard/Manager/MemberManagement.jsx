import React, { useState, useEffect } from 'react';
// import 'bootstrap/dist/css/bootstrap.min.css';
import { 
  Search, Plus, Eye, Pencil, Trash, 
  Filter, Download, Upload, Calendar,
  Person, Telephone, Envelope, Geo, CardHeading, ThreeDotsVertical
} from 'react-bootstrap-icons';

// Mock data
const mockMembers = [
  {
    id: 1,
    fullName: 'John Doe',
    phone: '555-1234',
    email: 'john@example.com',
    plan: 'Premium',
    joinDate: '2023-01-15',
    expiryDate: '2024-01-15',
    status: 'Active',
    gender: 'Male',
    dob: '1985-05-10',
    address: '123 Main St, Anytown'
  },
  {
    id: 2,
    fullName: 'Jane Smith',
    phone: '555-5678',
    email: 'jane@example.com',
    plan: 'Basic',
    joinDate: '2023-03-22',
    expiryDate: '2023-09-22',
    status: 'Inactive',
    gender: 'Female',
    dob: '1990-11-30',
    address: '456 Oak Ave, Somewhere'
  }
];

const MemberManagement = () => {
  const [members, setMembers] = useState(mockMembers);
  const [filteredMembers, setFilteredMembers] = useState(mockMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 5;

  // Filter logic
  useEffect(() => {
    let result = members;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(member =>
        member.fullName.toLowerCase().includes(term) ||
        member.phone.includes(term) ||
        member.email.toLowerCase().includes(term) ||
        member.id.toString().includes(term)
      );
    }
    if (filterPlan) result = result.filter(member => member.plan === filterPlan);
    if (filterStatus) result = result.filter(member => member.status === filterStatus);
    setFilteredMembers(result);
  }, [searchTerm, filterPlan, filterStatus, members]);

  const handleSearch = e => setSearchTerm(e.target.value);
  const clearFilters = () => { setSearchTerm(''); setFilterPlan(''); setFilterStatus(''); };
  const addMember = member => {
    const newId = Math.max(...members.map(m => m.id)) + 1;
    setMembers([...members, { ...member, id: newId }]);
    setShowForm(false);
  };
  const updateMember = member => {
    setMembers(members.map(m => m.id === member.id ? member : m));
    setEditingMember(null);
    setShowForm(false);
  };
  const deleteMember = id => {
    setMembers(members.filter(m => m.id !== id));
    setShowDeleteModal(false);
  };
  const handleEdit = member => { setEditingMember(member); setShowForm(true); };
  const handleDelete = member => { setEditingMember(member); setShowDeleteModal(true); };

  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember);
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const paginate = pageNumber => setCurrentPage(pageNumber);

  return (
    <div className="container-fluid py-3 py-md-4">
      {!showForm ? (
        <MemberList
          members={currentMembers}
          searchTerm={searchTerm}
          filterPlan={filterPlan}
          filterStatus={filterStatus}
          handleSearch={handleSearch}
          setFilterPlan={setFilterPlan}
          setFilterStatus={setFilterStatus}
          clearFilters={clearFilters}
          setShowForm={setShowForm}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          paginate={paginate}
          totalMembers={filteredMembers.length}
        />
      ) : (
        <MemberForm
          member={editingMember}
          addMember={addMember}
          updateMember={updateMember}
          setShowForm={setShowForm}
        />
      )}
      {showDeleteModal && (
        <DeleteConfirmation
          member={editingMember}
          deleteMember={deleteMember}
          setShowDeleteModal={setShowDeleteModal}
        />
      )}
    </div>
  );
};

// Member List
const MemberList = ({
  members, searchTerm, filterPlan, filterStatus, handleSearch,
  setFilterPlan, setFilterStatus, clearFilters, setShowForm,
  handleEdit, handleDelete, currentPage, totalPages, paginate, totalMembers
}) => {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h1 className="h4">Members</h1>
        <button className=" d-flex btn btn-outline-light align-items-center mt-2 mt-md-0" style={{ backgroundColor: '#2f6a87', color: '#fff' }} onClick={() => setShowForm(true)}>
          <Plus size={18} className="me-2" /> Add Member
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text"><Search /></span>
                <input type="text" className="form-control" placeholder="Search by Name, Phone, Email, ID" value={searchTerm} onChange={handleSearch} />
              </div>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <select className="form-select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                <option value="">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="col-12 col-lg-4 d-flex justify-content-end flex-wrap gap-2 mt-2 mt-lg-0">
              <button className="btn btn-outline-secondary" onClick={clearFilters}>Clear Filters</button>
              <button className="btn btn-outline-success"><Upload className="me-1"/> Import</button>
              <button className="btn btn-outline-primary"><Download className="me-1"/> Export</button>
            </div>
          </div>
        </div>
      </div>

      {/* Table for medium+ screens */}
      <div className="card d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th><th>Full Name</th><th>Phone / Email</th><th>Plan</th>
                <th>Join Date</th><th>Expiry Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length>0 ? members.map(member => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.fullName}</td>
                  <td><div>{member.phone}</div><small className="text-muted">{member.email}</small></td>
                  <td>{member.plan}</td>
                  <td>{member.joinDate}</td>
                  <td>{member.expiryDate}</td>
                  <td><span className={`badge ${member.status==='Active'?'bg-success':'bg-secondary'}`}>{member.status}</span></td>
                  <td>
                    <div className="btn-group">
                      <button className="btn btn-sm btn-outline-primary"><Eye /></button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>handleEdit(member)}><Pencil /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(member)}><Trash /></button>
                    </div>
                  </td>
                </tr>
              )): <tr><td colSpan="8" className="text-center py-4">No members found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="d-md-none">
        {members.length>0 ? members.map(member => (
          <div key={member.id} className="card mx-2 my-2 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap">
                <h5 className="card-title mb-0">{member.fullName}</h5>
                <span className={`badge ${member.status==='Active'?'bg-success':'bg-secondary'}`}>{member.status}</span>
              </div>
              <p className="mb-1"><small className="text-muted">ID: {member.id}</small></p>
              <p className="mb-1"><Telephone size={14} className="me-1"/>{member.phone}</p>
              <p className="mb-1 text-truncate"><Envelope size={14} className="me-1"/>{member.email}</p>
              <p className="mb-2"><CardHeading size={14} className="me-1"/>{member.plan} Plan</p>
              <div className="d-flex justify-content-between text-muted small mb-3 flex-wrap">
                <div>Joined: {member.joinDate}</div>
                <div>Expires: {member.expiryDate}</div>
              </div>
              <div className="d-flex justify-content-end gap-2 flex-wrap">
                <button className="btn btn-sm btn-outline-primary"><Eye /></button>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>handleEdit(member)}><Pencil /></button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(member)}><Trash /></button>
              </div>
            </div>
          </div>
        )) : <div className="text-center py-4">No members found</div>}
      </div>

      {/* Pagination */}
      {totalPages>1 && (
        <nav className="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top">
          <div className="mb-2 mb-md-0">
            <small className="text-muted">Showing {((currentPage-1)*5)+1} to {Math.min(currentPage*5,totalMembers)} of {totalMembers} entries</small>
          </div>
          <ul className="pagination pagination-sm mb-0 flex-wrap">
            <li className={`page-item ${currentPage===1?'disabled':''}`}>
              <button className="page-link" onClick={()=>paginate(currentPage-1)}>&laquo;</button>
            </li>
            {Array.from({length:totalPages},(_,i)=>i+1).map(page=>(
              <li key={page} className={`page-item ${currentPage===page?'active':''}`}>
                <button className="page-link" onClick={()=>paginate(page)}>{page}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage===totalPages?'disabled':''}`}>
              <button className="page-link" onClick={()=>paginate(currentPage+1)}>&raquo;</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

// Member Form
const MemberForm = ({ member, addMember, updateMember, setShowForm }) => {
  const isEditing = !!member;
  const [formData, setFormData] = useState(
    member || { fullName:'', gender:'', dob:'', phone:'', email:'', address:'', plan:'', joinDate:'', expiryDate:'', status:'Active' }
  );

  const handleChange = e => setFormData({...formData, [e.target.name]: e.target.value});
  const handleSubmit = e => {
    e.preventDefault();
    isEditing ? updateMember(formData) : addMember(formData);
  };

  return (
    <div className="card">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{isEditing?'Edit Member':'Add New Member'}</h5>
        <button type="button" className="btn-close d-md-none" onClick={()=>setShowForm(false)}></button>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-control" name="fullName" value={formData.fullName} onChange={handleChange} required/>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Gender</label>
              <div className="d-flex gap-3">
                {['Male','Female','Other'].map(g=>(
                  <div className="form-check" key={g}>
                    <input className="form-check-input" type="radio" name="gender" value={g} checked={formData.gender===g} onChange={handleChange}/>
                    <label className="form-check-label">{g}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">DOB</label>
              <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange}/>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <div className="input-group">
                <span className="input-group-text"><Telephone /></span>
                <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange}/>
              </div>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                <span className="input-group-text"><Envelope /></span>
                <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange}/>
              </div>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Address</label>
              <div className="input-group">
                <span className="input-group-text"><Geo /></span>
                <textarea className="form-control" name="address" rows="2" value={formData.address} onChange={handleChange}></textarea>
              </div>
            </div>
            <div className="col-12 col-md-6 mb-3">
              <label className="form-label">Membership Plan</label>
              <select className="form-select" name="plan" value={formData.plan} onChange={handleChange}>
                <option value="">Select Plan</option>
                <option value="Basic">Basic</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <label className="form-label">Join Date</label>
              <input type="date" className="form-control" name="joinDate" value={formData.joinDate} onChange={handleChange}/>
            </div>
            <div className="col-6 col-md-3 mb-3">
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-control" name="expiryDate" value={formData.expiryDate} onChange={handleChange}/>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-outline-light " style={{ backgroundColor: '#2f6a87', color: '#fff' }}>{isEditing?'Update':'Add'} Member</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation
const DeleteConfirmation = ({ member, deleteMember, setShowDeleteModal }) => (
  <div className="modal show d-block" tabIndex="-1">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Confirm Delete</h5>
          <button type="button" className="btn-close" onClick={()=>setShowDeleteModal(false)}></button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{member.fullName}</strong>?</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={()=>setShowDeleteModal(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={()=>deleteMember(member.id)}>Delete</button>
        </div>
      </div>
    </div>
  </div>
);

export default MemberManagement;
