import React from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaEnvelope, FaLock, FaCheckCircle } from "react-icons/fa";

const PrivacyPolicy = () => {
  return (
    <div style={{ backgroundColor: "#f8f9fc", minHeight: "100vh", fontFamily: "Outfit, sans-serif" }}>
      {/* Navigation Header */}
      <header className="bg-white border-bottom py-3 sticky-top shadow-sm">
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-flex align-items-center text-dark gap-2">
            <FaArrowLeft className="text-primary" />
            <span className="fw-semibold small">Back to Home</span>
          </Link>
          <div className="d-flex align-items-center gap-2">
            <FaShieldAlt className="text-primary fs-4" />
            <span className="fw-bold text-dark fs-5">Speed Fitness SaaS</span>
          </div>
        </div>
      </header>

      {/* Main Banner */}
      <section 
        className="text-white py-5 text-center position-relative" 
        style={{ 
          background: "linear-gradient(135deg, #4318FF 0%, #868CFF 100%)",
          overflow: "hidden" 
        }}
      >
        <div className="container py-4 position-relative" style={{ zIndex: 2 }}>
          <h1 className="fw-bold display-4 mb-2">Privacy Policy</h1>
          <p className="opacity-90 lead mb-0">Last Updated: July 4, 2026</p>
        </div>
        <div 
          className="position-absolute start-0 top-0 w-100 h-100 opacity-10" 
          style={{ 
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", 
            backgroundSize: "20px 20px" 
          }}
        />
      </section>

      {/* Content Container */}
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border border-light">
              <p className="text-muted mb-4 lead">
                Welcome to Speed Fitness SaaS Platform. Your privacy is of paramount importance to us. This Privacy Policy outlines how we collect, store, process, and protect your information when you subscribe to our services, use our Gym Management Dashboard, or receive notifications.
              </p>

              {/* Section 1 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaCheckCircle className="text-primary text-opacity-75" size={18} />
                  1. Information We Collect
                </h4>
                <p className="text-muted">
                  We collect information necessary to deliver and improve our Gym Management SaaS Services. This includes:
                </p>
                <ul className="text-muted pl-4">
                  <li className="mb-2"><strong>Gym Account Credentials:</strong> Gym Name, Owner Name, Contact Email, Contact Phone, and Billing Details.</li>
                  <li className="mb-2"><strong>Staff & Trainer Records:</strong> Names, contact info, shift timings, and roles assigned by Gym Owners.</li>
                  <li className="mb-2"><strong>Member Enrollment Info:</strong> Member Names, Email, Phone, plan details, attendance records, check-in history, and health log indexes (weight, height, BMI) stored by Gym Owners.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaCheckCircle className="text-primary text-opacity-75" size={18} />
                  2. Consent for Communications (SMS & WhatsApp API)
                </h4>
                <p className="text-muted">
                  Our SaaS platform integrates with messaging services, including Meta's WhatsApp Business Cloud API and SMS gateways, to automate gym operations.
                </p>
                <div className="bg-light border-start border-primary border-4 p-3 rounded-end mb-3">
                  <p className="text-dark small fw-semibold mb-2">Notice for Members and Staff:</p>
                  <p className="text-muted small mb-0">
                    By registering with a gym tenant using our software, you explicitly consent to receive transactional and operational notifications (such as registration welcome notes, OTP verification codes, payment receipts, subscription expiration alerts, and shift schedules) sent on behalf of your Gym Owner via SMS, Email, and WhatsApp.
                  </p>
                </div>
                <p className="text-muted">
                  You may opt-out or adjust your notification preferences by contacting your Gym Administrator or replying to the message templates with "STOP" where supported.
                </p>
              </div>

              {/* Section 3 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaLock className="text-primary text-opacity-75" size={18} />
                  3. Data Security & Storage
                </h4>
                <p className="text-muted">
                  We implement robust technical and organizational measures to safeguard your personal data:
                </p>
                <ul className="text-muted pl-4">
                  <li className="mb-2"><strong>Encryption:</strong> Sensitive information (such as passwords) is hashed using strong cryptographic methods (bcrypt) before storage. Data in transit is protected using SSL/TLS encryption.</li>
                  <li className="mb-2"><strong>Database Boundaries (Multi-Tenancy):</strong> We enforce strict database isolation policies. One Gym Owner's data (members, leads, revenue) is strictly isolated and can never be accessed by another Gym Owner or third parties.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaCheckCircle className="text-primary text-opacity-75" size={18} />
                  4. Third-Party Integrations
                </h4>
                <p className="text-muted">
                  We integrate with secure third-party platforms to provide standard platform functionalities:
                </p>
                <ul className="text-muted pl-4">
                  <li className="mb-2"><strong>Payment Processing:</strong> Online payment operations (such as member plan payments or subscription renewals) are handled securely via third-party payment gateways like Razorpay. We do not store credit card or banking credentials.</li>
                  <li className="mb-2"><strong>Developer API Infrastructure:</strong> Messaging delivery logs and notifications are routed securely via official partner platforms (such as Meta for WhatsApp Business and SendGrid for Email services).</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaEnvelope className="text-primary text-opacity-75" size={18} />
                  5. Contact Us
                </h4>
                <p className="text-muted mb-0">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please reach out to us:
                </p>
                <p className="text-primary fw-semibold mt-2">
                  Email: support@speedfitness-saas.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="bg-white border-top py-4 text-center text-muted small">
        <p className="mb-0">&copy; {new Date().getFullYear()} Speed Fitness SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
