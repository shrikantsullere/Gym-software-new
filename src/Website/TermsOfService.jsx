import React from "react";
import { Link } from "react-router-dom";
import { FaFileSignature, FaArrowLeft, FaEnvelope, FaExclamationCircle, FaUserCheck } from "react-icons/fa";

const TermsOfService = () => {
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
            <FaFileSignature className="text-primary fs-4" />
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
          <h1 className="fw-bold display-4 mb-2">Terms of Service</h1>
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
                Welcome to Speed Fitness SaaS Platform. By registering an account, purchasing a subscription license, or using our dashboard features, you agree to comply with and be bound by the following Terms of Service. Please read them carefully.
              </p>

              {/* Section 1 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaUserCheck className="text-primary text-opacity-75" size={18} />
                  1. Acceptance & Agreement
                </h4>
                <p className="text-muted">
                  These Terms of Service ("Terms") govern your access to and use of the Speed Fitness Gym Management SaaS software, dashboard platforms, and SMS/WhatsApp integrations. By using our Services, you represent that you are at least 18 years old and possess the legal authority to bind your business organization.
                </p>
              </div>

              {/* Section 2 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaFileSignature className="text-primary text-opacity-75" size={18} />
                  2. Subscription Licenses & Account Onboarding
                </h4>
                <p className="text-muted">
                  We offer various subscription tiers (such as Basic, Gold, and Pro plans) with monthly or yearly billing cycles.
                </p>
                <ul className="text-muted pl-4">
                  <li className="mb-2"><strong>Onboarding Approvals:</strong> Gym Owners request plans via the landing page or subscription interface. Upon manual verification and fee receipt, the Super Admin activates the license and assigns secure temporary login credentials.</li>
                  <li className="mb-2"><strong>Renewals & Cancellations:</strong> Subscription renewals are processed manually or automatically. Accounts that fall behind on license payments will be locked and transitioned to "Expired" status after a 7-day grace period.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaExclamationCircle className="text-primary text-opacity-75" size={18} />
                  3. Acceptable Use Policy & Messaging Regulations
                </h4>
                <p className="text-muted">
                  As a Gym Owner, you are solely responsible for all content, notifications, and alerts sent to members and staff through your dashboard.
                </p>
                <div className="bg-light border-start border-primary border-4 p-3 rounded-end mb-3">
                  <p className="text-dark small fw-semibold mb-2">Anti-Spam WhatsApp Guidelines:</p>
                  <p className="text-muted small mb-0">
                    You must comply with Meta's Commerce Policy and WhatsApp Business Policy. You agree NOT to send unsolicited spam, promotional links without prior opt-in consent, or harassing messages to gym members. Violation of Meta policies will result in immediate suspension of your WhatsApp integration credits.
                  </p>
                </div>
                <p className="text-muted">
                  Gym Owners must enforce proper local password security and secure their login credentials to prevent unauthorized account access.
                </p>
              </div>

              {/* Section 4 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaExclamationCircle className="text-primary text-opacity-75" size={18} />
                  4. Limitation of Liability
                </h4>
                <p className="text-muted">
                  The SaaS Platform and its integrations are provided on an "as-is" and "as-available" basis. Speed Fitness SaaS does not guarantee 100% uninterrupted uptime or immediate message delivery via third-party telecom operators or Meta Cloud servers. In no event shall we be liable for lost profits, database corruption, or secondary operational delays.
                </p>
              </div>

              {/* Section 5 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaEnvelope className="text-primary text-opacity-75" size={18} />
                  5. Customer Support & Inquiries
                </h4>
                <p className="text-muted mb-0">
                  For subscription inquiries, technical troubleshooting, billing discrepancies, or API settings assistance, please contact our support department:
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

export default TermsOfService;
