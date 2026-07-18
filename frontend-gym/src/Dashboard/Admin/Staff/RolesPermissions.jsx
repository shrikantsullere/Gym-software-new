// src/components/ManageRoles.js
import React, { useState, useRef } from 'react';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';

const ManageRoles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const roleInputs = useRef({});

  // Sample Roles with Permissions
  const [roles, setRoles] = useState([
    { id: 1, role_name: "Manager", role_description: "Branch operations manager", permissions_json: { dashboard: true, members: true, staff: true, finance: true, settings: false } },
    { id: 2, role_name: "Trainer", role_description: "Fitness instructor", permissions_json: { dashboard: true, members: true, staff: false, finance: false, settings: false } },
    { id: 3, role_name: "Receptionist", role_description: "Front desk operations", permissions_json: { dashboard: true, members: true, staff: false, finance: false, settings: false } },
    { id: 4, role_name: "Housekeeping", role_description: "Cleaning & maintenance", permissions_json: { dashboard: false, members: false, staff: false, finance: false, settings: false } }
  ]);

  // ===== HANDLERS =====
  const handleAddNew = () => {
    setModalType('add');
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role) => {
    setModalType('edit');
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRole) {
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      alert(`Role "${selectedRole.role_name}" has been deleted.`);
    }
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    roleInputs.current = {};
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  };

  // Prevent background scroll
  React.useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isDeleteModalOpen]);

  // ===== UI HELPERS =====
  const getBadgeColor = (roleName) => {
    const colors = {
      Admin: "bg-primary-subtle text-primary-emphasis",
      Manager: "bg-info-subtle text-info-emphasis",
      Trainer: "bg-warning-subtle text-warning-emphasis",
      Receptionist: "bg-secondary-subtle text-secondary-emphasis",
      Housekeeping: "bg-success-subtle text-success-emphasis"
    };
    return colors[roleName] || "bg-light text-dark";
  };

  // ✅ Get only allowed permission names as comma-separated string
  const getAllowedPermissionNames = (permissions) => {
    const allowed = Object.keys(permissions).filter(key => permissions[key]);
    if (allowed.length === 0) return "—";
    return allowed.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(", ");
  };

  // ===== JSX =====
  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold">Role & Permission Management</h2>
          <p className="text-muted mb-0">Define roles and control access to system modules.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
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
            onClick={handleAddNew}
          >
            <FaPlus size={14} className="me-2" /> Add Role
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold">ROLE NAME</th>
                <th className="fw-semibold">DESCRIPTION</th>
                <th className="fw-semibold">ALLOWED PERMISSIONS</th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <span className={`badge ${getBadgeColor(role.role_name)} rounded-pill px-3 py-2`}>
                      {role.role_name}
                    </span>
                  </td>
                  <td>{role.role_description || "— "}</td>
                  <td>
                    <small className="text-muted">
                      {getAllowedPermissionNames(role.permissions_json)}
                    </small>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center flex-nowrap" style={{ gap: '4px' }}>
                      <button
                        className="btn btn-sm btn-outline-primary action-btn"
                        title="Edit"
                        onClick={() => handleEdit(role)}
                        style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger action-btn"
                        title="Delete"
                        onClick={() => handleDeleteClick(role)}
                        disabled={role.role_name === "Admin"}
                        style={{ width: '32px', height: '32px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

      {/* ROLE MODAL */}
      {isModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {modalType === 'add' ? 'Add New Role' : 'Edit Role'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Role Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      placeholder="e.g., Manager"
                      defaultValue={selectedRole?.role_name || ''}
                      required
                      ref={input => roleInputs.current.roleName = input}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control rounded-3"
                      rows="2"
                      placeholder="Optional description"
                      defaultValue={selectedRole?.role_description || ''}
                      ref={input => roleInputs.current.description = input}
                    ></textarea>
                  </div>

                  <h6 className="fw-bold mt-4 mb-3">Permissions</h6>
                  <div className="row g-3">
                    {['dashboard', 'members', 'staff', 'finance', 'settings'].map(perm => (
                      <div className="col-6 col-md-4" key={perm}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`perm_${perm}`}
                            defaultChecked={selectedRole?.permissions_json?.[perm] || false}
                            ref={input => {
                              if (!roleInputs.current.permissions) roleInputs.current.permissions = {};
                              roleInputs.current.permissions[perm] = input;
                            }}
                          />
                          <label className="form-check-label" htmlFor={`perm_${perm}`}>
                            {perm.charAt(0).toUpperCase() + perm.slice(1)}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2 w-100 w-sm-auto"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn w-100 w-sm-auto"
                      style={{
                        backgroundColor: '#6EB2CC',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '500',
                      }}
                      onClick={() => {
                        const roleName = roleInputs.current.roleName?.value.trim();
                        const description = roleInputs.current.description?.value.trim();
                        const permissions = {
                          dashboard: roleInputs.current.permissions?.dashboard?.checked || false,
                          members: roleInputs.current.permissions?.members?.checked || false,
                          staff: roleInputs.current.permissions?.staff?.checked || false,
                          finance: roleInputs.current.permissions?.finance?.checked || false,
                          settings: roleInputs.current.permissions?.settings?.checked || false,
                        };

                        if (!roleName) {
                          alert("Role name is required!");
                          return;
                        }

                        if (selectedRole) {
                          setRoles(prev => prev.map(r => r.id === selectedRole.id ? { ...r, role_name: roleName, role_description: description, permissions_json: permissions } : r));
                          alert("Role updated successfully!");
                        } else {
                          const newRole = {
                            id: Math.max(...roles.map(r => r.id), 0) + 1,
                            role_name: roleName,
                            role_description: description,
                            permissions_json: permissions
                          };
                          setRoles(prev => [...prev, newRole]);
                          alert("Role created successfully!");
                        }

                        closeModal();
                      }}
                    >
                      {selectedRole ? 'Update Role' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
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
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteModal}
                ></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete role <strong>"{selectedRole?.role_name}"</strong>.<br />
                  This action cannot be undone.
                </p>
                {selectedRole?.role_name === "Admin" && (
                  <p className="text-danger small">
                    <i className="fas fa-lock me-1"></i> Admin role cannot be deleted.
                  </p>
                )}
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 w-100 w-sm-auto"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
                {selectedRole?.role_name !== "Admin" && (
                  <button
                    type="button"
                    className="btn btn-danger px-4 w-100 w-sm-auto"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .action-btn {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .action-btn {
            width: 32px;
            height: 32px;
          }
        }
        
        /* Make form controls responsive */
        .form-control, .form-select, .form-check {
          width: 100%;
        }
        
        /* Ensure modal content is responsive */
        @media (max-width: 576px) {
          .modal-dialog {
            margin: 0.5rem;
            max-width: 95%;
          }
          .modal-content {
            border-radius: 0.5rem;
          }
          .permission-checkbox {
            margin-bottom: 0.5rem;
          }
        }
        
        /* Responsive table */
        @media (max-width: 768px) {
          .table thead th {
            font-size: 0.9rem;
          }
          .table td {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageRoles;