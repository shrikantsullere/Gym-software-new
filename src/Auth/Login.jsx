
// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



  const roleRedirectMap = {
    SUPERADMIN: "/superadmin/dashboard",
    SUBADMIN: "/superadmin/dashboard",
    ADMIN: "/admin/admin-dashboard",
    MANAGER: "/manager/dashboard",
    GENERALTRAINER: "/generaltrainer/dashboard",
    GENERAL_TRAINER: "/generaltrainer/dashboard",
    TRAINER: "/generaltrainer/dashboard",
    PERSONALTRAINER: "/personaltrainer/dashboard",
    PERSONAL_TRAINER: "/personaltrainer/dashboard",
    MEMBER: "/member/dashboard",
    RECEPTIONIST: "/receptionist/dashboard",
    SALES_AGENT: "/sales/dashboard",
    SALESAGENT: "/sales/dashboard",
    HOUSEKEEPING: "/staff/announcements",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      const { token, user } = response.data;

      // ✅ Normalize role string to handle all variations (e.g. "sales_agent", "Sales Agent", "personaltrainer", "Personal Trainer")
      const rawRole = user.roleName || "";
      const normalizedRole = rawRole.toUpperCase().replace(/\s+|-/g, "_").trim();

      // Save auth info in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      const redirectPath = roleRedirectMap[normalizedRole] || (roleRedirectMap[rawRole.toUpperCase()] || "/");
      navigate(redirectPath);
    } catch (err) {
      console.error("Login error:", err);
      const msg = err.response?.data?.message || "Invalid email or password";
      setError(msg);
      // ❌ Removed alert — better UX to show inline error only
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 position-relative">
      {/* Back Arrow to Home Page */}
      <button 
        onClick={() => navigate("/")} 
        style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
        }}
        title="Go to Home"
      >
        <span style={{ fontSize: "20px", color: "#475569", fontWeight: "bold", transform: "translateY(-1px)" }}>←</span>
      </button>

      <div className="card shadow w-100" style={{ maxWidth: "950px", borderRadius: "1.5rem" }}>
        <div className="row g-0">
          <div className="col-md-6 d-none d-md-block">
            <img
              src="https://hips.hearstapps.com/hmg-prod/images/muscular-man-doing-pushup-exercise-with-dumbbell-royalty-free-image-1728661212.jpg?crop=0.668xw:1.00xh;0.00680xw,0&resize=640:*"
             alt="login"   className="img-fluid rounded-start"   style={{ height: "100%", objectFit: "cover" }} />
          </div>

          <div className="col-md-6 d-flex align-items-center p-5">
            <div className="w-100">
              <h2 className="fw-bold mb-3 text-center">Welcome Back!</h2>
              <p className="text-muted text-center mb-4">Please login to your account</p>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger mb-3" role="alert"> {error}</div> )}

                <div className="mb-3">
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="mb-3 position-relative">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y pe-3"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer", zIndex: 10 }}
                    >
                      {showPassword ? (
                        <i className="bi bi-eye-slash-fill"></i>
                      ) : (
                        <i className="bi bi-eye-fill"></i>
                      )}
                    </span>
                  </div>
                </div>

                <div className="d-flex justify-content-end mb-3">
                  <Link to="/forgot-password" className="text-decoration-none" style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-warning w-100 py-2"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
