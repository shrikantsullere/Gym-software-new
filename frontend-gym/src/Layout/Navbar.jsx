import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaBars } from "react-icons/fa";
const Logo = "/logo.png"; // Default fallback logo
import Account from "../Dashboard/Member/Account";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";

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
      if (!userData || !userData.id) {
        console.error("Admin ID not found in localStorage. Cannot fetch logo.");
        setAppLogo(Logo);
        setLoading(false);
        return;
      }

      const adminId = userData.id; // Use user.id instead of userData.id
      // The endpoint path is relative to the baseURL in your axiosInstance
      const endpoint = `/adminSettings/app-settings/admin/${adminId}`;

      // Use axiosInstance.get() instead of fetch()
      const response = await axiosInstance.get(endpoint);

      // Axios automatically throws an error for non-2xx responses, so no need for response.ok check.
      // The data from the server is available in response.data
      const result = response.data;

      if (result.success && result.data && result.data.logo) {
        setAppLogo(result.data.logo);
        console.log("Logo successfully fetched from API.");
      } else {
        console.log("No logo found in API response. Using default.");
        setAppLogo(Logo);
      }
    } catch (error) {
      // Axios provides a more detailed error object
      console.error("Error fetching app settings with axios:", error.response ? error.response.data : error.message);
      setAppLogo(Logo); // Fallback to default on any error
    } finally {
      setLoading(false); // Stop loading spinner
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
                className="dropdown-menu show shadow-sm p-0"
                style={{
                  position: "absolute", right: 0, top: "100%", width: "min(300px, calc(100vw - 30px))", zIndex: 1050,
                  maxHeight: "400px", overflowY: "auto", borderRadius: "8px"
                }}
              >
                <div className="bg-light p-3 border-bottom fw-bold text-dark d-flex justify-content-between align-items-center">
                  <span>Notifications</span>
                  <span className="badge bg-primary rounded-pill">{notifications.length}</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted">No new notifications</div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {notifications.map(n => (
                      <li key={n.id} className="list-group-item list-group-item-action p-3" style={{ cursor: 'pointer' }} onClick={() => markNotificationRead(n.id)}>
                        <div className="d-flex w-100 justify-content-between">
                          <small className="text-primary fw-bold mb-1">{n.type}</small>
                          <small className="text-muted">{new Date(n.createdAt).toLocaleDateString()}</small>
                        </div>
                        <p className="mb-1 small text-dark" style={{ whiteSpace: "pre-line" }}>
                          {n.message && n.message.includes("📎 Attachment:") ? (
                            <>
                              {n.message.split("📎 Attachment:")[0]}
                              <a 
                                href={n.message.split("📎 Attachment:")[1]?.trim()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="badge bg-info text-white text-decoration-none mt-1 d-inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                📎 View Attachment
                              </a>
                            </>
                          ) : n.message}
                        </p>
                        <small className="text-muted d-block text-end">Click to dismiss</small>
                      </li>
                    ))}
                  </ul>
                )}
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
