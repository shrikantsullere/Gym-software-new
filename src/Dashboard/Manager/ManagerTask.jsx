import React, { useState, useEffect } from 'react';
import { ClipboardCheck, BarChart, Check2Square } from 'react-bootstrap-icons';
import axios from 'axios';
import BaseUrl from '../../Api/BaseUrl';

const ManagerTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${BaseUrl}housekeepingtask/asignedto/${userId}`);
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = async (taskId) => {
    try {
      await axios.put(`${BaseUrl}housekeepingtask/status/${taskId}`, {
        status: 'Review Pending'
      });
      fetchTasks();
    } catch (error) {
      alert("Error updating task status");
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Manager Dashboard</h2>

      <div className="row">
        <div className="col-12 mb-4">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <BarChart className="me-2" />
              <h5 className="mb-0">Team Overview</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <h4>12</h4>
                  <p className="text-muted">Active Staff</p>
                </div>
                <div className="col-md-3 mb-3">
                  <h4>{tasks.length}</h4>
                  <p className="text-muted">My Assigned Tasks</p>
                </div>
                <div className="col-md-3 mb-3">
                  <h4>8</h4>
                  <p className="text-muted">Classes Today</p>
                </div>
                <div className="col-md-3">
                  <h4>92%</h4>
                  <p className="text-muted">Attendance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center">
              <ClipboardCheck className="me-2" />
              <h5 className="mb-0">My Tasks</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <p>Loading tasks...</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Description</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.length > 0 ? tasks.map(task => (
                        <tr key={task.id}>
                          <td>{task.taskTitle}</td>
                          <td>{task.description}</td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>{task.priority}</td>
                          <td>
                            <span className={`badge ${task.status === 'Completed' || task.status === 'Approved' ? 'bg-success' : task.status === 'Review Pending' ? 'bg-warning' : 'bg-info'}`}>
                              {task.status}
                            </span>
                          </td>
                          <td>
                            {task.status !== 'Approved' && task.status !== 'Review Pending' && (
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={() => markComplete(task.id)}
                              >
                                <Check2Square size={14} className="me-1" /> Mark Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" className="text-center">No tasks assigned</td></tr>
                      )}
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

export default ManagerTask;