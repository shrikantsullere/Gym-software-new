import React, { useState, useRef, useEffect } from 'react';
import { FaEye, FaEdit, FaTrashAlt, FaPlus, FaSearch, FaFilter, FaCaretDown } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import GetAdminId from '../../../Api/GetAdminId';
import axiosInstance from "../../../Api/axiosInstance";
import ImageCropper from '../../../Components/ImageCropper';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

const ManageStaff = () => {
  const adminId = GetAdminId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'Receptionist',
    gender: 'Male',
    dateOfBirth: '',
    joinDate: new Date().toISOString().split('T')[0],
    exitDate: '',
  });

  const [staffStatus, setStaffStatus] = useState('Active');
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  // Image cropping states
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperMode, setCropperMode] = useState(null); // 'add' or 'edit'

  const customColor = '#6EB2CC';
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const roleIds = {
    'generaltrainer': 6,
    'personaltrainer': 5,
    'Receptionist': 7,
    'Housekeeping': 8,
    'sales_agent': 10
  };

  const normalizeStaffItem = (item) => {
    if (!item) return null;
    return {
      id: item.staffId ?? item.id,
      userId: item.userId ?? null,
      fullName: item.fullName ?? item.name ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      roleId: item.roleId ?? null,
      branchId: item.branchId ?? null,
      adminId: item.adminId ?? null,
      gender: item.gender ?? null,
      dateOfBirth: item.dateOfBirth ?? item.dob ?? null,
      joinDate: item.joinDate ?? null,
      exitDate: item.exitDate ?? null,
      profilePhoto: item.profilePhoto ?? null,
      status: item.status ?? null,
      _raw: item,
    };
  };

  const getRoleName = (roleId) => {
    const roleEntry = Object.entries(roleIds).find(([name, id]) => id === roleId);
    return roleEntry ? roleEntry[0] : 'Unknown';
  };

  // 👇 NEW: Reusable fetch function
  const fetchStaffList = async () => {
    setStaffLoading(true);
    try {
      const response = await axiosInstance.get(`/staff/admin/${adminId}`);
      if (response.data?.success && response.data.staff) {
        const staffArr = Array.isArray(response.data.staff) ? response.data.staff : [response.data.staff];
        const normalized = staffArr.map(normalizeStaffItem);
        setStaff(normalized);
      } else if (Array.isArray(response.data)) {
        setStaff(response.data.map(normalizeStaffItem));
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      alert("Failed to load staff data.");
      setStaff([]);
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch staff on mount
  useEffect(() => {
    fetchStaffList();
  }, [adminId]);

  // Fetch branches
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setBranchesLoading(false);
      return;
    }
    const fetchBranches = async () => {
      try {
        const response = await axiosInstance.get(`/branches/by-admin/${adminId}`);
        let branchList = [];
        if (Array.isArray(response.data)) {
          branchList = response.data;
        } else if (response.data?.branch) {
          branchList = [response.data.branch];
        } else if (response.data?.branches && Array.isArray(response.data.branches)) {
          branchList = response.data.branches;
        } else {
          branchList = [response.data];
        }
        const normalized = branchList.map(b => ({
          id: b.id,
          name: b.name || `Branch ${b.id}`,
        }));
        setBranches(normalized);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([{ id: 1, name: "Default Branch" }]);
      } finally {
        setBranchesLoading(false);
      }
    };
    fetchBranches();
  }, [adminId]);

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "Unknown";
  };

  const filteredStaff = staff.filter(member =>
    (member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone?.includes(searchQuery)) &&
    (roleFilter === 'All' || member.roleId === roleIds[roleFilter]) &&
    (statusFilter === 'All' || member.status === statusFilter)
  );

  const exportToExcel = () => {
    if (filteredStaff.length === 0) {
      alert("No data available to export.");
      return;
    }
    const exportData = filteredStaff.map((m) => ({
      "Staff Name": m.fullName,
      Phone: m.phone,
      Email: m.email || "N/A",
      Role: getRoleName(m.roleId) || "N/A",
      "Join Date": m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "N/A",
      Status: m.status || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Auto-fit columns
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => (row[key] ? row[key].toString().length : 0))
      ) + 2
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");
    XLSX.writeFile(workbook, "Staff_Data.xlsx");
  };

  const exportToPDF = () => {
    if (filteredStaff.length === 0) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Staff Data", 14, 15);

    const tableColumn = ["Name", "Phone", "Email", "Role", "Join Date", "Status"];
    const tableRows = [];

    filteredStaff.forEach((m) => {
      const rowData = [
        m.fullName,
        m.phone,
        m.email || "N/A",
        getRoleName(m.roleId) || "N/A",
        m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "N/A",
        m.status || "N/A",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [110, 178, 204] },
    });
    doc.save("Staff_Data.pdf");
  };

  const getInitials = (fullName) => {
    if (!fullName) return "U";
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  const getInitialColor = (initials) => {
    const colors = ['#6EB2CC', '#F4B400', '#E84A5F', '#4ECDC4', '#96CEB4', '#FFEAA7'];
    return colors[initials.charCodeAt(0) % colors.length];
  };

  const handleAddNew = () => {
    setModalType('add');
    setSelectedStaff(null);
    setStaffStatus('Active');
    setProfileFile(null);
    setProfilePreview(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: 'Receptionist',
      gender: 'Male',
      dateOfBirth: '',
      joinDate: new Date().toISOString().split('T')[0],
      exitDate: '',
    });
    setIsModalOpen(true);
  };

  const handleView = (staffMember) => {
    setModalType('view');
    setSelectedStaff(staffMember);
    setStaffStatus(staffMember.status || 'Active');
    setProfilePreview(staffMember.profilePhoto || null);

    setFormData({
      fullName: staffMember.fullName || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      password: '',
      role: getRoleName(staffMember.roleId) || 'Receptionist',
      gender: staffMember.gender || 'Male',
      dateOfBirth: staffMember.dateOfBirth ? new Date(staffMember.dateOfBirth).toISOString().split('T')[0] : '',
      joinDate: staffMember.joinDate ? new Date(staffMember.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      exitDate: staffMember.exitDate ? new Date(staffMember.exitDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (staffMember) => {
    setModalType('edit');
    setSelectedStaff(staffMember);
    setStaffStatus(staffMember.status || 'Active');
    setProfilePreview(staffMember.profilePhoto || null);
    setProfileFile(null);

    setFormData({
      fullName: staffMember.fullName || '',
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      password: '',
      role: getRoleName(staffMember.roleId) || 'Receptionist',
      gender: staffMember.gender || 'Male',
      dateOfBirth: staffMember.dateOfBirth ? new Date(staffMember.dateOfBirth).toISOString().split('T')[0] : '',
      joinDate: staffMember.joinDate ? new Date(staffMember.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      exitDate: staffMember.exitDate ? new Date(staffMember.exitDate).toISOString().split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (staffMember) => {
    setSelectedStaff(staffMember);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedStaff) {
      try {
        const response = await axiosInstance.delete(`/staff/delete/${selectedStaff.id}`);
        if (response.data?.success) {
          alert(`Staff member "${selectedStaff.fullName}" has been deleted.`);
          await fetchStaffList(); // ✅ Auto-refresh
        } else {
          alert('Failed to delete staff member.');
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete staff member.");
      }
    }
    setIsDeleteModalOpen(false);
    setSelectedStaff(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
    setProfileFile(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStaff(null);
  };

  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen, isDeleteModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleFilterOpen && !event.target.closest('.role-filter-dropdown')) setRoleFilterOpen(false);
      if (statusFilterOpen && !event.target.closest('.status-filter-dropdown')) setStatusFilterOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [roleFilterOpen, statusFilterOpen]);

  const getStatusBadge = (status) => {
    const badgeClasses = {
      Active: "bg-success-subtle text-success-emphasis",
      Inactive: "bg-danger-subtle text-danger-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${badgeClasses[status] || 'bg-secondary'} px-3 py-1`}>
        {status || 'Active'}
      </span>
    );
  };

  const getRoleBadge = (roleId) => {
    const roleName = getRoleName(roleId);
    const roleColors = {
      Manager: "bg-info-subtle text-info-emphasis",
      generaltrainer: "bg-warning-subtle text-warning-emphasis",
      personaltrainer: "bg-primary-subtle text-primary-emphasis",
      Receptionist: "bg-secondary-subtle text-secondary-emphasis",
      Housekeeping: "bg-success-subtle text-success-emphasis",
      sales_agent: "bg-dark-subtle text-dark-emphasis"
    };
    return (
      <span className={`badge rounded-pill ${roleColors[roleName] || 'bg-light'} px-3 py-1`}>
        {roleName === 'generaltrainer' ? 'General Trainer' :
          roleName === 'personaltrainer' ? 'Personal Trainer' :
            roleName === 'sales_agent' ? 'Sales Agent' :
              roleName}
      </span>
    );
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'add': return 'Add New Staff Member';
      case 'edit': return 'Edit Staff Member';
      case 'view': return 'View Staff Member';
      default: return 'Staff Management';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      
      // Create a preview URL and show cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result);
        setCropperMode(modalType === 'add' ? 'add' : 'edit');
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCropComplete = (croppedImageData) => {
    const { blob, url } = croppedImageData;
    if (!blob) {
      console.error('No blob received from cropper');
      return;
    }
    // Convert blob to file
    const croppedFile = new File([blob], 'profile-image.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Create preview URL
    const previewUrl = url || URL.createObjectURL(blob);
    
    setProfileFile(croppedFile);
    setProfilePreview(previewUrl);
    
    setShowCropper(false);
    setCropperImage(null);
    setCropperMode(null);
  };

  // Handle cropper cancel
  const handleCropperCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
    setCropperMode(null);
  };

  const handleFormSubmit = async () => {
    if (!adminId) {
      alert("Admin ID not found.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('roleId', roleIds[formData.role]);
    formDataToSend.append('adminId', adminId);
    formDataToSend.append('gender', formData.gender);
    formDataToSend.append('dateOfBirth', formData.dateOfBirth || '');
    formDataToSend.append('joinDate', formData.joinDate || '');
    formDataToSend.append('exitDate', formData.exitDate || '');
    formDataToSend.append('status', staffStatus);

    if (modalType === 'add') {
      if (!formData.password) {
        alert("Password is required.");
        return;
      }
      formDataToSend.append('password', formData.password);
    }

    if (profileFile) {
      formDataToSend.append('profilePhoto', profileFile);
    } else if (modalType === 'edit' && selectedStaff?.profilePhoto) {
      formDataToSend.append('profilePhoto', selectedStaff.profilePhoto);
    }

    try {
      let response;
      if (modalType === 'add') {
        response = await axiosInstance.post('/staff/create', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else if (modalType === 'edit') {
        response = await axiosInstance.put(`/staff/update/${selectedStaff.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response?.data?.success) {
        alert(`${modalType === 'add' ? 'Added' : 'Updated'} successfully!`);
        await fetchStaffList(); // ✅ Auto-refresh after add/edit
        closeModal();
      } else {
        alert('Operation failed. Please try again.');
      }
    } catch (error) {
      console.error("Submission error:", error);
      // Show exact backend validation message (e.g., "Email already exists", "Phone number already registered")
      const backendMsg = error.response?.data?.message;
      alert(backendMsg || `Failed to ${modalType === 'add' ? 'add' : 'update'} staff. Please try again.`);
    }
  };

  const clearFilters = () => {
    setRoleFilter('All');
    setStatusFilter('All');
  };

  const exportData = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Role', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredStaff.map(member => [
        member.id,
        member.fullName,
        member.email,
        member.phone,
        getRoleName(member.roleId),
        member.status || 'Active'
      ].map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid p-2 p-md-4">
      {/* ... Rest of JSX remains exactly the same ... */}

      {/* Header */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold fs-4 fs-md-3">Staff Management</h2>
          <p className="text-muted mb-0 fs-6">Manage all gym staff members, their roles, and compensation.</p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <div className="d-flex align-items-center justify-content-lg-end gap-2 flex-wrap">
            <div className="dropdown">
              <button
                className="btn text-white dropdown-toggle mb-2 mb-sm-0"
                type="button"
                id="exportStaffDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ backgroundColor: "#28a745", borderRadius: "8px", fontWeight: 600, padding: "8px 20px" }}
              >
                <Download size={18} className="me-2" />
                <span className="d-none d-sm-inline">Export Data</span>
                <span className="d-sm-none">Export</span>
              </button>
              <ul className="dropdown-menu shadow-sm" aria-labelledby="exportStaffDropdown" style={{ borderRadius: "8px", border: "none" }}>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToExcel}>
                    <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToPDF}>
                    <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                  </button>
                </li>
              </ul>
            </div>
            <button
              className="btn text-white mb-2 mb-sm-0"
              style={{
                backgroundColor: customColor,
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '1rem',
                fontWeight: '500',
              }}
              onClick={handleAddNew}
            >
              <FaPlus className="me-2" /> Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="row mb-3 mb-md-4 g-3 align-items-center">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <FaSearch style={{ color: customColor }} />
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="d-flex flex-wrap gap-2 justify-content-md-end">
            <div className="role-filter-dropdown">
              <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                onClick={() => setRoleFilterOpen(!roleFilterOpen)}
              >
                <span>Role</span>
                <FaCaretDown className="ms-1" />
              </button>
              <div className={`dropdown-menu ${roleFilterOpen ? 'show' : ''}`}>
                <button
                  className={`dropdown-item ${roleFilter === 'All' ? 'active' : ''}`}
                  onClick={() => { setRoleFilter('All'); setRoleFilterOpen(false); }}
                >
                  All Roles
                </button>
                {Object.keys(roleIds).map(role => (
                  <button
                    key={role}
                    className={`dropdown-item ${roleFilter === role ? 'active' : ''}`}
                    onClick={() => { setRoleFilter(role); setRoleFilterOpen(false); }}
                  >
                    {role === 'generaltrainer' ? 'General Trainer' :
                      role === 'personaltrainer' ? 'Personal Trainer' :
                        role === 'sales_agent' ? 'Sales Agent' :
                          role}
                  </button>
                ))}
              </div>
            </div>
            <div className="status-filter-dropdown">
              <button
                className="btn btn-outline-secondary btn-sm dropdown-toggle"
                type="button"
                onClick={() => setStatusFilterOpen(!statusFilterOpen)}
              >
                <span>Status</span>
                <FaCaretDown className="ms-1" />
              </button>
              <div className={`dropdown-menu ${statusFilterOpen ? 'show' : ''}`}>
                <button className={`dropdown-item ${statusFilter === 'All' ? 'active' : ''}`} onClick={() => { setStatusFilter('All'); setStatusFilterOpen(false); }}>All Status</button>
                <button className={`dropdown-item ${statusFilter === 'Active' ? 'active' : ''}`} onClick={() => { setStatusFilter('Active'); setStatusFilterOpen(false); }}>Active</button>
                <button className={`dropdown-item ${statusFilter === 'Inactive' ? 'active' : ''}`} onClick={() => { setStatusFilter('Inactive'); setStatusFilterOpen(false); }}>Inactive</button>
              </div>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="d-none d-md-block">
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th>STAFF ID</th>
                  <th>PHOTO</th>
                  <th>NAME</th>
                  <th>ROLE</th>
                  <th className="d-none d-lg-table-cell">EMAIL</th>
                  <th className="d-none d-lg-table-cell">PHONE</th>
                  <th>STATUS</th>
                  <th className="text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <span className="badge bg-light text-secondary border fw-medium">
                        {member.id}
                      </span>
                    </td>
                    <td>
                      {member.profilePhoto ? (
                        <img
                          src={member.profilePhoto.startsWith('http') ? member.profilePhoto : `${axiosInstance.defaults.baseURL}/${member.profilePhoto}`}
                          alt={member.fullName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle text-white d-flex align-items-center justify-content-center"
                          style={{
                            width: '40px',
                            height: '40px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            backgroundColor: getInitialColor(getInitials(member.fullName)),
                          }}
                        >
                          {getInitials(member.fullName)}
                        </div>
                      )}
                    </td>
                    <td><strong>{member.fullName}</strong></td>
                    <td>{getRoleBadge(member.roleId)}</td>
                    <td className="d-none d-lg-table-cell">{member.email}</td>
                    <td className="d-none d-lg-table-cell">{member.phone}</td>
                    <td>{getStatusBadge(member.status)}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center flex-nowrap" style={{ gap: '4px' }}>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(member)}><FaEye size={14} /></button>
                        <button className="btn btn-sm" style={{ borderColor: customColor, color: customColor }} onClick={() => handleEdit(member)}><FaEdit size={14} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(member)}><FaTrashAlt size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="d-md-none">
        {filteredStaff.map((member) => (
          <div className="card shadow-sm border-0 mb-3" key={member.id}>
            <div className="card-body p-3">
              <div className="d-flex align-items-start mb-3">
                {member.profilePhoto ? (
                  <img
                    src={member.profilePhoto.startsWith('http') ? member.profilePhoto : `${axiosInstance.defaults.baseURL}/${member.profilePhoto}`}
                    alt=""
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                  />
                ) : (
                  <div
                    className="rounded-circle text-white d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '60px',
                      height: '60px',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      backgroundColor: getInitialColor(getInitials(member.fullName)),
                    }}
                  >
                    {getInitials(member.fullName)}
                  </div>
                )}
                <div className="flex-grow-1">
                  <h5 className="mb-1">{member.fullName}</h5>
                  <p className="text-muted small mb-2">ID: {member.id}</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {getRoleBadge(member.roleId)}
                    {getStatusBadge(member.status)}
                  </div>
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-12"><small className="text-muted d-block">Email</small><span>{member.email}</span></div>
                <div className="col-12"><small className="text-muted d-block">Phone</small><span>{member.phone}</span></div>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={() => handleView(member)}><FaEye size={14} /></button>
                <button className="btn btn-sm" style={{ borderColor: customColor, color: customColor }} onClick={() => handleEdit(member)}><FaEdit size={14} /></button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(member)}><FaTrashAlt size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN MODAL */}
      {isModalOpen && (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold">{getModalTitle()}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body p-3 p-md-4">
                {modalType === 'view' ? (
                  <div>
                    <div className="text-center mb-4">
                      {profilePreview ? (
                        <img
                          src={profilePreview.startsWith('http') ? profilePreview : `${axiosInstance.defaults.baseURL}/${profilePreview}`}
                          alt="Preview"
                          style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eee' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle text-white d-flex align-items-center justify-content-center mx-auto"
                          style={{
                            width: '110px',
                            height: '110px',
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            backgroundColor: getInitialColor(getInitials(formData.fullName)),
                          }}
                        >
                          {getInitials(formData.fullName)}
                        </div>
                      )}
                      <h4 className="mt-3 mb-1 fw-bold">{formData.fullName}</h4>
                      <div className="mb-2">
                        <span className="badge bg-secondary px-3 py-1.5 fs-7">Staff ID: {selectedStaff?.id}</span>
                      </div>
                      <div className="d-flex justify-content-center gap-2">
                        {getRoleBadge(selectedStaff?.roleId)}
                        {getStatusBadge(staffStatus)}
                      </div>
                    </div>

                    <hr className="my-4 text-muted" />

                    <h6 className="fw-bold mb-3 text-secondary">Basic Information</h6>
                    <div className="row mb-4 g-3">
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Email Address</small>
                          <span className="fw-medium text-dark">{formData.email || '—'}</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Phone Number</small>
                          <span className="fw-medium text-dark">{formData.phone || '—'}</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Gender</small>
                          <span className="fw-medium text-dark">{formData.gender || '—'}</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Date of Birth</small>
                          <span className="fw-medium text-dark">{formatDate(formData.dateOfBirth)}</span>
                        </div>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-3 text-secondary">Job Details</h6>
                    <div className="row mb-4 g-3">
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Role</small>
                          <span className="fw-medium text-dark">{formData.role === 'generaltrainer' ? 'General Trainer' : formData.role === 'personaltrainer' ? 'Personal Trainer' : formData.role === 'sales_agent' ? 'Sales Agent' : formData.role}</span>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="p-3 bg-light rounded-3">
                          <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Join Date</small>
                          <span className="fw-medium text-dark">{formatDate(formData.joinDate)}</span>
                        </div>
                      </div>
                      {formData.exitDate && (
                        <div className="col-12 col-md-6">
                          <div className="p-3 bg-light rounded-3">
                            <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>Exit Date</small>
                            <span className="fw-medium text-dark">{formatDate(formData.exitDate)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="button" className="btn btn-secondary px-4 py-2 w-100 w-sm-auto" onClick={closeModal}>Close</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} autoComplete="off">
                    <div className="text-center mb-4">
                      {profilePreview ? (
                        <img
                          src={profilePreview.startsWith('http') ? profilePreview : `${axiosInstance.defaults.baseURL}/${profilePreview}`}
                          alt="Preview"
                          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' }}
                        />
                      ) : (
                        <div
                          className="rounded-circle text-white d-flex align-items-center justify-content-center mx-auto"
                          style={{
                            width: '100px',
                            height: '100px',
                            fontSize: '2rem',
                            fontWeight: 'bold',
                            backgroundColor: getInitialColor(getInitials(formData.fullName)),
                          }}
                        >
                          {getInitials(formData.fullName)}
                        </div>
                      )}
                      {modalType === 'edit' && selectedStaff?.id && (
                        <div className="mt-2">
                          <span className="badge bg-secondary px-3 py-1">Staff ID: {selectedStaff.id}</span>
                        </div>
                      )}
                    </div>

                    <h6 className="fw-bold mb-3">Basic Information</h6>
                    <div className="row mb-3 g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Full Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control rounded-3"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          autoComplete="new-email"
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Phone <span className="text-danger">*</span></label>
                        <input
                          type="tel"
                          className="form-control rounded-3"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Password {modalType === 'add' && <span className="text-danger">*</span>}</label>
                        <input
                          type="password"
                          className="form-control rounded-3"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder={modalType === 'edit' ? "Leave blank to keep current" : ""}
                          autoComplete="new-password"
                          required={modalType === 'add'}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Gender <span className="text-danger">*</span></label>
                        <select
                          className="form-select rounded-3"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Date of Birth <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Profile Photo</label>
                        <input
                          type="file"
                          className="form-control rounded-3"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select rounded-3"
                          value={staffStatus}
                          onChange={(e) => setStaffStatus(e.target.value)}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <h6 className="fw-bold mb-3">Job Details</h6>
                    <div className="row mb-3 g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label">Role <span className="text-danger">*</span></label>
                        <select
                          className="form-select rounded-3"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                        >
                          {Object.keys(roleIds).map(role => (
                            <option key={role} value={role}>
                              {role === 'generaltrainer' ? 'General Trainer' :
                                role === 'personaltrainer' ? 'Personal Trainer' :
                                  role === 'sales_agent' ? 'Sales Agent' :
                                    role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label">Join Date <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          name="joinDate"
                          value={formData.joinDate}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      {modalType !== 'add' && (
                        <div className="col-12 col-md-6">
                          <label className="form-label">Exit Date</label>
                          <input
                            type="date"
                            className="form-control rounded-3"
                            name="exitDate"
                            value={formData.exitDate}
                            onChange={handleInputChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4">
                      <button type="button" className="btn btn-outline-secondary px-4 py-2 w-100 w-sm-auto" onClick={closeModal}>Cancel</button>
                      <button type="submit" className="btn w-100 w-sm-auto" style={{ backgroundColor: customColor, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '500' }}>
                        {modalType === 'add' ? 'Add Staff' : 'Update Staff'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="modal fade show" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeDeleteModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header border-0 pb-0" style={{ backgroundColor: customColor, color: 'white' }}>
                <h5 className="modal-title fw-bold">Confirm Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body text-center py-4">
                <div className="display-6 text-danger mb-3"><i className="fas fa-exclamation-triangle"></i></div>
                <h5>Are you sure?</h5>
                <p className="text-muted">
                  This will permanently delete <strong>{selectedStaff?.fullName}</strong>.<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button type="button" className="btn btn-outline-secondary px-4 w-100 w-sm-auto" onClick={closeDeleteModal}>Cancel</button>
                <button type="button" className="btn btn-danger px-4 w-100 w-sm-auto" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .role-filter-dropdown, .status-filter-dropdown {
          position: relative;
        }
        .dropdown-menu {
          min-width: 200px;
          z-index: 1050;
        }
        .dropdown-item.active {
          background-color: ${customColor} !important;
          color: white !important;
        }
      `}</style>
      
      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropperCancel}
        />
      )}
    </div>
  );
};

export default ManageStaff;