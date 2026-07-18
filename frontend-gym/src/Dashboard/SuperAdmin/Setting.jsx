// src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { FaUser, FaLock, FaSave, FaTimes } from 'react-icons/fa';
import axiosInstance from '../../Api/axiosInstance';
import axios from 'axios';
import BaseUrl from '../../Api/BaseUrl';

const AdminSettings = () => {
  // State for profile photo URL
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('https://randomuser.me/api/portraits/men/46.jpg');
  
  // State for all form data
  const [settingsData, setSettingsData] = useState({
    // Profile Section
    fullName: '',
    email: '',
    phone: '',
    profilePhoto: null,

    // Password Section
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  // State for loading
  const [loading, setLoading] = useState(true);
  
  // State for showing success message
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // States for Global Notification Channel Manager
  const [notifChannels, setNotifChannels] = useState({
    welcome_note: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
    invoice: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
    templates: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
    free_trial_alert: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
    saas_renewal: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
    saas_payment_invoice: { EMAIL: true, WHATSAPP: true, APP_PUSH: true }
  });
  const [savingChannels, setSavingChannels] = useState(false);
  const [showChannelMessage, setShowChannelMessage] = useState(false);

  // Fetch user data and global notification settings on component mount
  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('User ID not found in localStorage');
          return;
        }

        // Fetch profile
        const profileResponse = await axiosInstance.get(`/auth/user/${userId}`);
        const userData = profileResponse.data.user;
        
        setSettingsData(prev => ({
          ...prev,
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone || '',
        }));
        
        if (userData.profileImage) {
          setProfilePhotoUrl(userData.profileImage);
        }

        // Fetch global settings
        const globalSettingsResponse = await axiosInstance.get('/global-settings');
        if (globalSettingsResponse.data && globalSettingsResponse.data.settings) {
          const settings = globalSettingsResponse.data.settings;
          const newChannels = {
            welcome_note: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
            invoice: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
            templates: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
            free_trial_alert: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
            saas_renewal: { EMAIL: false, WHATSAPP: false, APP_PUSH: false },
            saas_payment_invoice: { EMAIL: true, WHATSAPP: true, APP_PUSH: true }
          };

          const keys = ['welcome_note', 'invoice', 'templates', 'free_trial_alert', 'saas_renewal', 'saas_payment_invoice'];
          keys.forEach(key => {
            const arr = settings[`${key}_channel`] || [];
            arr.forEach(ch => {
              if (newChannels[key]) {
                newChannels[key][ch] = true;
              }
            });
          });

          setNotifChannels(newChannels);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings data:', error);
        setLoading(false);
      }
    };

    fetchAllSettings();
  }, []);

  const handleChannelCheckboxChange = (category, channel) => {
    setNotifChannels(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel]
      }
    }));
  };

  const handleSaveChannels = async (e) => {
    e.preventDefault();
    setSavingChannels(true);
    try {
      const payload = {};
      const keys = ['welcome_note', 'invoice', 'templates', 'free_trial_alert', 'saas_renewal', 'saas_payment_invoice'];
      keys.forEach(key => {
        const active = [];
        Object.entries(notifChannels[key]).forEach(([ch, isTrue]) => {
          if (isTrue) active.push(ch);
        });
        payload[`${key}_channel`] = active;
      });

      await axiosInstance.put('/global-settings', payload);
      setShowChannelMessage(true);
      setTimeout(() => setShowChannelMessage(false), 3000);
    } catch (err) {
      console.error('Error saving global settings:', err);
      alert('Failed to save notification channel settings. Please try again.');
    } finally {
      setSavingChannels(false);
    }
  };

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

  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('User not logged in. Please log in again.');
    return;
  }

  try {
    const requests = [];
    let profilePromise = null;
    if (settingsData.fullName.trim() || settingsData.email.trim() || (settingsData.phone || '').trim() || settingsData.profilePhoto) {
      const formData = new FormData();
      formData.append("fullName", settingsData.fullName.trim());
      formData.append("email", settingsData.email.trim());
      formData.append("phone", (settingsData.phone || '').trim());
      if (settingsData.profilePhoto instanceof File) {
        formData.append("profileImage", settingsData.profilePhoto);
      }
      
      profilePromise = axiosInstance.put(`/auth/user/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      requests.push(profilePromise);
    }

    // 📌 2. Password change (only if ALL 3 fields are non-empty after trim)
    const oldP = settingsData.oldPassword.trim();
    const newP = settingsData.newPassword.trim();
    const confirmP = settingsData.confirmNewPassword.trim();

    if (oldP && newP && confirmP) {
      if (newP !== confirmP) {
        alert('New passwords do not match.');
        return;
      }

      const passwordPromise = axios.put(`${BaseUrl}/auth/changepassword`, {
        id: userId,          // 🔑 CRITICAL — add user ID
        oldPassword: oldP,
        newPassword: newP
      });
      requests.push(passwordPromise);
    }
    else if (oldP || newP || confirmP) {
      // ⚠ Partial input
      alert('To change password, please fill all three password fields.');
      return;
    }

    // 🚀 Fire all required API calls
    if (requests.length === 0) {
      // Nothing to update
      alert('No changes to save.');
      return;
    }

    // Wait for all to complete
    const responses = await Promise.all(requests);

    // If profile was updated, find its response to update localStorage
    if (profilePromise) {
      const profileIndex = requests.indexOf(profilePromise);
      const profileRes = responses[profileIndex];
      if (profileRes && profileRes.data && profileRes.data.user) {
        const updatedUser = profileRes.data.user;
        const currentLocalUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = {
          ...currentLocalUser,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          profileImage: updatedUser.profileImage,
        };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        localStorage.setItem("userEmail", updatedUser.email);

        if (updatedUser.profileImage) {
          setProfilePhotoUrl(updatedUser.profileImage);
        }
      }
    }

    // ✅ Success!
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 3000);

    // Reset password fields only
    setSettingsData(prev => ({
      ...prev,
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    }));

  } catch (error) {
    console.error('Error saving settings:', error);

    let message = 'Failed to save settings. Please try again.';
    if (error.response) {
      const res = error.response;
      message = res.data?.message || res.data?.error || res.statusText || message;
      if (res.status === 401) {
        message = 'Session expired. Please log in again.';
        // Optional: auto-logout
        // localStorage.clear(); window.location.href = '/login';
      } else if (res.status === 400 && res.config.url.includes('changepassword')) {
        message = 'Incorrect current password.';
      }
    } else if (error.request) {
      message = 'Network error. Please check your internet connection.';
    }

    alert(message);
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
                    <label htmlFor="oldPassword" className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="oldPassword"
                      name="oldPassword"
                      value={settingsData.oldPassword}
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
                </div>
              </div>
            </div>

            {/* SECTION 3: Global Notification Channel Manager */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <span className="me-2">📢</span> Global Notification Channel Manager
                </h5>
                {showChannelMessage && (
                  <span className="text-success fw-bold small">✓ Saved Successfully</span>
                )}
              </div>
              <div className="card-body">
                <p className="text-muted small mb-4">
                  Select which communication channels (Email, WhatsApp, or App Push Notifications) will be used to send system notifications.
                </p>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle" style={{ minWidth: "600px" }}>
                    <thead className="table-light text-center">
                      <tr>
                        <th style={{ width: '40%' }} className="text-start">Notification Type</th>
                        <th>Email</th>
                        <th>WhatsApp</th>
                        <th>App Push</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1: Welcome Note */}
                      <tr>
                        <td className="fw-bold">
                          Welcome Note
                          <div className="text-muted fw-normal small">Sent automatically to new members on registration.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.welcome_note.EMAIL}
                              onChange={() => handleChannelCheckboxChange('welcome_note', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.welcome_note.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('welcome_note', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.welcome_note.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('welcome_note', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Invoice Bills */}
                      <tr>
                        <td className="fw-bold">
                          Invoice Bills
                          <div className="text-muted fw-normal small">Sent automatically to members when recording a plan payment.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.invoice.EMAIL}
                              onChange={() => handleChannelCheckboxChange('invoice', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.invoice.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('invoice', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.invoice.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('invoice', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Row 3: Marketing Templates */}
                      <tr>
                        <td className="fw-bold">
                          Marketing Templates
                          <div className="text-muted fw-normal small">Sent for scheduled marketing campaigns or blasts.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.templates.EMAIL}
                              onChange={() => handleChannelCheckboxChange('templates', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.templates.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('templates', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.templates.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('templates', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Row 4: Free Trial Alerts */}
                      <tr>
                        <td className="fw-bold">
                          Free Trial Registration Alerts
                          <div className="text-muted fw-normal small">Sent automatically to the Super Admin when a new Gym registers for a free trial.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.free_trial_alert.EMAIL}
                              onChange={() => handleChannelCheckboxChange('free_trial_alert', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.free_trial_alert.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('free_trial_alert', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.free_trial_alert.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('free_trial_alert', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
 
                      {/* Row 5: SaaS Subscription Renewal Alerts */}
                      <tr>
                        <td className="fw-bold">
                          SaaS Subscription Expiry / Renewal Alerts
                          <div className="text-muted fw-normal small">Sent automatically to Gym Admins (Owners) when their SaaS plan is expiring.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_renewal.EMAIL}
                              onChange={() => handleChannelCheckboxChange('saas_renewal', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_renewal.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('saas_renewal', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_renewal.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('saas_renewal', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Row 6: SaaS Payment Invoice / Receipt */}
                      <tr>
                        <td className="fw-bold">
                          SaaS Payment Invoice / Receipt
                          <div className="text-muted fw-normal small">Sent automatically to Gym Owners with PDF Tax Invoice link when subscription payment is received.</div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_payment_invoice?.EMAIL}
                              onChange={() => handleChannelCheckboxChange('saas_payment_invoice', 'EMAIL')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_payment_invoice?.WHATSAPP}
                              onChange={() => handleChannelCheckboxChange('saas_payment_invoice', 'WHATSAPP')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="form-check form-switch d-inline-block">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={notifChannels.saas_payment_invoice?.APP_PUSH}
                              onChange={() => handleChannelCheckboxChange('saas_payment_invoice', 'APP_PUSH')}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: '#6EB2CC', borderColor: '#6EB2CC' }}
                    onClick={handleSaveChannels}
                    disabled={savingChannels}
                  >
                    {savingChannels ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-1" /> Save Channels
                      </>
                    )}
                  </button>
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

export default AdminSettings;