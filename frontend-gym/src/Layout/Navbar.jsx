import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
const Logo = "/logo.png"; // Default fallback logo
import Account from "../Dashboard/Member/Account";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";
import { io } from "socket.io-client";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // const [showProfileModal, setShowProfileModal] = useState(false);

  // State for dynamic logo and loading status
  const [appLogo, setAppLogo] = useState(Logo); // Initialize with default logo
  const [loading, setLoading] = useState(true); // For initial loading state

  const dropdownRef = useRef();
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef();

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
  useEffect(() => {
    fetchAppSettings();
    
    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const u = getUserFromLocalStorage();
        if (u && u.id) {
          const res = await axiosInstance.get(`/notif/user/${u.id}`);
          if (res.data && res.data.notifications) {
            setNotifications(res.data.notifications);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  const markNotificationRead = async (id) => {
    try {
      await axiosInstance.put(`/notif/read/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  useEffect(() => {
    const u = getUserFromLocalStorage();
    if (!u || !u.id) return;

    // Use standard config for Socket.IO
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const socket = io(backendUrl, {
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to WebSocket Server", socket.id);
      socket.emit("join_room", u.id); // Join room named as userId
    });

    socket.on("new_notification", (data) => {
      console.log("🔔 Real-time notification received:", data);
      setNotifications(prev => [data, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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
            >
              <FaBell size={22} />
              {notifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                  {notifications.length}
                </span>
              )}
            </button>
            
            {showNotifDropdown && (
              <div 
                className="dropdown-menu show shadow p-0"
                style={{
                  position: "absolute", right: 0, top: "100%", width: "min(350px, calc(100vw - 20px))", zIndex: 1050,
                  maxHeight: "450px", overflowY: "auto", borderRadius: "10px", border: "1px solid #e0e0e0"
                }}
              >
                <div className="bg-light p-3 border-bottom fw-bold text-dark d-flex justify-content-between align-items-center" style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#f8f9fa" }}>
                  <span>Notifications</span>
                  <span className="badge bg-primary rounded-pill px-2 py-1">{notifications.length} New</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <FaBell size={30} className="text-light mb-2 d-block mx-auto" />
                    No new notifications
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {notifications.map(n => (
                      <li key={n.id} className="list-group-item list-group-item-action p-3 border-bottom" style={{ cursor: 'pointer', transition: "background-color 0.2s" }} onClick={() => markNotificationRead(n.id)}>
                        <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                          <small className="text-primary fw-bold" style={{ fontSize: "0.85rem" }}>{n.type}</small>
                          <small className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(n.createdAt).toLocaleString()}</small>
                        </div>
                        <p className="mb-2 text-dark" style={{ whiteSpace: "pre-line", wordBreak: 'break-word', fontSize: "0.9rem", lineHeight: "1.4" }}>
                          {n.message && n.message.includes("📎 Attachment:") ? (
                            <>
                              {n.message.split("📎 Attachment:")[0]}
                              <a 
                                href={n.message.split("📎 Attachment:")[1]?.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="badge bg-info text-white text-decoration-none mt-2 d-inline-block px-2 py-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📎 View Attachment
                              </a>
                            </>
                          ) : n.message}
                        </p>
                        <div className="text-end">
                          <small className="text-primary fw-semibold" style={{ fontSize: "0.75rem" }}>Click to dismiss</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* View All Notifications Link */}
                <div className="bg-light p-2 border-top text-center" style={{ position: "sticky", bottom: 0, zIndex: 1, borderRadius: "0 0 10px 10px" }}>
                  <Link 
                    to="/notifications" 
                    className="text-primary text-decoration-none fw-bold"
                    onClick={() => setShowNotifDropdown(false)}
                  >
                    View All Notifications <i className="fas fa-arrow-right ms-1"></i>
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
                  Welcome {profile?.role?.toLowerCase() === 'receptionist' ? 'Sales' : (profile?.role || "User")}
                </small>
                <div className="fw-bold">
                  {profile?.name?.toLowerCase().includes('receptionist') ? 'Sales Team' : (profile?.name || "Guest")}
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
