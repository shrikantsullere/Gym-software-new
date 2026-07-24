import React, { useState } from 'react';


const Profile = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Handle update logic
    alert('Profile updated!');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!formData.currentPassword || !formData.newPassword) {
      alert("Please fill in current and new password.");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const userId = user.id || user.userId;

      const res = await axiosInstance.put("auth/changepassword", {
        id: userId,
        oldPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.data?.success) {
        alert("Password updated successfully!");
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      } else {
        alert("Failed to update password: " + (res.data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Password update error:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">User Profile</h2>

      {/* Profile Info */}
      <form onSubmit={handleProfileUpdate} className="mb-5">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Address</label>
          <textarea
            className="form-control"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your address"
            rows={3}
            required
          />
        </div>

        <button type="submit" className="btn btn-warning text-white">Update Profile</button>
      </form>

      {/* Password Update */}
      <h4 className="mb-3">Change Password</h4>
      <form onSubmit={handlePasswordUpdate}>
        <div className="mb-3">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            className="form-control"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter new password"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" className="btn btn-success">Update Password</button>
      </form>
    </div>
  );
};

export default Profile;
