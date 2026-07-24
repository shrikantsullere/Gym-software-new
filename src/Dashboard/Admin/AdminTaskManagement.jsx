import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Check, X
} from 'react-bootstrap-icons';
import axiosInstance from '../../Api/axiosInstance';
import GetAdminId from '../../Api/GetAdminId';
import { FaTrash } from 'react-icons/fa';

const AdminTaskManagement = () => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const adminId = GetAdminId();
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user && (user.roleName === 'Admin' || user.roleName === 'Superadmin');
  const loggedInUserId = user ? user.id : null;

  const [taskForm, setTaskForm] = useState({
    assignedTo: '', // staffId
    roleId: '', // department id
    taskTitle: '',
    description: '',
    dueDate: '',
    priority: 'Medium'
  });

  const departments = [
    { id: 6, name: 'General Trainer' },
    { id: 5, name: 'Personal Trainer' },
    { id: 10, name: 'Sales Agent' },
    { id: 7, name: 'Receptionist' },
    { id: 2, name: 'Admin' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("AdminTaskManagement fetchData: adminId =", adminId);

        // Fetch staff
        const staffResponse = await axiosInstance.get(`/staff/admin/${adminId}`);
        console.log("Staff fetched:", staffResponse.data);
        const staff = staffResponse.data.staff || [];
        setStaffMembers(staff.filter(s => s.roleId !== 8));

        // Fetch branches
        const branchesResponse = await axiosInstance.get(`/branches/by-admin/${adminId}`);
        console.log("Branches fetched:", branchesResponse.data);
        setBranches(branchesResponse.data.branches || []);

        // Fetch tasks conditionally
        let tasksResponse;
        if (isAdmin) {
          tasksResponse = await axiosInstance.get(`/housekeepingtask/tasks/admin/${adminId}`);
        } else {
          tasksResponse = await axiosInstance.get(`/housekeepingtask/asignedto/${loggedInUserId}`);
        }
        console.log("Tasks fetched:", tasksResponse.data);

        if (tasksResponse.data.success) {
          const transformed = (tasksResponse.data.data || []).map(task => ({
            id: task.id,
            assignedTo: task.assignedTo,
            roleId: task.roleId,
            role: task.role,
            title: task.taskTitle,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
            status: task.status || 'Pending'
          }));
          setTasks(transformed);
        } else {
          setError('Failed to fetch tasks');
        }
      } catch (err) {
        console.error("Error in AdminTaskManagement fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    if (adminId) fetchData();
  }, [adminId]);

  const getStaffName = (task) => {
    if (task.roleId && task.role) {
      return `${task.role.name} Department`;
    }
    const staff = staffMembers.find(s => s.staffId === task.assignedTo);
    return staff ? staff.fullName : 'Unknown';
  };


  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'Completed': 'success',
      'Approved': 'success',
      'Assigned': 'info',
      'Review Pending': 'warning',
      'Pending': 'warning',
      'Rejected': 'danger',
      'In Progress': 'primary'
    };
    return map[status] || 'secondary';
  };

  const handleTaskFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await axiosInstance.delete(`/housekeepingtask/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(t => t.id !== taskId));
        alert('Task deleted successfully!');
      } else {
        alert(response.data.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error deleting task');
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Approved'
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Approved' } : t));
        alert('Task approved!');
      } else {
        alert('Failed to approve task');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Error approving task');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Assigned' // Return to staff
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Assigned' } : t));
        alert('Task rejected and sent back to staff!');
      } else {
        alert('Failed to reject task');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Error rejecting task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const response = await axiosInstance.put(`/housekeepingtask/status/${taskId}`, {
        status: 'Review Pending'
      });
      if (response.data.success) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'Review Pending' } : t));
        alert('Task marked as complete and sent to Admin for review!');
      } else {
        alert('Failed to update task status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating task status');
    }
  };

  const handleCreateTask = async () => {
    const { assignedTo, roleId, taskTitle, dueDate, priority, description } = taskForm;

    if (!roleId || !taskTitle || !dueDate) {
      alert('Please fill all required fields: Department, Title, and Due Date.');
      return;
    }

    try {
      const payload = {
        assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
        roleId: parseInt(roleId, 10),
        adminId: parseInt(adminId, 10),
        taskTitle,
        description: description || '',
        dueDate, // "YYYY-MM-DD" format
        priority // API expects "High", "Medium", etc. (case-sensitive as per your example)
      };
      console.log("AdminTaskManagement: Creating task with payload:", payload);

      const response = await axiosInstance.post(`/housekeepingtask/create`, payload);

      if (response.data.success) {
        const newTask = {
          id: response.data.data.id,
          assignedTo: response.data.data.assignedTo,
          roleId: response.data.data.roleId,
          role: departments.find(d => d.id === response.data.data.roleId),
          title: response.data.data.taskTitle,
          description: response.data.data.description,
          dueDate: response.data.data.dueDate,
          priority: response.data.data.priority.charAt(0).toUpperCase() + response.data.data.priority.slice(1),
          status: response.data.data.status || 'Assigned'
        };

        setTasks([...tasks, newTask]);

        // Reset form
        setTaskForm({
          assignedTo: '',
          roleId: '',
          taskTitle: '',
          description: '',
          dueDate: '',
          priority: 'Medium'
        });
        setShowTaskModal(false);
        alert('Task created successfully!');
      } else {
        alert(response.data.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('Error creating task: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = () => {
    if (tasks.length === 0) {
      alert("No data available to export");
      return;
    }

    // Define CSV headers
    const headers = ["Assigned To", "Task", "Description", "Due Date", "Priority", "Status"];

    // Map data rows
    const rows = tasks.map(task => {
      // Find assigned to label
      let assignedToLabel = 'Unknown';
      if (task.roleId && task.role) {
        assignedToLabel = `${task.role.name || task.role} Department`;
      } else {
        const staff = staffMembers.find(s => s.staffId === task.assignedTo);
        assignedToLabel = staff ? staff.fullName : 'Unknown';
      }

      return [
        assignedToLabel,
        task.title || '',
        task.description || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.priority || '',
        task.status || ''
      ];
    });

    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tasks_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTaskModal = () => {
    if (!showTaskModal) return null;

    return (
      <>
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTaskModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select
                        className="form-select"
                        name="roleId"
                        value={taskForm.roleId}
                        onChange={(e) => {
                          setTaskForm(prev => ({
                            ...prev, 
                            roleId: e.target.value, 
                            assignedTo: '' // Reset assignedTo when department changes
                          }));
                        }}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Staff Member (Optional)</label>
                      <select
                        className="form-select"
                        name="assignedTo"
                        value={taskForm.assignedTo}
                        onChange={handleTaskFormChange}
                        disabled={!taskForm.roleId}
                      >
                        <option value="">Select Staff Member</option>
                        {staffMembers
                          .filter(staff => staff.roleId === parseInt(taskForm.roleId))
                          .map(staff => (
                            <option key={staff.staffId || staff.id} value={staff.staffId || staff.id}>
                              {staff.fullName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Task Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="taskTitle"
                        value={taskForm.taskTitle}
                        onChange={handleTaskFormChange}
                        placeholder="e.g. Clean locker room"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Due Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dueDate"
                        value={taskForm.dueDate}
                        onChange={handleTaskFormChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        name="priority"
                        value={taskForm.priority}
                        onChange={handleTaskFormChange}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={taskForm.description}
                        onChange={handleTaskFormChange}
                        rows="2"
                        placeholder="Optional details"
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateTask}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop show"></div>
      </>
    );
  };

  if (loading) {
    return <div className="container-fluid py-4">Loading data...</div>;
  }

  if (error) {
    return <div className="container-fluid py-4 text-danger">{error}</div>;
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Task Management</h2>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success d-flex align-items-center"
            onClick={handleExport}
          >
            Export CSV
          </button>
          {isAdmin && (
            <button
              className="btn btn-primary d-flex align-items-center"
              onClick={() => setShowTaskModal(true)}
            >
              <Plus size={18} className="me-1" /> Create Task
            </button>
          )}
        </div>
      </div>

      {/* All Tasks Table */}
      <div className="table-responsive mb-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Assigned To</th>
              <th>Task</th>
              <th>Due Date</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No tasks found</td>
              </tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id}>
                  <td>{getStaffName(task)}</td>
                  <td>{task.title}</td>
                  <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge bg-${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge bg-${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {isAdmin && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete Task"
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending Tasks Section */}
      <div>
        <h4 className="mb-3">{isAdmin ? "Pending Tasks (Approval Required)" : "My Actionable Tasks"}</h4>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Assigned To</th>
                <th>Task</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.filter(task => {
                const s = (task.status || '').toLowerCase();
                if (isAdmin) {
                  return s === 'pending' || s === 'review pending' || s === 'pending approval' || s === 'in progress';
                } else {
                  return s === 'assigned' || s === 'rejected' || s === 'pending';
                }
              }).length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted">No actionable tasks</td>
                </tr>
              ) : (
                tasks
                  .filter(task => {
                    const s = (task.status || '').toLowerCase();
                    if (isAdmin) {
                      return s === 'pending' || s === 'review pending' || s === 'pending approval' || s === 'in progress';
                    } else {
                      return s === 'assigned' || s === 'rejected' || s === 'pending';
                    }
                  })
                  .map(task => (
                    <tr key={task.id}>
                      <td>{getStaffName(task)}</td>
                      <td>{task.title}</td>
                      <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge bg-${getStatusClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          {isAdmin ? (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleApproveTask(task.id)}
                                title="Approve"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger ms-1"
                                onClick={() => handleRejectTask(task.id)}
                                title="Reject"
                              >
                                <X size={14} /> Reject
                              </button>
                            </>
                          ) : (
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleCompleteTask(task.id)}
                                title="Mark as Complete"
                              >
                                <Check size={14} /> Mark Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderTaskModal()}
    </div>
  );
};

export default AdminTaskManagement;