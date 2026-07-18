import React, { useState, useEffect } from "react";
import axiosInstance from "../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faTimes } from "@fortawesome/free-solid-svg-icons";

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    // Re-fetch every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user')) || {};
      const role = (localStorage.getItem("userRole") || user.roleName || user.role || "").toLowerCase();
      
      let list = [];
      if (role === 'member') {
        const res = await axiosInstance.get("/notif/user-announcements?roleGroup=MEMBERS");
        if (res.data?.success) {
          list = res.data.announcements || [];
        }
      } else if (role === 'admin' || role === 'manager') {
        const res = await axiosInstance.get("/notif/user-announcements?roleGroup=ADMIN");
        if (res.data?.success) {
          list = res.data.announcements || [];
        }
      } else if (role === 'superadmin') {
        const res = await axiosInstance.get("notif/broadcast/history");
        if (res.data?.success) {
          list = res.data.history || [];
        }
      } else {
        const res = await axiosInstance.get("/notif/user-announcements?roleGroup=STAFF");
        if (res.data?.success) {
          list = res.data.announcements || [];
        }
      }

      if (list.length > 0) {
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        
        let filtered = list;
        
        // Filter to only include announcements from the last 24 hours
        const activeAnnouncements = filtered.filter(a => {
          const createdTime = new Date(a.createdAt).getTime();
          return createdTime >= oneDayAgo;
        });

        if (activeAnnouncements.length > 0) {
          // Only show the single latest active announcement
          setAnnouncements(activeAnnouncements.slice(0, 1));
          setVisible(true);
          setDismissed(false);
        } else {
          setAnnouncements([]);
          setVisible(false);
        }
      } else {
        setAnnouncements([]);
        setVisible(false);
      }
    } catch (err) {
      // silently fail – banner is non-critical
    }
  };

  if (!visible || dismissed || announcements.length === 0) return null;

  // Build a combined scrolling text from all announcements
  const marqueeText = announcements
    .map((a) => `📢 ${a.subject}: ${a.message}`)
    .join("     ✦     ");

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a6b3a 0%, #0f4d7a 100%)",
        color: "#fff",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderRadius: "10px",
        marginBottom: "16px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        overflow: "hidden",
        position: "relative",
        zIndex: 10,
        animation: "slideDown 0.4s ease"
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          background: "rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: "16px" }} />
      </div>

      {/* Scrolling marquee */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          position: "relative"
        }}
      >
        <span
          style={{
            display: "inline-block",
            animation: `marqueeScroll ${Math.max(20, marqueeText.length * 0.08)}s linear infinite`,
            fontSize: "13px",
            fontWeight: "500",
            letterSpacing: "0.02em"
          }}
        >
          {marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{marqueeText}
        </span>
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          flexShrink: 0,
          transition: "background 0.2s ease"
        }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
        title="Dismiss"
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: "12px" }} />
      </button>

      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBanner;
