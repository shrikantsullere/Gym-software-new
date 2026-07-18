import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faCodeBranch,
  faUserShield,
  faClipboardList,
  faTags,
  faCreditCard,
  faCogs,
  faUsers,
  faPlusCircle,
  faChalkboardTeacher,
  faCalendarCheck,
  faUserTie,
  faClock,
  faChevronDown,
  faTasks,
  faDumbbell,
  faChartPie,
  faTools,
  faBroom,
  faQrcode,
  faUserCheck,
  faCalendar,
  faClipboardCheck,
  faLayerGroup,
  faFileInvoice,
  faBookAtlas,
  faUserPlus,
  faDoorOpen,
  faMoneyCheckAlt,
  faUserFriends,
  faComments,
  faEye,
  faClapperboard,
  faIdCard,
  faAddressBook,
  faHeartbeat,
  faTrophy,
  faBoxes,
  faBullhorn,
  faCoins
} from "@fortawesome/free-solid-svg-icons";

import "./Sidebar.css";

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(null);
  const [userRole, setUserRole] = useState(null); // Initialize as null instead of "admin"
  const [userPermissions, setUserPermissions] = useState([]);

  useEffect(() => {
    // Get role from localStorage and ensure it's uppercase to match our keys
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(role.toUpperCase()); // Convert to uppercase to match our keys
    }
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.permissions) {
          let perms = userObj.permissions;
          if (typeof perms === "string") {
            try {
              perms = JSON.parse(perms);
              if (typeof perms === "string") {
                perms = JSON.parse(perms);
              }
            } catch (e) {}
          }
          setUserPermissions(Array.isArray(perms) ? perms : []);
        }
      }
    } catch(e) {}
  }, []); // Add empty dependency array to run only once on mount

  // Listen for storage changes to update role when it changes
  useEffect(() => {
    const handleStorageChange = () => {
      const role = localStorage.getItem("userRole");
      if (role) {
        setUserRole(role.toUpperCase());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleMenu = (menuKey) => {
    setActiveMenu(activeMenu === menuKey ? null : menuKey);
  };

  const isActive = (path) => location.pathname === path;

  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth <= 768) setCollapsed(true);
  };

  // ------------------ MENUS ------------------
  const allMenus = {
    SUPERADMIN: [
      { name: "Dashboard", icon: faChartBar, path: "/superadmin/dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/admin/leads" },
      // { name: "Branches", icon: faCodeBranch, path: "/admin/AdminBranches" },
      { name: "Gym Owners", icon: faUserShield, path: "/superadmin/Admin" },
      { name: "Request Plan", icon: faClipboardList, path: "/superadmin/request-plan" },
      { name: "Plans & Pricing", icon: faTags, path: "/superadmin/Plans&Pricing" },
      { name: "Payments", icon: faMoneyCheckAlt, path: "/superadmin/payments" },
      { name: "Announcements", icon: faComments, path: "/superadmin/announcements" }, // ✅ Broadcast Module
      { name: "Setting", icon: faCogs, path: "/superadmin/setting" },
      { name: "Trial & Automation", icon: faCogs, path: "/superadmin/automation-settings" },
      { name: "Manage Sub-Admins", icon: faUsers, path: "/superadmin/subadmins" },
      // { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    SUBADMIN: [
      { name: "Dashboard", icon: faChartBar, path: "/superadmin/dashboard", module: "Dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/admin/leads", module: "Leads / Inquiries" },
      { name: "Gym Owners", icon: faUserShield, path: "/superadmin/Admin", module: "Gym Owners" },
      { name: "Request Plan", icon: faClipboardList, path: "/superadmin/request-plan", module: "Request Plan" },
      { name: "Plans & Pricing", icon: faTags, path: "/superadmin/Plans&Pricing", module: "Plans & Pricing" },
      { name: "Payments", icon: faMoneyCheckAlt, path: "/superadmin/payments", module: "Payments" },
      { name: "Announcements", icon: faComments, path: "/superadmin/announcements", module: "Announcements" },
      { name: "Trial & Automation", icon: faCogs, path: "/superadmin/automation-settings", module: "Trial & Automation" },
      { name: "Setting", icon: faCogs, path: "/superadmin/setting", module: "Setting" },
    ].filter(m => userPermissions.includes(m.module)),


    ADMIN: [
      { name: "Dashboard",               icon: faChartPie,          path: "/admin/admin-dashboard" },
      { name: "Leads / Inquiries",        icon: faAddressBook,        path: "/admin/leads" },
      { name: "Branches",                 icon: faCodeBranch,         path: "/admin/AdminBranches" },
      { name: "Members",                  icon: faUsers,              path: "/admin/AdminMember" },
      { name: "At-Risk Members",          icon: faHeartbeat,          path: "/admin/at-risk-members" },
      { name: "QR Check-in",              icon: faQrcode,             path: "/admin/qrcheckin" },
      { name: "Create Plan",              icon: faPlusCircle,         path: "/admin/createplan" },
      {
        name: "Classes & Sessions",
        icon: faChalkboardTeacher,
        key: "Classes",
        subItems: [
          { label: "Class Timetable", path: "/admin/classesSchedule" },
          { label: "Member Bookings", path: "/admin/bookings" },
          { label: "PT Bookings", path: "/admin/booking/personal-training" }
        ]
      },
      { name: "Expenses & Profit",        icon: faCoins,              path: "/admin/expenses" },
      { name: "Bodybuilder Assessment",   icon: faHeartbeat,          path: "/bodybuilder-assessment" },
      { name: "Inventory",                icon: faBoxes,              path: "/admin/inventory" },
      {
        name: "Staff",
        icon: faUserTie,
        key: "Staff",
        subItems: [
          { label: "Manage Staff",       path: "/admin/staff/manage-staff" },
          { label: "Attendance",         path: "/admin/staff/attendance" },
          { label: "Salary Calculator",  path: "/staff/salary-calculator" }
        ]
      },
      { name: "Shift Management",         icon: faClock,              path: "/admin/shift-managment" },
      { name: "Task Management",          icon: faTasks,              path: "/admin/task-managment" },
      { name: "Announcements",            icon: faBullhorn,           path: "/admin/announcements" },
      { name: "Leaderboard",              icon: faTrophy,             path: "/leaderboard" },
      {
        name: "Reports",
        icon: faFileInvoice,
        key: "reports",
        subItems: [
          { label: "Sales Report",       path: "/admin/reports/sales" },
          { label: "Attendance Report",  path: "/admin/reports/AttendanceReport" }
        ]
      },
      { name: "Settings",                 icon: faTools,              path: "/admin/settings" },
      { name: "Notification Credits",     icon: faComments,           path: "/admin/notification-credits" },
      { name: "My Subscription",          icon: faTags,               path: "/admin/my-subscription" }
    ],

    HOUSEKEEPING: [
      { name: "Dashboard", icon: faBroom, path: "/housekeeping/dashboard" },
      { name: "Shift Management", icon: faClock, path: "/housekeeping/shift-management" },
      { name: "Task Checklist", icon: faTasks, path: "/housekeeping/duty-roster" },
      { name: "QR Check-in", icon: faQrcode, path: "/housekeeping/qrcheckin" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
    ],

    GENERALTRAINER: [
      { name: "Dashboard", icon: faDumbbell, path: "/generaltrainer/dashboard" },
      { name: "Members", icon: faUsers, path: "/admin/AdminMember" },
      { name: "Client Progress", icon: faChartBar, path: "/personaltrainer/client-progress" },
      { name: "New Assessment", icon: faHeartbeat, path: "/personaltrainer/assessment-form" },
      { name: "Bodybuilder Assessment", icon: faDumbbell, path: "/bodybuilder-assessment" },
      { name: "Diet Builder", icon: faClipboardList, path: "/generaltrainer/diet-builder" },
      { name: "Workout Builder", icon: faDumbbell, path: "/generaltrainer/workout-builder" },
      { name: "Health & BMI Log", icon: faHeartbeat, path: "/generaltrainer/health-log" },
      { name: "Classes Schedule", icon: faCalendar, path: "/generaltrainer/classesschedule" },
      { name: "Shift Management", icon: faClock, path: "/GeneralTrainer/shift-managment" },
      { name: "Attendance", icon: faClipboardCheck, path: "/generaltrainer/attendance" },
      { name: "QR Check-in", icon: faQrcode, path: "/generaltrainer/qrcheckin" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/admin/inventory" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    PERSONALTRAINER: [
      { name: "Dashboard", icon: faDumbbell, path: "/personaltrainer/dashboard" },
      { name: "Members", icon: faUsers, path: "/admin/AdminMember" },
      { name: "Client Progress", icon: faChartBar, path: "/personaltrainer/client-progress" },
      { name: "New Assessment", icon: faHeartbeat, path: "/personaltrainer/assessment-form" },
      { name: "Bodybuilder Assessment", icon: faDumbbell, path: "/bodybuilder-assessment" },
      { name: "Diet Builder", icon: faClipboardList, path: "/personaltrainer/diet-builder" },
      { name: "Workout Builder", icon: faDumbbell, path: "/personaltrainer/workout-builder" },
      { name: "Health & BMI Log", icon: faHeartbeat, path: "/personaltrainer/health-log" },
      { name: "Classes Schedule", icon: faCalendar, path: "/personaltrainer/classesschedule" },
      { name: "Shift Management", icon: faClock, path: "/personaltrainer/shift-managment" },
      { name: "Session Bookings", icon: faCalendarCheck, path: "/personaltrainer/bookings" },
      { name: "Attendance", icon: faClipboardCheck, path: "/personaltrainer/personalattendance" },
      { name: "QR Check-in", icon: faQrcode, path: "/personaltrainer/qrcheckin" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/admin/inventory" },
      { name: "Announcements", icon: faBullhorn, path: "/staff/announcements" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    SALES_AGENT: [
      { name: "Sales Dashboard", icon: faChartBar, path: "/sales/dashboard" },
      { name: "Leads / Inquiries", icon: faAddressBook, path: "/sales/leads" },
      { name: "New Registrations", icon: faUserPlus, path: "/sales/walk-in-registration" },
      { name: "Members", icon: faUserFriends, path: "/admin/AdminMember" },
      { name: "At-Risk Members", icon: faHeartbeat, path: "/admin/at-risk-members" },
      { name: "Payments & Invoicing", icon: faMoneyCheckAlt, path: "/sales/payment" },
      { name: "Renewals & Follow-ups", icon: faCalendarCheck, path: "/sales/reportattendance" },
      { name: "Profit & Loss Reports", icon: faChartPie, path: "/sales/report" },
      { name: "Inventory & Requests", icon: faBoxes, path: "/admin/inventory" },
    ],

    RECEPTIONIST: [
      { name: "Reception Dashboard",   icon: faUserCheck,       path: "/receptionist/dashboard" },
      { name: "New Registrations",     icon: faUserPlus,        path: "/receptionist/walk-in-registration" },
      { name: "Leads / Inquiries",     icon: faAddressBook,     path: "/receptionist/leads" },
      { name: "Members",               icon: faUserFriends,     path: "/receptionist/members" },
      { name: "At-Risk Members",       icon: faHeartbeat,       path: "/receptionist/at-risk-members" },
      { name: "Classes Schedule",      icon: faCalendar,        path: "/receptionist/classes-schedule" },
      { name: "Session Bookings",      icon: faCalendarCheck,   path: "/receptionist/session-bookings" },
      { name: "QR Check-in",           icon: faQrcode,          path: "/receptionist/qrcheckin" },
      { name: "Daily Attendance",      icon: faClipboardCheck,  path: "/receptionist/qr-attendance" },
      { name: "Payments & Invoicing",  icon: faMoneyCheckAlt,   path: "/receptionist/payment" },
      { name: "Renewals & Follow-ups", icon: faCalendarCheck,   path: "/receptionist/renewals" },
      { name: "Inventory & Requests",  icon: faBoxes,           path: "/receptionist/inventory" },
      { name: "Task Management",       icon: faTasks,           path: "/receptionist/task-management" },
      { name: "Announcements",         icon: faBullhorn,        path: "/receptionist/announcements" },
    ],

    MANAGER: [
      { name: "Dashboard", icon: faChartBar, path: "/manager/dashboard" },
      { name: "Members", icon: faUserFriends, path: "/manager/members" },
      { name: "Duty Roster", icon: faClipboardCheck, path: "/manager/duty-roster" },
      { name: "Class Schedule", icon: faCalendar, path: "/manager/class-schedule" },
      { name: "Reports", icon: faFileInvoice, path: "/manager/reports" },
      { name: "Inventory", icon: faBoxes, path: "/admin/inventory" },
      { name: "Communication", icon: faComments, path: "/manager/communication" },
      { name: "Leaderboard", icon: faTrophy, path: "/leaderboard" },
    ],

    MEMBER: [
      { name: "Dashboard", icon: faEye, path: "/member/dashboard" },
      { name: "My Diet Plan", icon: faClipboardList, path: "/member/my-diet" },
      { name: "My Workouts", icon: faDumbbell, path: "/member/my-workouts" },
      { name: "My Health Log", icon: faHeartbeat, path: "/member/health-log" },
      { name: "Leaderboard", icon: faTrophy, path: "/member/leaderboard" },
      { name: "QR Check-in", icon: faQrcode, path: "/member/qrcheckin" },
      { name: "Attendance", icon: faClipboardCheck, path: "/member/memberattendance" },
      { name: "My Plan", icon: faBookAtlas, path: "/member/viewplan" },
      { name: "Class Schedule", icon: faClapperboard, path: "/member/classSchedule" },
      { name: "Announcements", icon: faBullhorn, path: "/member/announcements" },
      { name: "My Account", icon: faIdCard, path: "/account" },

      { name: "All Plans", icon: faIdCard, path: "/member/allplans" }
    ],
  };

  // Default to ADMIN if no role is found
  const userMenus = userRole ? allMenus[userRole] : allMenus.ADMIN;

  // Add a loading state or fallback if userRole is still null
  if (!userRole) {
    return <div className="sidebar-container">
      <div className="sidebar">
        <div className="p-3 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>;
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setCollapsed(true)}
        />
      )}
      <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar">
          <ul className="menu">
          {userMenus.map((menu, index) => {
            if (!menu.subItems) {
              return (
                <li key={index} className="menu-item">
                  <div
                    className={`menu-link ${isActive(menu.path) ? "active" : ""}`}
                    onClick={() => handleNavigate(menu.path)}
                  >
                    <FontAwesomeIcon icon={menu.icon} className="menu-icon" />
                    {!collapsed && <span className="menu-text">{menu.name}</span>}
                  </div>
                </li>
              );
            }

            return (
              <li key={index} className="menu-item">
                <div
                  className="menu-link mb-2"
                  onClick={() => toggleMenu(menu.key)}
                >
                  <FontAwesomeIcon icon={menu.icon} className="menu-icon" />
                  {!collapsed && <span className="menu-text">{menu.name}</span>}
                  {!collapsed && (
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`arrow-icon ${activeMenu === menu.key ? "rotate" : ""}`}
                    />
                  )}
                </div>

                {!collapsed && activeMenu === menu.key && (
                  <ul className="submenu">
                    {menu.subItems.map((sub, i) => (
                      <li
                        key={i}
                        className={`submenu-item mb-2 ${isActive(sub.path) ? "active-sub" : ""}`}
                        onClick={() => handleNavigate(sub.path)}
                      >
                        {sub.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
