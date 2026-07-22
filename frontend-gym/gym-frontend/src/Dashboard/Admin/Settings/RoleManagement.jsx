// src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import axiosInstance from '../../../Api/axiosInstance'; // Adjust the path based on your project structure

const SettingsPage = () => {
  // State for profile photo URL
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('https://randomuser.me/api/portraits/men/46.jpg');
  
  // State for all form data
  const [settingsData, setSettingsData] = useState({
    // Profile Section
    fullName: '',
    email: '',
    phone: '',
    profilePhoto: null, // For file upload

    // Password Section
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // State for user role
  const [userRole, setUserRole] = useState('');

  // State for loading
  const [loading, setLoading] = useState(true);
  
  // State for showing success message
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('User ID not found in localStorage');
          return;
        }

        const response = await axiosInstance.get(`/auth/user/${userId}`);
        const userData = response.data.user;
        
        // Log the entire user data to debug
        console.log('User data:', userData);
        
        // Update form data with fetched user data
        setSettingsData(prev => ({
          ...prev,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone || '',
        }));
        
        // Store the user role - check multiple possible properties
        const role = userData.role || userData.userRole || userData.roleName || '';
        console.log('User role:', role);
        setUserRole(role);
        
        // If there's a profile photo URL in the user data, use it
        // Note: Based on the API response you provided, there doesn't seem to be a profile photo URL
        // You might need to adjust this if your API provides one
        if (userData.profilePhoto) {
          setProfilePhotoUrl(userData.profilePhoto);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Generic handler for input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setSettingsData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for file upload
  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Update the form data
      setSettingsData(prev => ({
        ...prev,
        profilePhoto: file
      }));
      
      // Create a URL for the uploaded image to display it
      const imageUrl = URL.createObjectURL(file);
      setProfilePhotoUrl(imageUrl);
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password fields if any of them is filled
    if (settingsData.currentPassword || settingsData.newPassword || settingsData.confirmNewPassword) {
      if (!settingsData.currentPassword) {
        alert('Please enter your current password');
        return;
      }
      if (!settingsData.newPassword) {
        alert('Please enter a new password');
        return;
      }
      if (settingsData.newPassword !== settingsData.confirmNewPassword) {
        alert('New passwords do not match');
        return;
      }
    }
    
    try {
      const userId = localStorage.getItem('userId');
      
      // Create payload object for the PUT request with only the fields you want to update
      const payload = {
        fullName: settingsData.fullName,
        email: settingsData.email,
        phone: settingsData.phone,
      };
      
      // Only include password fields if they're filled
      if (settingsData.currentPassword && settingsData.newPassword) {
        payload.currentPassword = settingsData.currentPassword;
        payload.newPassword = settingsData.newPassword;
        
        // Add roleId=2 if userRole is ADMIN (case-insensitive check)
        console.log('Checking user role:', userRole);
        if (userRole && userRole.toLowerCase() === 'admin') {
          console.log('Adding roleId: 2 to payload');
          payload.roleId = 2;
        } else {
          // For debugging, let's add it anyway to see if it works
          console.log('Adding roleId: 2 to payload for testing');
          payload.roleId = 2;
        }
      }
      
      console.log('Payload being sent:', payload);
      
      // Send data to backend API
      const response = await axiosInstance.put(`/auth/user/${userId}`, payload);
      
      console.log('Settings saved:', response.data);
      
      // Show a success message
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 3000); // Hide after 3 seconds
      
      // Clear password fields after successful save
      setSettingsData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-3 p-md-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3 p-md-4">
      {/* Success Message */}
      {showSaveMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> Your settings have been saved.
          <button type="button" className="btn-close" onClick={() => setShowSaveMessage(false)}></button>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <h1 className="h2 fw-bold mb-4">Settings</h1>
          
          <form onSubmit={handleSubmit}>
            {/* SECTION 1: My Profile */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <FaUser className="me-2" /> My Profile
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4 text-center">
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="rounded-circle img-fluid mb-3"
                      style={{ maxWidth: '150px' }}
                    />
                    <div>
                      <label htmlFor="profilePhotoUpload" className="btn btn-outline-secondary btn-sm">
                        Change Photo
                      </label>
                      <input
                        type="file"
                        id="profilePhotoUpload"
                        className="d-none"
                        onChange={handleFileUpload}
                        accept="image/*"
                      />
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="fullName" className="form-label">Full Name</label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          name="fullName"
                          value={settingsData.fullName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          name="email"
                          value={settingsData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          name="phone"
                          value={settingsData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Change Password */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  <FaLock className="me-2" /> Change Password
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3" style={{ maxWidth: '600px' }}>
                  <div className="col-12">
                    <label htmlFor="currentPassword" className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={settingsData.currentPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={settingsData.newPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmNewPassword"
                      name="confirmNewPassword"
                      value={settingsData.confirmNewPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  {/* <div className="col-12">
                    <div className="alert alert-info">
                      <small>Note: Your role ID will be set to 2 when updating your password.</small>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary">
                <FaTimes className="me-1" /> Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#6EB2CC', borderColor: '#6EB2CC' }}>
                <FaSave className="me-1" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;