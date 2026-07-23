import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
const Logo = "/logo.png"; // Default fallback logo
import Account from "../Dashboard/Member/Account";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";
import { useSocket } from "../Context/SocketContext";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [showProfileModal, setShowProfileModal] = useState(false);

  // State for dynamic logo and loading status
  const [appLogo, setAppLogo] = useState(Logo); // Initialize with default logo
  const [loading, setLoading] = useState(true); // For initial loading state

  const dropdownRef = useRef();
  
  // Notification State
  const [notifications, setNotifications] = useState([]);  // only UNREAD for badge
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef();
  const notifPollRef = useRef(null);

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

  // Initialize profile state with user data from localStorage
  const user = getUserFromLocalStorage();
  const [profile, setProfile] = useState({
    name: user?.fullName || "Admin",
    email: user?.email || "admin@gymapp.com",
    phone: user?.phone || "+91 90000 00000",
    role: user?.roleName || "Super Admin",
    branch: user?.branchName || "All Branches",
    adminId: user?.adminId || "",
    branchId: user?.branchId || "",
    profileImage: user?.profileImage || "",
    roleId: user?.roleId || "",
    staffId: user?.staffId || "",
    notifyEmail: true,
    notifySMS: false,
  });

  // --- CHANGE 2: Update fetchAppSettings to use axiosInstance ---
  const fetchAppSettings = async () => {
    try {
      const userData = getUserFromLocalStorage();
      if (!userData) {
        setAppLogo(Logo);
        setLoading(false);
        return;
      }

      // Use adminId for staff/trainers (e.g. Admin 90), or fallback to user.id for admin
      const adminId = userData.adminId || userData.id;
      if (!adminId) {
        setAppLogo(Logo);
        setLoading(false);
        return;
      }

      const endpoint = `/adminSettings/app-settings/admin/${adminId}`;
      const response = await axiosInstance.get(endpoint);
      const result = response.data;

      if (result.success && result.data && result.data.logo) {
        setAppLogo(result.data.logo);
      } else {
        setAppLogo(Logo);
      }
    } catch (error) {
      setAppLogo(Logo);
    } finally {
      setLoading(false);
    }
  };

  // useEffect to fetch logo on mount and then every minute (no changes here)
  // Fetch only UNREAD notifications (for red dot badge)
  const fetchUnreadNotifications = async () => {
    try {
      const u = getUserFromLocalStorage();
      if (u && u.id) {
        const res = await axiosInstance.get(`/notif/user/${u.id}`);
        if (res.data && res.data.notifications) {
          setNotifications(res.data.notifications);
        }
      }
    } catch (err) {
      // silently fail for notification polling
    }
  };

  useEffect(() => {
    fetchAppSettings();
    fetchUnreadNotifications();

    // Poll for new notifications every 30 seconds
    notifPollRef.current = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(notifPollRef.current);
  }, []);

  // Mark notification as read — removes from unread list + updates DB
  const markNotificationRead = async (id) => {
    try {
      await axiosInstance.put(`/notif/read/${id}`);
      // Remove from local unread list so badge count decreases
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark ALL unread notifications as read
  const markAllRead = async () => {
    try {
      const u = getUserFromLocalStorage();
      if (u && u.id) {
        await axiosInstance.put(`/notif/read-all/${u.id}`);
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    // Real-time: new notification arrives → add to unread list → red dot appears
    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
    };

    const handleNotificationRead = (data) => {
      setNotifications(prev => prev.filter(n => n.id !== data.id));
    };

    const handleAllNotificationsRead = () => {
      setNotifications([]);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("notification_read", handleNotificationRead);
    socket.on("all_notifications_read", handleAllNotificationsRead);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("notification_read", handleNotificationRead);
      socket.off("all_notifications_read", handleAllNotificationsRead);
    };
  }, [socket]);

  useEffect(() => {
    const intervalId = setInterval(fetchAppSettings, 60000); // Fetch every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Existing useEffect for profile management (no changes here)
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUser = getUserFromLocalStorage();
      if (updatedUser) {
        setProfile({
          name: updatedUser.fullName || "",
          email: updatedUser.email || "",
          profileImage: updatedUser.profileImage || "",
          phone: updatedUser.phone || "",
          role: updatedUser.roleName || "",
          branch: updatedUser.branchName || "",
          adminId: updatedUser.adminId || "",
          branchId: updatedUser.branchId || "",
          roleId: updatedUser.roleId || "",
          staffId: updatedUser.staffId || "",
          notifyEmail: true,
          notifySMS: false,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const intervalId = setInterval(() => {
      const currentUser = getUserFromLocalStorage();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        handleStorageChange();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect(() => {
  //   document.body.style.overflow = showProfileModal ? "hidden" : "unset";
  //   return () => (document.body.style.overflow = "unset");
  // }, [showProfileModal]);

  const handleSaveProfile = () => {
    try {
      const currentUser = getUserFromLocalStorage();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          fullName: profile.name,
          email: profile.email,
          profileImage: profile.profileImage,
          phone: profile.phone,
          branchName: profile.branch,
          adminId: profile.adminId,
          branchId: profile.branchId,
          roleId: profile.roleId,
          staffId: profile.staffId,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      alert("Profile saved!");
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error saving profile to localStorage:", error);
      alert("Error saving profile!");
    }
  };

  // Proper logout handler
  const handleLogout = async () => {
    try {
      // Optionally call logout API endpoint to invalidate token on server
      try {
        await axiosInstance.post('/auth/logout');
      } catch (err) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', err);
      }

      // Clear all authentication data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAuthenticated');

      // Close dropdown
      setDropdownOpen(false);

      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, clear localStorage and redirect
      localStorage.clear();
      navigate('/login');
    }
  };

  return (
    <>
      <nav
        className="navbar navbar-expand px-2 px-md-3 py-2 d-flex justify-content-between align-items-center fixed-top"
        style={{
          backgroundColor: "#2f6a87",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          zIndex: 1050,
        }}
      >
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <button
            className="btn p-2"
            style={{
              backgroundColor: "transparent",
              borderColor: "white",
              color: "white",
              borderRadius: "6px",
              border: "2px solid white",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "white";
              e.target.style.color = "#000";
              e.target.style.borderColor = "white";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "white";
              e.target.style.borderColor = "white";
            }}
            onClick={toggleSidebar}
          >
            <FaBars color="currentColor" />
          </button>

          {/* Dynamic Logo with loading state */}
          <div>
            {loading ? (
              <div className="spinner-border spinner-border-sm text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              <img
                src={appLogo}
                alt="Logo"
                style={{
                  height: "auto",
                  maxHeight: "45px",
                  width: "auto",
                  maxWidth: "min(200px, 35vw)",
                  objectFit: "contain"
                }}
                onError={(e) => {
                  e.target.onerror = null; // Prevents infinite loop
                  e.target.src = Logo; // Fallback to default logo on error
                }}
              />
            )}
          </div>
        </div>

        <div className="me-1 me-md-2 d-flex align-items-center gap-2 gap-md-3 position-relative">
          
          {/* Notifications */}
          <div className="position-relative" ref={notifRef}>
            <button 
              className="btn text-white position-relative p-2"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{ border: 'none', background: 'transparent' }}
              title="Notifications"
            >
              <FaBell size={22} />
              {/* Red dot only shows when there are UNREAD notifications */}
              {notifications.length > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                  style={{ fontSize: '0.65rem', minWidth: '18px' }}
                >
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>
            
            {showNotifDropdown && (
              <div 
                className="dropdown-menu show shadow p-0"
                style={{
                  position: "absolute", right: 0, top: "110%",
                  width: "min(360px, calc(100vw - 20px))", zIndex: 1050,
                  maxHeight: "480px", overflowY: "auto",
                  borderRadius: "12px", border: "1px solid #e0e0e0"
                }}
              >
                {/* Header */}
                <div 
                  className="p-3 border-bottom d-flex justify-content-between align-items-center"
                  style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", borderRadius: "12px 12px 0 0" }}
                >
                  <span className="fw-bold text-dark" style={{ fontSize: "1rem" }}>🔔 Notifications</span>
                  <div className="d-flex align-items-center gap-2">
                    {notifications.length > 0 && (
                      <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: "0.7rem" }}>
                        {notifications.length} Unread
                      </span>
                    )}
                    {notifications.length > 0 && (
                      <button 
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        style={{ fontSize: "0.7rem", lineHeight: "1.8" }}
                        onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                        title="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <FaBell size={32} style={{ color: "#ddd" }} className="mb-2 d-block mx-auto" />
                    <p className="mb-0" style={{ fontSize: "0.9rem" }}>No new notifications</p>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {notifications.map(n => (
                      <li 
                        key={n.id} 
                        className="list-group-item list-group-item-action p-3 border-bottom"
                        style={{ cursor: 'pointer', background: "#f8faff", transition: "background-color 0.15s" }}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.reference_type === 'CLASS') {
                            if (profile.role === 'Member') navigate('/member/classschedule');
                            else if (profile.role === 'Trainer' || profile.role === 'General Trainer' || profile.role === 'Personal Trainer') navigate('/trainer/classesschedule');
                            else navigate('/admin/classesschedule');
                          } else if (n.reference_type === 'SESSION') {
                            if (profile.role === 'Member') navigate('/member/sessions');
                            else if (profile.role === 'Trainer' || profile.role === 'General Trainer' || profile.role === 'Personal Trainer') navigate('/trainer/sessions');
                            else navigate('/admin/personaltraining');
                          }
                          setShowNotifDropdown(false);
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#eef3ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f8faff"}
                      >
                        <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                          <small className="text-primary fw-bold" style={{ fontSize: "0.8rem" }}>
                            🔵 {n.title || n.type}
                          </small>
                          <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                            {new Date(n.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <p className="mb-1 text-dark" style={{ whiteSpace: "pre-line", wordBreak: 'break-word', fontSize: "0.88rem", lineHeight: "1.4" }}>
                          {n.message && n.message.includes("📎 Attachment:") ? (
                            <>
                              {n.message.split("📎 Attachment:")[0]}
                              <a 
                                href={n.message.split("📎 Attachment:")[1]?.trim()} 
                                target="_blank" rel="noopener noreferrer" 
                                className="badge bg-info text-white text-decoration-none mt-1 d-inline-block px-2 py-1"
                                onClick={e => e.stopPropagation()}
                              >
                                📎 View Attachment
                              </a>
                            </>
                          ) : n.message}
                        </p>
                        <div className="text-end">
                          <small className="text-primary" style={{ fontSize: "0.7rem" }}>✓ Click to dismiss</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Footer */}
                <div 
                  className="p-2 border-top text-center"
                  style={{ position: "sticky", bottom: 0, zIndex: 2, background: "#fff", borderRadius: "0 0 12px 12px" }}
                >
                  <Link 
                    to="/notifications" 
                    className="text-primary text-decoration-none fw-semibold"
                    style={{ fontSize: "0.85rem" }}
                    onClick={() => setShowNotifDropdown(false)}
                  >
                    View All Notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="dropdown" ref={dropdownRef}>
            <div
              className="d-flex align-items-center gap-2 cursor-pointer text-white"
              role="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: "35px", height: "35px", objectFit: "cover" }}
                />
              ) : (
                <FaUserCircle size={35} />
              )}
              <div className="d-none d-sm-block text-white">
                <small className="mb-0">
                  Welcome {profile?.role || "User"}
                </small>
                <div className="fw-bold">
                  {profile?.name || "Guest"}
                </div>
              </div>
            </div>

            {dropdownOpen && (
              <ul
                className="dropdown-menu show mt-2 shadow-sm"
                style={{
                  position: "absolute",
                  right: 0,
                  minWidth: "200px",
                  maxWidth: "calc(100vw - 30px)",
                  zIndex: 1000,
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <li>
                  <Link className="text-decoration-none" to="/account">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);

                      }}
                    >
                      Profile
                    </button>
                  </Link>

                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                    style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
