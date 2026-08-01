import React, { useState, useEffect } from "react";
import axiosInstance from "../Api/axiosInstance";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get user data from localStorage
  const getUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const u = getUserFromLocalStorage();
        if (u && u.id) {
          const res = await axiosInstance.get(`/app-notifications?limit=200`);
          if (res.data && res.data.notifications) {
            setNotifications(res.data.notifications);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markNotificationRead = async (id) => {
    try {
      await axiosInstance.patch(`/app-notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch(`/app-notifications/read-all`);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card shadow-sm border-0" style={{ borderRadius: "10px" }}>
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <h4 className="mb-0 text-dark fw-bold">All Notifications</h4>
                {unreadCount > 0 && (
                  <span className="badge bg-primary rounded-pill px-3 py-2" style={{ fontSize: "0.9rem" }}>
                    {unreadCount} New
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={markAllRead}
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <i className="fas fa-bell-slash mb-3" style={{ fontSize: "3rem", color: "#ddd" }}></i>
                  <h5 className="fw-normal">No notifications</h5>
                  <p>You have no notifications yet.</p>
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {notifications.map(n => (
                    <li key={n.id} className={`list-group-item p-4 border-bottom ${!n.isRead ? 'bg-light' : ''}`} style={{ transition: "background-color 0.2s" }}>
                      <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="text-primary fw-bold mb-0">{n.title || n.type}</h6>
                          {!n.isRead && <span className="badge bg-danger" style={{ fontSize: "0.6rem" }}>NEW</span>}
                        </div>
                        <small className="text-muted fw-medium">{new Date(n.createdAt).toLocaleString()}</small>
                      </div>
                      <p className="mb-3 text-dark" style={{ whiteSpace: "pre-line", wordBreak: 'break-word', fontSize: "1rem", lineHeight: "1.5" }}>
                        {n.message ? (
                          n.message.includes("📎 Attachment:") ? (
                            <>
                              {n.message.split("📎 Attachment:")[0].replace(/You can now login at http:\/\/localhost:5173\/login\.?/g, '').replace(/\\n/g, '\n').trim()}
                              <br />
                              <a 
                                href={n.message.split("📎 Attachment:")[1]?.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-sm btn-info text-white mt-2"
                              >
                                📎 View Attachment
                              </a>
                            </>
                          ) : n.message.replace(/You can now login at http:\/\/localhost:5173\/login\.?/g, '').replace(/\\n/g, '\n').trim()
                        ) : ""}
                      </p>
                      <div className="text-end">
                        {!n.isRead ? (
                          <button 
                            className="btn btn-outline-primary btn-sm fw-bold"
                            onClick={() => markNotificationRead(n.id)}
                          >
                            <i className="fas fa-check me-1"></i> Mark as Read
                          </button>
                        ) : (
                          <span className="text-success small fw-bold">
                            <i className="fas fa-check-double me-1"></i> Read
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
