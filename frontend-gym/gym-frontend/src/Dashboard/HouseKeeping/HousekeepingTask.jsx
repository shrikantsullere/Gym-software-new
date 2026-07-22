import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { ClipboardCheck, PlayFill } from 'react-bootstrap-icons';
import axiosInstance from '../../Api/axiosInstance';

const HousekeepingTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loadingTaskId, setLoadingTaskId] = useState(null); // For loading state on button


  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const userId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get(`housekeepingtask/asignedto/${userId}`);
        setTasks(response.data.data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
      }
    };

    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  // Format time (08:00)
  const formatTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date (04/12/2025)
  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <span className="badge bg-success">Completed</span>;
      case 'approved':
        return <span className="badge bg-info">Approved</span>;
      case 'pending':
        return <span className="badge bg-warning">Pending</span>;
      default:
        return <span className="badge bg-secondary">{status || 'Unknown'}</span>;
    }
  };

  // ✅ Handle task completion
  const handleCompleteTask = async (taskId, originalStatus) => {
    // Set loading
    setLoadingTaskId(taskId);

    // Optimistically update UI
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'Review Pending' } : task
    );
    setTasks(updatedTasks);

    try {
      // 🔁 Call your backend to mark as completed
      // Adjust the endpoint if needed (e.g., /update, /status, etc.)
      await axiosInstance.put(`housekeepingtask/status/${taskId}`, {
        status: 'Review Pending'
      });
      // Success: UI already updated
    } catch (error) {
      console.error('Failed to complete task:', error);
      // ❌ Revert on error
      const revertedTasks = tasks.map((task) =>
        task.id === taskId ? { ...task, status: originalStatus } : task
      );
      setTasks(revertedTasks);
      // Optional: show toast error
      alert('Failed to update task. Please try again.');
    } finally {
      setLoadingTaskId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Task Checklist</h2>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 d-flex align-items-center">
                <ClipboardCheck className="me-2" /> My Cleaning Tasks (Today)
              </h5>
              <span className="badge bg-info">{tasks.length} Task{tasks.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="card-body">
              {tasks.length === 0 ? (
                <p className="text-muted text-center">No tasks assigned.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Task Title</th>
                        <th>Description</th>
                        <th>Due Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.taskTitle || '—'}</td>
                          <td>{task.description || '—'}</td>
                          <td className="text-nowrap">
                            {formatDate(task.dueDate)} {formatTime(task.dueDate)}
                          </td>
                          <td>{getStatusBadge(task.status)}</td>
                          <td>
                            {task.status?.toLowerCase() !== 'approved' && task.status?.toLowerCase() !== 'review pending' ? (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() =>
                                  handleCompleteTask(task.id, task.status)
                                }
                                disabled={loadingTaskId === task.id}
                              >
                                {loadingTaskId === task.id ? (
                                  <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Completing...
                                  </>
                                ) : (
                                  <>
                                    <PlayFill size={12} className="me-1" /> Complete
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingTask;