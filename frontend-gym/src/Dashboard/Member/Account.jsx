import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import GetAdminId from "../../Api/GetAdminId";
import axiosInstance from "../../Api/axiosInstance";
import ImageCropper from "../../Components/ImageCropper";
import MemberPlansDisplay from "../../Components/MemberPlansDisplay";

const Account = () => {
  const adminId = GetAdminId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  const [personal, setPersonal] = useState({
    member_id: "M23456789",
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    profile_picture: null,
    profile_preview: "https://randomuser.me/api/portraits/men/32.jpg",
  });

  const [membership, setMembership] = useState({
    membership_plan: "",
    plan_start_date: "",
    plan_end_date: "",
    status: "",
    membership_type: "",
    membership_fee: "",
  });
  const [assignedPlans, setAssignedPlans] = useState([]); // ✅ Multiple plans

  const [gymInfo, setGymInfo] = useState({
    gymName: "",
    gstNumber: "",
    gymAddress: "",
    tax: "5",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    newMatch: "",
    minLength: "",
  });

  const getFallbackAvatar = (gender) => {
    if (gender === "Female") return "https://randomuser.me/api/portraits/women/44.jpg";
    return "https://randomuser.me/api/portraits/men/32.jpg";
  };

  // ✅ Extract fetch logic into reusable function
  const fetchProfile = async () => {
    if (!adminId) {
      setError("Admin ID not found. Please log in again.");
      setShowErrorAlert(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`member-self/profile/${adminId}`);

      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;

        const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
        setUserRole(profile.role || storedRole || "MEMBER");

        let profileImageUrl = profile.profileImage?.trim() || getFallbackAvatar(profile.gender);

        setPersonal({
          member_id: `M${profile.userId}`,
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          gender: profile.gender || "",
          dob: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : "",
          email: profile.email || "",
          phone: profile.phone || "",
          address_street: profile.address_street || "",
          address_city: profile.address_city || "",
          address_state: profile.address_state || "",
          address_zip: profile.address_zip || "",
          profile_picture: null,
          profile_preview: profileImageUrl,
        });

        setMembership({
          membership_plan: profile.membership_plan || "",
          plan_start_date: profile.plan_start_date || "",
          plan_end_date: profile.plan_end_date || "",
          status: profile.membership_status || "",
          membership_type: profile.membership_type || "Standard",
          membership_fee: profile.membership_fee?.toString() || "",
        });
        setAssignedPlans(profile.assignedPlans || []); // ✅ Set multiple plans

        setGymInfo({
          gymName: profile.gymName || "",
          gstNumber: profile.gstNumber || "",
          gymAddress: profile.gymAddress || "",
          tax: profile.tax?.toString() || "5",
        });

        setError(null);
        setShowErrorAlert(false);
      } else {
        setError("Data not found");
        setShowErrorAlert(true);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setError("Failed to load profile");
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [adminId]);

  const handlePersonalChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_picture" && files?.[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      setPersonal((p) => ({ ...p, [name]: value }));
    }
  };

  const handleCropComplete = (croppedImage) => {
    const file = new File([croppedImage.blob], "profile.jpg", { type: "image/jpeg" });
    setPersonal((p) => ({
      ...p,
      profile_picture: file,
      profile_preview: croppedImage.url,
    }));
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleMembershipChange = (e) => {
    const { name, value } = e.target;
    setMembership((m) => ({ ...m, [name]: value }));
  };

  const handleGymInfoChange = (e) => {
    const { name, value } = e.target;
    setGymInfo((g) => ({ ...g, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword((p) => ({ ...p, [name]: value }));

    if (name === "new") {
      setPasswordErrors((prev) => ({
        ...prev,
        minLength: value.length < 8 ? "Password must be at least 8 characters" : "",
        newMatch: password.confirm && value !== password.confirm ? "Passwords do not match" : "",
      }));
    }

    if (name === "confirm") {
      setPasswordErrors((prev) => ({
        ...prev,
        newMatch: value !== password.new ? "Passwords do not match" : "",
      }));
    }
  };

  const handleEditModeToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      setPersonal((prev) => ({
        ...prev,
        profile_picture: null,
        profile_preview: prev.profile_preview,
      }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (isEditMode) {
      setSaving(true);
      try {
        const formData = new FormData();
        formData.append("first_name", personal.first_name);
        formData.append("last_name", personal.last_name);
        formData.append("email", personal.email);
        formData.append("phone", personal.phone);
        formData.append("gender", personal.gender || "");
        formData.append("date_of_birth", personal.dob || "");
        formData.append("address_street", personal.address_street);
        formData.append("address_city", personal.address_city);
        formData.append("address_state", personal.address_state);
        formData.append("address_zip", personal.address_zip);

        if (userRole === "ADMIN") {
          formData.append("gstNumber", gymInfo.gstNumber || "");
          formData.append("gymAddress", gymInfo.gymAddress || "");
          formData.append("tax", gymInfo.tax || "5");
        }

        if (personal.profile_picture) {
          formData.append("profileImage", personal.profile_picture);
        }

        const response = await axiosInstance.put(`member-self/profile/${adminId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (response.data.success) {
          alert("Profile updated successfully!");
          await fetchProfile(); // ✅ Auto-refresh profile from server
          setIsEditMode(false);
        } else {
          alert("Failed to update profile. Please try again.");
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        alert("Failed to update profile. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setIsEditMode(true);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!password.new || !password.confirm || passwordErrors.minLength || passwordErrors.newMatch) {
      alert("Please fix password errors before saving.");
      return;
    }
    if (password.new !== password.confirm) {
      alert("New passwords do not match!");
      return;
    }
    if (password.current.trim() === "") {
      alert("Current password is required!");
      return;
    }

    try {
      setUpdatingPassword(true);
      const payload = {
        current: password.current,
        new: password.new,
      };

      const response = await axiosInstance.put(`member-self/password/${adminId}`, payload);

      if (response.data.success) {
        alert("Password updated successfully!");
        setPassword({ current: "", new: "", confirm: "" });
      } else {
        alert("Failed to update password. Please try again.");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      alert("Failed to update password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const todayISO = format(new Date(), "yyyy-MM-dd");

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="">
      {showErrorAlert && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          <strong>Warning!</strong> {error || "Data not found"}.
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowErrorAlert(false)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="fw-bold mb-0">Personal Information</h1>
                <button
                  className={`btn ${isEditMode ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleEditModeToggle}
                >
                  {isEditMode ? 'Cancel' : 'Update Profile'}
                </button>
              </div>

              <div className="text-center mb-4">
                <img
                  src={personal.profile_preview}
                  alt="Profile"
                  className="rounded-circle mb-3"
                  style={{ width: "120px", height: "120px", objectFit: "cover", border: "2px solid #e9ecef" }}
                />
                {isEditMode && (
                  <div>
                    <label htmlFor="profile_picture" className="btn btn-outline-primary btn-sm">
                      Change Photo
                    </label>
                    <input
                      type="file"
                      id="profile_picture"
                      name="profile_picture"
                      accept="image/*"
                      className="d-none"
                      onChange={handlePersonalChange}
                    />
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdateProfile}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Member ID</label>
                    <input className="form-control" value={personal.member_id} readOnly />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      name="first_name"
                      className="form-control"
                      value={personal.first_name}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      name="last_name"
                      className="form-control"
                      value={personal.last_name}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Gender</label>
                    <select
                      name="gender"
                      className="form-select"
                      value={personal.gender}
                      onChange={handlePersonalChange}
                      disabled={!isEditMode}
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className="form-control"
                      value={personal.dob}
                      onChange={handlePersonalChange}
                      max={todayISO}
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={personal.email}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">
                      Phone <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      value={personal.phone}
                      onChange={handlePersonalChange}
                      required
                      readOnly={!isEditMode}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address (optional)</label>
                    <div className="row g-2">
                      <div className="col-12">
                        <input
                          name="address_street"
                          className="form-control"
                          placeholder="Street address"
                          value={personal.address_street}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <input
                          name="address_city"
                          className="form-control"
                          placeholder="City"
                          value={personal.address_city}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-6 col-sm-3">
                        <input
                          name="address_state"
                          className="form-control"
                          placeholder="State"
                          value={personal.address_state}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                      <div className="col-6 col-sm-3">
                        <input
                          name="address_zip"
                          className="form-control"
                          placeholder="Zip / Pincode"
                          value={personal.address_zip}
                          onChange={handlePersonalChange}
                          readOnly={!isEditMode}
                        />
                      </div>
                    </div>
                  </div>

                  {userRole === "ADMIN" && (
                    <>
                      <div className="col-12">
                        <hr className="my-3" />
                        <h6 className="fw-bold text-primary mb-3">Gym Information</h6>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Gym Name</label>
                        <input
                          name="gymName"
                          className="form-control"
                          value={gymInfo.gymName}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="Enter gym name"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Gym Address</label>
                        <textarea
                          name="gymAddress"
                          className="form-control"
                          rows="2"
                          value={gymInfo.gymAddress}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="Full gym address"
                        ></textarea>
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">GST Number</label>
                        <input
                          name="gstNumber"
                          className="form-control"
                          value={gymInfo.gstNumber}
                          onChange={handleGymInfoChange}
                          readOnly={!isEditMode}
                          placeholder="e.g. 29ABCDE1234F1Z5"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="form-label">Tax Rate</label>
                        <select
                          name="tax"
                          className="form-select"
                          value={gymInfo.tax}
                          onChange={handleGymInfoChange}
                          disabled={!isEditMode}
                        >
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                {isEditMode && (
                  <div className="d-flex gap-2 mt-4">
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={handleEditModeToggle}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {userRole === "MEMBER" && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Membership Information</h5>
                {assignedPlans && assignedPlans.length > 0 ? (
                  <div>
                    <MemberPlansDisplay plans={assignedPlans} compact={false} />
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label">Membership Plan</label>
                      <input
                        className="form-control"
                        value={membership.membership_plan}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={membership.plan_start_date}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={membership.plan_end_date}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Status</label>
                      <input
                        className="form-control"
                        value={membership.status || "N/A"}
                        readOnly
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <label className="form-label">Membership Type</label>
                      <input
                        className="form-control"
                        value={membership.membership_type}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-sm-3">
                      <label className="form-label">Membership Fee</label>
                      <input
                        type="text"
                        className="form-control"
                        value={membership.membership_fee ? `₹${membership.membership_fee}` : "Free"}
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Change Password</h5>
              <p className="text-muted small">
                Enter your current password and set a new one. Password must be at least 8 characters.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <label className="form-label">
                    Current Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    name="current"
                    className="form-control"
                    value={password.current}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    name="new"
                    className={`form-control ${passwordErrors.minLength || passwordErrors.newMatch ? 'is-invalid' : ''}`}
                    value={password.new}
                    onChange={handlePasswordChange}
                    required
                  />
                  {passwordErrors.minLength && (
                    <div className="invalid-feedback">{passwordErrors.minLength}</div>
                  )}
                  {passwordErrors.newMatch && (
                    <div className="invalid-feedback">{passwordErrors.newMatch}</div>
                  )}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">
                    Confirm New Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirm"
                    className={`form-control ${passwordErrors.newMatch ? 'is-invalid' : ''}`}
                    value={password.confirm}
                    onChange={handlePasswordChange}
                    required
                  />
                  {passwordErrors.newMatch && (
                    <div className="invalid-feedback">{passwordErrors.newMatch}</div>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCropper && tempImageSrc && (
        <ImageCropper
          image={tempImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default Account;