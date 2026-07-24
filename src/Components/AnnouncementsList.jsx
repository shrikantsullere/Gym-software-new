import React, { useState, useEffect } from "react";
import axiosInstance from "../Api/axiosInstance";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBullhorn, faClock, faEnvelopeOpenText, faUserTie, faUser } from "@fortawesome/free-solid-svg-icons";

const AnnouncementsList = ({ roleGroup }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axiosInstance.get(`/notif/user-announcements?roleGroup=${roleGroup}`);
        if (res.data?.success) {
          setAnnouncements(res.data.announcements || []);
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [roleGroup]);

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 rounded-circle text-white d-flex align-items-center justify-content-center shadow" 
                 style={{ backgroundColor: "#198754", width: "60px", height: "60px" }}>
              <FontAwesomeIcon icon={faBullhorn} size="lg" />
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: "#2d3748" }}>Gym Announcements</h2>
              <p className="text-muted mb-0">Latest notices, updates, and offers from the Gym.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-lg-10 mx-auto">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}></div>
              <p className="text-muted mt-3">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: "15px" }}>
              <div className="text-muted mb-3">
                <FontAwesomeIcon icon={faEnvelopeOpenText} size="4x" />
              </div>
              <h4 className="fw-bold text-secondary">No Announcements Yet</h4>
              <p className="text-muted">You're all caught up! There are no notices to display.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="card border-0 shadow-sm position-relative overflow-hidden" style={{ borderRadius: "15px" }}>
                  <div className="position-absolute top-0 start-0 h-100" style={{ width: "6px", backgroundColor: "#198754" }}></div>
                  <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3"
                      style={{ 
                        width: "45px", 
                        height: "45px", 
                        backgroundColor: "#198754",
                        fontSize: "18px"
                      }}
                    >
                      {ann.senderName ? ann.senderName.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div>
                      <h5 className="card-title fw-bold text-dark mb-1">{ann.subject}</h5>
                      <div className="d-flex align-items-center text-muted" style={{ fontSize: "13px" }}>
                        <FontAwesomeIcon icon={faClock} className="me-1" />
                        {new Date(ann.createdAt).toLocaleString("en-GB", {
                          day: "2-digit", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                        <span className="mx-2">•</span>
                        <FontAwesomeIcon icon={faUser} className="me-1" />
                        {ann.senderName || "Admin"}
                      </div>
                    </div>
                  </div>

                  {ann.imageUrl && (
                    <div className="mb-3 text-center">
                      <img 
                        src={ann.imageUrl} 
                        alt="Announcement" 
                        className="img-fluid rounded shadow-sm" 
                        style={{ maxHeight: "300px", objectFit: "contain" }}
                      />
                    </div>
                  )}

                  <p className="card-text text-secondary mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                    {ann.message}
                  </p>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsList;
