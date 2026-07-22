import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrashAlt } from 'react-icons/fa';

const ManageMember = () => {
    const [members, setMembers] = useState([
        {
            id: 1,
            name: 'Alex Johnson',
            memberId: 'M30618',
            joiningDate: 'January 1, 2020',
            expireDate: 'December 26, 2050',
            type: 'Member',
            status: 'Continue',
            membershipStatus: 'Activated',
            photo: 'https://randomuser.me/api/portraits/men/32.jpg',
            plan: 'Premium' // 👈 NEW FIELD: Membership Plan
        },
        {
            id: 2,
            name: 'Braidy Con',
            memberId: 'M42920',
            joiningDate: 'January 30, 2020',
            expireDate: 'December 26, 2050',
            type: 'Member',
            status: 'Prospect',
            membershipStatus: 'Activate',
            photo: '',
            plan: 'Basic' // 👈 NEW FIELD
        }
    ]);

    const [filteredMembers, setFilteredMembers] = useState(members);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        setFilteredMembers(
            members.filter(member =>
                member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.plan?.toLowerCase().includes(searchTerm.toLowerCase()) // 👈 Search by Plan too
            )
        );
    }, [searchTerm, members]);

    useEffect(() => {
        if (showModal || isDeleteModalOpen || viewModal || editModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal, isDeleteModalOpen, viewModal, editModal]);

    const getStatusBadge = (status) => {
        const badgeClasses = {
            Activated: "bg-success-subtle text-success-emphasis",
            Activate: "bg-warning-subtle text-warning-emphasis",
            Expired: "bg-danger-subtle text-danger-emphasis"
        };
        return (
            <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
                {status}
            </span>
        );
    };

    const handleActivate = (id) => {
        setMembers(prev =>
            prev.map(m =>
                m.id === id ? { ...m, membershipStatus: m.membershipStatus === 'Activate' ? 'Activated' : 'Activate' } : m
            )
        );
    };

    const handleDeleteClick = (member) => {
        setSelectedMember(member);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedMember) {
            setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
            alert(`Member "${selectedMember.name}" has been deleted.`);
        }
        setIsDeleteModalOpen(false);
        setSelectedMember(null);
    };

    const closeModal = () => setShowModal(false);
    const closeViewModal = () => {
        setViewModal(false);
        setSelectedMember(null);
    };
    const closeEditModal = () => {
        setEditModal(false);
        setSelectedMember(null);
    };
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedMember(null);
    };

    const openViewModal = (member) => {
        setSelectedMember(member);
        setViewModal(true);
    };

    const openEditModal = (member) => {
        setSelectedMember(member);
        setEditModal(true);
    };

    return (
        <div className="">
            {/* Header */}
            <div className="row mb-4 align-items-center">
                <div className="col-12 col-lg-8 mb-3 mb-lg-0">
                    <h2 className="fw-bold h3 h2-md">Members List</h2>
                    <p className="text-muted mb-0">Manage all gym members, their information, and membership plan.</p>
                </div>
                <div className="col-12 col-lg-4 text-lg-end">
                    <button
                        className="btn w-100 w-lg-auto"
                        style={{
                            backgroundColor: '#6EB2CC',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            fontSize: '1rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                        }}
                        onClick={() => setShowModal(true)}
                    >
                        <i className="fas fa-plus me-2"></i> Add Member
                    </button>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="row mb-4 g-3">
                <div className="col-12 col-md-6 col-lg-5">
                    <div className="input-group">
                        <span className="input-group-text bg-light border">
                            <i className="fas fa-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border"
                            placeholder="Search members by name, ID, or plan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                    <button className="btn btn-outline-secondary w-100">
                        <i className="fas fa-filter me-1"></i> Filter
                    </button>
                </div>
                <div className="col-6 col-md-3 col-lg-2">
                    <div className="dropdown w-100">
                        <button
                            className="btn btn-outline-secondary w-100 dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="fas fa-file-export me-1"></i> Export
                        </button>
                        <ul className="dropdown-menu">
                            <li><button className="dropdown-item">PDF</button></li>
                            <li><button className="dropdown-item">CSV</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card shadow-sm border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="fw-semibold">PHOTO</th>
                                <th className="fw-semibold">MEMBER NAME</th>
                                <th className="fw-semibold">MEMBER ID</th>
                                <th className="fw-semibold">JOINING DATE</th>
                                <th className="fw-semibold">EXPIRE DATE</th>
                                <th className="fw-semibold">TYPE</th>
                                <th className="fw-semibold">STATUS</th>
                                <th className="fw-semibold">PLAN</th> {/* 👈 NEW COLUMN */}
                                <th className="fw-semibold text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        {member.photo ? (
                                            <img
                                                src={member.photo.trim()}
                                                alt={member.name}
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid #eee'
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    backgroundColor: '#ddd',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1rem',
                                                    fontWeight: 'bold',
                                                    color: '#666'
                                                }}
                                            >
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td><strong>{member.name}</strong></td>
                                    <td>{member.memberId}</td>
                                    <td>{member.joiningDate}</td>
                                    <td>{member.expireDate}</td>
                                    <td>{member.type}</td>
                                    <td>
                                        <button
                                            className='btn btn-sm border-0'
                                            onClick={() => handleActivate(member.id)}
                                        >
                                            {getStatusBadge(member.membershipStatus === 'Activate' ? 'Activate' : 'Activated')}
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`badge rounded-pill ${
                                            member.plan === 'Premium' ? 'bg-primary' :
                                            member.plan === 'Gold' ? 'bg-warning' :
                                            member.plan === 'Basic' ? 'bg-secondary' :
                                            'bg-light'
                                        } text-dark px-3 py-1`}>
                                            {member.plan || 'Not Set'}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex flex-row justify-content-center gap-1">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                title="View"
                                                onClick={() => openViewModal(member)}
                                            >
                                                <FaEye size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                title="Edit"
                                                onClick={() => openEditModal(member)}
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                title="Delete"
                                                onClick={() => handleDeleteClick(member)}
                                            >
                                                <FaTrashAlt size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW MODAL */}
            {viewModal && selectedMember && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeViewModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">View Member</h5>
                                <button type="button" className="btn-close" onClick={closeViewModal}></button>
                            </div>
                            <div className="modal-body p-3 p-md-4">
                                <p><strong>Name:</strong> {selectedMember.name}</p>
                                <p><strong>Member ID:</strong> {selectedMember.memberId}</p>
                                <p><strong>Joining Date:</strong> {selectedMember.joiningDate}</p>
                                <p><strong>Expire Date:</strong> {selectedMember.expireDate}</p>
                                <p><strong>Type:</strong> {selectedMember.type}</p>
                                <p><strong>Status:</strong> {selectedMember.status}</p>
                                <p><strong>Membership Status:</strong> {selectedMember.membershipStatus}</p>
                                <p><strong>Plan:</strong> <span className={`badge rounded-pill ${
                                    selectedMember.plan === 'Premium' ? 'bg-primary' :
                                    selectedMember.plan === 'Gold' ? 'bg-warning' :
                                    selectedMember.plan === 'Basic' ? 'bg-secondary' :
                                    'bg-light'
                                } text-dark`}>{selectedMember.plan || 'Not Set'}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editModal && selectedMember && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeEditModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Edit Member</h5>
                                <button type="button" className="btn-close" onClick={closeEditModal}></button>
                            </div>
                            <div className="modal-body p-3 p-md-4">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    setMembers(prev =>
                                        prev.map(m =>
                                            m.id === selectedMember.id
                                                ? { ...m, plan: e.target.plan.value }
                                                : m
                                        )
                                    );
                                    alert('Member updated!');
                                    closeEditModal();
                                }}>
                                    <div className="mb-3">
                                        <label className="form-label">Name</label>
                                        <input type="text" className="form-control" defaultValue={selectedMember.name} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Member ID</label>
                                        <input type="text" className="form-control" defaultValue={selectedMember.memberId} readOnly />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Joining Date</label>
                                        <input type="text" className="form-control" defaultValue={selectedMember.joiningDate} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Expire Date</label>
                                        <input type="text" className="form-control" defaultValue={selectedMember.expireDate} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Plan *</label>
                                        <select className="form-select" name="plan" defaultValue={selectedMember.plan} required>
                                            <option value="">Select Plan</option>
                                            <option value="Basic">Basic</option>
                                            <option value="Gold">Gold</option>
                                            <option value="Premium">Premium</option>
                                        </select>
                                    </div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={closeEditModal}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">Save</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {isDeleteModalOpen && selectedMember && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeDeleteModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
                            </div>
                            <div className="modal-body text-center py-4">
                                <div className="display-6 text-danger mb-3">
                                    <i className="fas fa-exclamation-triangle"></i>
                                </div>
                                <h5>Are you sure?</h5>
                                <p className="text-muted">
                                    This will permanently delete <strong>{selectedMember.name}</strong>.<br />
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="modal-footer border-0 justify-content-center pb-4">
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={closeDeleteModal}>Cancel</button>
                                <button type="button" className="btn btn-danger px-4" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD MEMBER MODAL */}
            {showModal && (
                <div
                    className="modal fade show"
                    tabIndex="-1"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Add Member</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeModal}
                                ></button>
                            </div>
                            <div className="modal-body p-3 p-md-4">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const newMember = {
                                        id: members.length + 1,
                                        name: formData.get('firstName') + ' ' + (formData.get('middleName') || '') + ' ' + formData.get('lastName'),
                                        memberId: formData.get('memberId') || `M${Math.floor(10000 + Math.random() * 90000)}`,
                                        joiningDate: formData.get('joiningDate') || 'Today',
                                        expireDate: formData.get('expireDate') || 'Dec 26, 2050',
                                        type: 'Member',
                                        status: 'Active',
                                        membershipStatus: 'Activate',
                                        photo: '',
                                        plan: formData.get('plan') || 'Basic', // 👈 New Plan field
                                    };
                                    setMembers([...members, newMember]);
                                    alert('Member added successfully!');
                                    closeModal();
                                }}>
                                    {/* Personal Information */}
                                    <h6 className="mb-3 fw-semibold">Personal Information</h6>
                                    <div className="row mb-3 g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Member ID</label>
                                            <input type="text" className="form-control rounded-3" name="memberId" defaultValue="M50825" readOnly />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">First Name *</label>
                                            <input type="text" className="form-control rounded-3" name="firstName" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Middle Name</label>
                                            <input type="text" className="form-control rounded-3" name="middleName" />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Last Name *</label>
                                            <input type="text" className="form-control rounded-3" name="lastName" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Gender *</label>
                                            <div>
                                                <input type="radio" name="gender" id="male" value="Male" required />{' '}
                                                <label htmlFor="male" className="me-3">Male</label>
                                                <input type="radio" name="gender" id="female" value="Female" />{' '}
                                                <label htmlFor="female">Female</label>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Date Of Birth *</label>
                                            <input type="date" className="form-control rounded-3" name="dob" required />
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Group</label>
                                            <select className="form-select rounded-3" name="group">
                                                <option>Select an option</option>
                                                <option>Group1</option>
                                                <option>Group2</option>
                                                <option>Group3</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-sm mt-1"
                                                style={{
                                                    backgroundColor: '#6EB2CC',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                Add Group
                                            </button>
                                        </div>
                                        <div className="col-md-4">
                                            <label className="form-label">Class</label>
                                            <select className="form-select rounded-3" name="class">
                                                <option>Class1</option>
                                                <option>Class2</option>
                                                <option>Class3</option>
                                            </select>
                                            <button
                                                type="button"
                                                className="btn btn-sm mt-1"
                                                style={{
                                                    backgroundColor: '#6EB2CC',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '4px 8px',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                Add Class
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <h6 className="mb-3 fw-semibold">Contact Information</h6>
                                    <div className="row mb-3 g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Address *</label>
                                            <input type="text" className="form-control rounded-3" name="address" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">City *</label>
                                            <input type="text" className="form-control rounded-3" name="city" required />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">State</label>
                                            <input type="text" className="form-control rounded-3" name="state" />
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Mobile Number *</label>
                                            <div className="input-group">
                                                <span className="input-group-text">+61</span>
                                                <input type="text" className="form-control rounded-3" name="mobile" required />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <label className="form-label">Email *</label>
                                            <input type="email" className="form-control rounded-3" name="email" autoComplete="new-email" required />
                                        </div>
                                    </div>

                                    {/* Physical Information */}
                                    <h6 className="mb-3 fw-semibold">Physical Information</h6>
                                    <div className="row mb-3 g-3">
                                        {["Weight", "Height", "Chest", "Waist", "Thigh", "Arms", "Fat"].map((label, idx) => (
                                            <div className="col-md-3" key={idx}>
                                                <label className="form-label">{label}</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-3"
                                                    placeholder={
                                                        label === "Weight" ? "KG" :
                                                        label === "Height" ? "Centimeter" :
                                                        label === "Fat" ? "Percentage" : "Inches"
                                                    }
                                                    name={label.toLowerCase()}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Login Information */}
                                    <h6 className="mb-3 fw-semibold">Login Information</h6>
                                    <div className="row mb-3 g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Username *</label>
                                            <input type="text" className="form-control rounded-3" name="username" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Password *</label>
                                            <input type="password" className="form-control rounded-3" name="password" autoComplete="new-password" required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Display Image</label>
                                            <input type="file" className="form-control rounded-3" name="photo" />
                                        </div>
                                    </div>

                                    {/* 👈 NEW PLAN FIELD */}
                                    <h6 className="mb-3 fw-semibold">Membership Plan *</h6>
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label">Select Membership Plan</label>
                                            <select className="form-select rounded-3" name="plan" required>
                                                <option value="">-- Select Plan --</option>
                                                <option value="Basic">Basic ($29/month)</option>
                                                <option value="Gold">Gold ($59/month)</option>
                                                <option value="Premium">Premium ($99/month)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-4 py-2"
                                            onClick={closeModal}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn"
                                            style={{
                                                backgroundColor: '#6EB2CC',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '10px 20px',
                                                fontWeight: '500',
                                            }}
                                        >
                                            Save Member
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageMember;