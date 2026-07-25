import React from "react";
import { Link } from "react-router-dom";
import { FaInfoCircle, FaArrowLeft, FaCheckCircle, FaUsers, FaChartLine } from "react-icons/fa";

const AboutUs = () => {
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
            <FaInfoCircle className="text-primary fs-4" />
            <span className="fw-bold text-dark fs-5">Gymsoft</span>
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
          <h1 className="fw-bold display-4 mb-2">About Us</h1>
          <p className="opacity-90 lead mb-0">Empowering Gym Owners with Gymsoft</p>
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
              <p className="text-muted mb-4 lead text-center">
                Welcome to <strong>Gymsoft</strong>, the ultimate Gym Management Software designed to streamline your fitness center's operations, engage your members, and scale your business effortlessly.
              </p>

              {/* Section 1 */}
              <div className="mb-5 mt-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaChartLine className="text-primary text-opacity-75" size={24} />
                  Our Mission
                </h4>
                <p className="text-muted">
                  At Gymsoft, our mission is to empower gym owners, trainers, and fitness professionals with a comprehensive, easy-to-use platform that handles everything from membership tracking to automated billing and attendance management. We believe that technology should work for you, so you can focus on what truly matters: helping your members achieve their fitness goals.
                </p>
              </div>

              {/* Section 2 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaCheckCircle className="text-primary text-opacity-75" size={24} />
                  Why Choose Gymsoft?
                </h4>
                <p className="text-muted">
                  We understand the daily challenges of running a modern fitness center. That's why Gymsoft offers:
                </p>
                <ul className="text-muted pl-4">
                  <li className="mb-2"><strong>All-in-One Dashboard:</strong> Get a complete overview of your gym's health, from active members to monthly revenue.</li>
                  <li className="mb-2"><strong>Seamless Automation:</strong> Automate payment reminders, check-ins, and membership renewals.</li>
                  <li className="mb-2"><strong>Advanced Analytics:</strong> Track growth and make data-driven decisions.</li>
                  <li className="mb-2"><strong>Multi-Tenant Architecture:</strong> Secure, isolated data storage ensuring complete privacy for your business.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="mb-5">
                <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                  <FaUsers className="text-primary text-opacity-75" size={24} />
                  Our Community
                </h4>
                <p className="text-muted">
                  Gymsoft is more than just software; it's a growing community of fitness entrepreneurs who are transforming the industry. By choosing Gymsoft, you join thousands of successful gym owners who have optimized their operations and increased their profitability.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Mini Footer */}
      <footer className="bg-white border-top py-4 text-center text-muted small">
        <p className="mb-0">&copy; {new Date().getFullYear()} Gymsoft. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AboutUs;
