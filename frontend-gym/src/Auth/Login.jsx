
// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Test credentials for the existing roles in database
  const testAccounts = [
    { role: "Super Admin", email: "superadmin@gmail.com", password: "123456" },
    { role: "Gym Owner (Admin)", email: "admin@gmail.com", password: "123456" },
    { role: "Member (Customer)", email: "member@gmail.com", password: "123456" },
    { role: "General Trainer", email: "generaltrainer1@gym.com", password: "123456" },
    { role: "Personal Trainer", email: "personal@gmail.com", password: "123456" },
    { role: "Receptionist", email: "receptionist@gmail.com", password: "123456" },
    { role: "Sales Agent", email: "salesagent@gmail.com", password: "123456" },
    { role: "Housekeeping", email: "housekeeping@gmail.com", password: "123456" },
  ];

  const fillCredentials = (testEmail, testPwd) => {
    setEmail(testEmail);
    setPassword(testPwd);
  };

  const roleRedirectMap = {
    SUPERADMIN: "/superadmin/dashboard",
    ADMIN: "/admin/admin-dashboard",
    GENERALTRAINER: "/generaltrainer/dashboard",
    PERSONALTRAINER: "/personaltrainer/dashboard",
    MEMBER: "/member/dashboard",
    HOUSEKEEPING: "/housekeeping/dashboard",
    RECEPTIONIST: "/receptionist/dashboard",
    SALES_AGENT: "/sales/dashboard",
    SUBADMIN: "/superadmin/dashboard",
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

      // ✅ Use roleName (not role) — as per your API response
      const normalizedRole = (user.roleName || "").toUpperCase().trim();

      // Save auth info in localStorage
      localStorage.setItem("authToken", token);
      localStorage.setItem("userRole", normalizedRole);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      const redirectPath = roleRedirectMap[normalizedRole] || "/";
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

                <button
                  type="submit"
                  className="btn btn-warning w-100 py-2"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* Quick Login Section for Testing */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="text-center fw-bold text-muted mb-3">Quick Login (Actual Roles)</h6>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {testAccounts.map((acc, index) => (
                    <button
                      key={index}
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => fillCredentials(acc.email, acc.password)}
                      title={`Email: ${acc.email} | Pass: ${acc.password}`}
                    >
                      {acc.role}
                    </button>
                  ))}
                </div>
                <small className="d-block text-center text-muted mt-2" style={{fontSize: "12px"}}>
                  Click a role to autofill its Email & Password.
                </small>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
