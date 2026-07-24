import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../Api/axiosInstance";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password", { email });
      if (res.data.success) {
        toast.success(res.data.message);
        setStep(2);
        setTimeLeft(600);
      } else {
        toast.error(res.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/verify-forgot-password-otp", { email, otp: otpValue });
      if (res.data.success) {
        toast.success(res.data.message);
        setResetToken(res.data.resetToken);
        setStep(3);
      } else {
        toast.error(res.data.message || "Invalid OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/resend-forgot-password-otp", { email });
      if (res.data.success) {
        toast.success(res.data.message);
        setTimeLeft(600);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error(res.data.message || "Failed to resend OTP.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Please wait before resending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pass) => {
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return passRegex.test(pass);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword(newPassword)) {
      toast.error("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/auth/reset-password", { 
        email, 
        resetToken, 
        newPassword, 
        confirmPassword 
      });

      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/login");
      } else {
        toast.error(res.data.message || "Failed to reset password.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light p-4">
      <div className="card shadow-lg w-100" style={{ maxWidth: "500px", borderRadius: "2rem" }}>
        <div className="p-5 text-center">
          <div className="d-flex justify-content-center align-items-center mb-4">
            <img
              src="https://i.postimg.cc/mZHz3k1Q/Whats-App-Image-2025-07-23-at-12-38-03-add5b5dd-removebg-preview-1.png"
              alt="logo"
              className="navbar-logo m-2"
              style={{ height: "51px" }}
            />
          </div>

          {step === 1 && (
            <>
              <h2 className="h5 text-secondary mt-3">Forgot Password?</h2>
              <p className="text-muted mb-4">Enter your email to receive a password reset OTP.</p>
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-3 position-relative">
                  <i className="bi bi-envelope position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type="email"
                    className="form-control ps-5"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-warning w-100 text-white fw-semibold mb-3" disabled={isLoading}>
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
                  Send OTP
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="h5 text-secondary mt-3">Verify OTP</h2>
              <p className="text-muted mb-4">Enter the 6-digit code sent to <strong>{email}</strong></p>
              <form onSubmit={handleOtpSubmit}>
                <div className="d-flex justify-content-center gap-2 mb-4">
                  {otp.map((data, index) => (
                    <input
                      className="form-control text-center"
                      type="text"
                      name="otp"
                      maxLength="1"
                      key={index}
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onFocus={(e) => e.target.select()}
                      style={{ width: "45px", height: "50px", fontSize: "20px", fontWeight: "bold" }}
                      required
                    />
                  ))}
                </div>
                
                <div className="mb-3 text-muted">
                  Time remaining: <span className="fw-bold">{formatTime(timeLeft)}</span>
                </div>

                <button type="submit" className="btn btn-warning w-100 text-white fw-semibold mb-3" disabled={isLoading || timeLeft === 0}>
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
                  Verify OTP
                </button>
                
                <button type="button" className="btn btn-link text-decoration-none" onClick={handleResendOtp} disabled={isLoading}>
                  Resend OTP
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="h5 text-secondary mt-3">Reset Password</h2>
              <p className="text-muted mb-4">Create a new secure password.</p>
              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3 position-relative">
                  <i className="bi bi-lock position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control ps-5"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <i 
                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute top-50 end-0 translate-middle-y me-3 text-secondary`}
                    style={{cursor: 'pointer'}}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>
                
                <div className="mb-3 text-start px-2" style={{fontSize: '0.8rem'}}>
                  <div className={newPassword.length >= 8 ? 'text-success' : 'text-danger'}>
                    <i className={`bi ${newPassword.length >= 8 ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> Min 8 characters
                  </div>
                  <div className={/[A-Z]/.test(newPassword) ? 'text-success' : 'text-danger'}>
                    <i className={`bi ${/[A-Z]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Uppercase letter
                  </div>
                  <div className={/[a-z]/.test(newPassword) ? 'text-success' : 'text-danger'}>
                    <i className={`bi ${/[a-z]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Lowercase letter
                  </div>
                  <div className={/\d/.test(newPassword) ? 'text-success' : 'text-danger'}>
                    <i className={`bi ${/\d/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Number
                  </div>
                  <div className={/[\W_]/.test(newPassword) ? 'text-success' : 'text-danger'}>
                    <i className={`bi ${/[\W_]/.test(newPassword) ? 'bi-check-circle-fill' : 'bi-x-circle'} me-2`}></i> 1 Special character
                  </div>
                </div>

                <div className="mb-4 position-relative">
                  <i className="bi bi-lock-fill position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control ps-5"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-warning w-100 text-white fw-semibold mb-3" disabled={isLoading}>
                  {isLoading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : null}
                  Update Password
                </button>
              </form>
            </>
          )}

          <div className="text-center mt-3">
            <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: "#1f2937" }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
