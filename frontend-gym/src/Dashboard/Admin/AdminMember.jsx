import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../Api/axiosInstance";
import BaseUrl from "../../Api/BaseUrl";
import { getCurrentStaffId } from "../../utils/staffUtils";
import {
  Download,
  Edit,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  UserPlus,
  UserCheck,
  Activity,
  X,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Filter,
} from "lucide-react";
import GetAdminId from "../../Api/GetAdminId";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import GymLogo from "../../assets/Logo/Logo1.png";
import { numberToWords } from "../../utils/numberToWords";
import ImageCropper from "../../Components/ImageCropper";
import MemberPlansDisplay from "../../Components/MemberPlansDisplay";

const AdminMember = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRenewForm, setShowRenewForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);



  // Image cropping states
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperMode, setCropperMode] = useState(null); // 'add' or 'edit'

  // Plans state
  const [apiPlans, setApiPlans] = useState([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [personalTrainers, setPersonalTrainers] = useState([]);
  const [showAssignTrainerModal, setShowAssignTrainerModal] = useState(false);
  const [assignTrainerMember, setAssignTrainerMember] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [assignTrainerLoading, setAssignTrainerLoading] = useState(false);

  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error("Error parsing user from localStorage:", err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const memberId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = GetAdminId();
  const location = useLocation();
  const [convertedLeadId, setConvertedLeadId] = useState(null);

  // Goal dropdown types
  const [newGoalType, setNewGoalType] = useState("");
  const [editGoalType, setEditGoalType] = useState("");

  // Form states
  const [newMember, setNewMember] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    planId: "",
    planIds: [], // NEW: Support multiple plans
    address: "",
    gender: "",
    dateOfBirth: "",
    startDate: new Date().toISOString().split("T")[0],
    paymentMode: "cash",
    amountPaid: "",
    interestedIn: "",
    status: "Active",
    profileImage: null, // Store file object directly
    profileImagePreview: "", // For preview
    goal: "",
    trainerId: "",
  });

  const [editMember, setEditMember] = useState({
    id: "",
    fullName: "",
    phone: "",
    email: "",
    planId: "",
    planIds: [], // ✅ Support multiple plans
    address: "",
    gender: "",
    dateOfBirth: "",
    interestedIn: "",
    status: "Active",
    startDate: new Date().toISOString().split("T")[0], // ✅ Start Date for new plans
    paymentMode: "cash",
    amountPaid: "",
    profileImage: null, // Store file object directly
    profileImagePreview: "", // For preview
    existingProfileImage: "", // Store existing image URL
    goal: "",
    trainerId: "",
  });

  const [renewPlan, setRenewPlan] = useState({
    memberId: "",
    plan: "",
    paymentMode: "cash",
    amountPaid: "",
  });

  // Handle profile image change for both add and edit forms
  const handleProfileImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Create a preview URL and show cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result);
        setCropperMode(isEdit ? 'edit' : 'add');
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image
  const handleCropComplete = async (croppedImageData) => {
    try {
      // ImageCropper returns { blob, url }
      const { blob, url } = croppedImageData;
      
      if (!blob) {
        console.error('No blob received from cropper');
        return;
      }

      // Convert blob to file
      const croppedFile = new File([blob], 'profile-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Use the URL from cropper or create new one
      const previewUrl = url || URL.createObjectURL(blob);

      if (cropperMode === 'edit') {
        setEditMember({
          ...editMember,
          profileImage: croppedFile,
          profileImagePreview: previewUrl,
        });
      } else {
        setNewMember({
          ...newMember,
          profileImage: croppedFile,
          profileImagePreview: previewUrl,
        });
      }

      setShowCropper(false);
      setCropperImage(null);
      setCropperMode(null);
    } catch (error) {
      console.error('Error handling cropped image:', error);
      alert('Error processing cropped image. Please try again.');
    }
  };

  // Handle cropper cancel
  const handleCropperCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
    setCropperMode(null);
  };

  // Filter members based on search term and status
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesStatus = filterStatus === "" || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Fetch members by admin ID or trainer ID
  const fetchMembersByAdminId = async () => {
    setMembersLoading(true);
    try {
      let endpoint = `${BaseUrl}members/admin/${adminId}`;
      if (user && (Number(user.roleId) === 5 || user.roleName === 'PERSONAL TRAINER')) {
        const staffId = getCurrentStaffId(user);
        endpoint = `${BaseUrl}members/trainer/${staffId}`;
      }

      const response = await axiosInstance.get(endpoint);

      if (response.data && response.data.success) {
        const formattedMembers = response.data.data.map((member) => ({
          id: member.id,
          name: member.fullName,
          phone: member.phone,
          email: member.email,
          gender: member.gender,
          plan: getPlanNameById(member.planId), // Keep for backward compatibility
          planId: member.planId,
          assignedPlans: member.assignedPlans || [], // ✅ Multiple plans array
          address: member.address,
          dob: member.dateOfBirth,
          planStart: member.membershipFrom,
          expiry: member.membershipTo,
          status: member.status,
          interestedIn: member.interestedIn,
          profileImage: member.profileImage || "",
          paymentMode: member.paymentMode,
          amountPaid: member.amountPaid,
          joinDate: member.joinDate,
          goal: member.goal || "",
          // Use API's remainingDays if provided, otherwise compute from expiry
          remainingDays:
            typeof member.remainingDays === "number"
              ? member.remainingDays
              : member.membershipTo
                ? Math.ceil((new Date(member.membershipTo) - new Date()) / (1000 * 60 * 60 * 24))
                : null,
        }));

        setMembers(formattedMembers);
        console.log("Members loaded successfully:", formattedMembers);
      } else {
        console.error("API response error:", response.data);
      }
    } catch (err) {
      console.error("Error fetching members:", err);
    } finally {
      setMembersLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredMembers.length === 0) {
      alert("No data available to export.");
      return;
    }
    const exportData = filteredMembers.map((m) => ({
      "Member Name": m.name,
      Phone: m.phone,
      Email: m.email || "N/A",
      Gender: m.gender || "N/A",
      Plan: m.plan || "N/A",
      "Join Date": m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "N/A",
      "Expiry Date": m.expiry ? new Date(m.expiry).toLocaleDateString() : "N/A",
      Status: m.status || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-fit columns
    const colWidths = Object.keys(exportData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...exportData.map(row => (row[key] ? row[key].toString().length : 0))
      ) + 2
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "Members_Data.xlsx");
  };

  // Export to PDF
  const exportToPDF = () => {
    if (filteredMembers.length === 0) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Members Data", 14, 15);

    const tableColumn = ["Name", "Phone", "Plan", "Join Date", "Expiry Date", "Status"];
    const tableRows = [];

    filteredMembers.forEach((m) => {
      const rowData = [
        m.name,
        m.phone,
        m.plan || "N/A",
        m.joinDate ? new Date(m.joinDate).toLocaleDateString() : "N/A",
        m.expiry ? new Date(m.expiry).toLocaleDateString() : "N/A",
        m.status || "N/A",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [110, 178, 204] },
    });
    doc.save("Members_Data.pdf");
  };

  // Fetch a single member by ID
  const fetchMemberById = async (id) => {
    try {
      // Add BaseUrl prefix and fix the endpoint
      const response = await axiosInstance.get(
        `${BaseUrl}members/detail/${id}`
      );
      console.log("API response for member detail:", response.data);

      if (response.data?.success) {
        const member = response.data.member || response.data.data;
        return {
          id: member.id,
          name: member.fullName,
          phone: member.phone,
          email: member.email,
          gender: member.gender,
          plan: getPlanNameById(member.planId), // Keep for backward compatibility
          planId: member.planId,
          assignedPlans: member.assignedPlans || [], // ✅ Multiple plans array
          address: member.address,
          dob: member.dateOfBirth,
          // Fix typos in property names
          planStart: member.membershipFrom,
          expiry: member.membershipTo,
          status: member.status,
          interestedIn: member.interestedIn,
          profileImage: member.profileImage || "",
          paymentMode: member.paymentMode,
          amountPaid: member.amountPaid,
          joinDate: member.joinDate,
          goal: member.goal || "",
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching member:", err);
      return null;
    }
  };

  // Fetch plans from API
  const fetchPlansFromAPI = async () => {
    setPlanLoading(true);
    setPlanError(null);

    try {
      const response = await axiosInstance.get(
        `${BaseUrl}MemberPlan?adminId=${adminId}`
      );

      if (response.data && response.data.success) {
        // FIX: Keep the original case for 'type' and include 'trainerType'
        const formattedPlans = response.data.plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          sessions: plan.sessions,
          validity: plan.validityDays,
          price: `₹${plan.price.toLocaleString()}`,
          active: true,
          type: plan.type, // Keep original case (e.g., "PERSONAL", "GROUP", "MEMBER")
          trainerType: plan.trainerType, // Include trainerType
        }));

        setApiPlans(formattedPlans);
        setPlansLoaded(true);
        console.log("Plans loaded successfully:", formattedPlans);
      } else {
        setPlanError("Failed to fetch plans. Please try again.");
        console.error("API response error:", response.data);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlanError(
        err.response?.data?.message ||
        "Failed to fetch plans. Please try again."
      );
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersByAdminId();
    fetchPlansFromAPI();
    fetchPersonalTrainers();
  }, []);

  // Pre-fill from Lead Data if navigated from Leads page
  useEffect(() => {
    if (location.state?.leadData) {
      const lead = location.state.leadData;
      setNewMember(prev => ({
        ...prev,
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        gender: lead.gender || "",
      }));
      setConvertedLeadId(lead.id);
      setShowAddForm(true);
      // Clear state to avoid infinite loops or stale data on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch personal trainers for admin
  const fetchPersonalTrainers = async () => {
    try {
      const response = await axiosInstance.get(`${BaseUrl}staff/admin/${adminId}`);
      if (response.data && response.data.success) {
        const pts = (response.data.data || response.data.staff || []).filter(
          (s) => (s.roleId === 5 || (s.roleName || "").toLowerCase() === "personaltrainer")
        );
        setPersonalTrainers(pts);
      }
    } catch (err) {
      console.error("Error fetching trainers:", err);
    }
  };

  // Assign trainer to member
  const handleAssignTrainer = async () => {
    if (!selectedTrainerId || !assignTrainerMember) return;
    setAssignTrainerLoading(true);
    try {
      // Find the plan belonging to this personal trainer
      const trainerPlan = apiPlans.find(
        (p) => String(p.trainerId) === String(selectedTrainerId) || (p.trainerType === "personal")
      );
      // Update member's planId directly via a dedicated endpoint or update member
      const response = await axiosInstance.post(`${BaseUrl}members/assign-trainer`, {
        memberId: assignTrainerMember.id,
        trainerId: parseInt(selectedTrainerId),
        adminId,
      });
      if (response.data && response.data.success) {
        alert("Trainer assigned successfully!");
        setShowAssignTrainerModal(false);
        setAssignTrainerMember(null);
        setSelectedTrainerId("");
        await fetchMembersByAdminId();
      } else {
        alert(response.data?.message || "Failed to assign trainer");
      }
    } catch (err) {
      console.error("Assign trainer error:", err);
      alert(err.response?.data?.message || "Failed to assign trainer");
    } finally {
      setAssignTrainerLoading(false);
    }
  };

  // Handle add member with API call
  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData object
      const formData = new FormData();

      // Append all member data
      formData.append("adminId", adminId);
      formData.append("fullName", newMember.fullName);
      formData.append("email", newMember.email);
      formData.append("password", newMember.password);
      formData.append("phone", newMember.phone);
      formData.append("gender", newMember.gender);
      formData.append("dateOfBirth", newMember.dateOfBirth);
      formData.append("address", newMember.address);
      formData.append("interestedIn", newMember.interestedIn);
      formData.append("goal", newMember.goal || "");
      
      // Support both single and multiple plans
      if (newMember.planIds && newMember.planIds.length > 0) {
        formData.append("planIds", JSON.stringify(newMember.planIds));
        formData.append("planId", newMember.planIds[0]); // Backward compatibility
      } else if (newMember.planId) {
        formData.append("planId", newMember.planId);
      }
      
      formData.append("membershipFrom", newMember.startDate);
      formData.append(
        "paymentMode",
        newMember.paymentMode.charAt(0).toUpperCase() +
        newMember.paymentMode.slice(1)
      );
      formData.append("amountPaid", newMember.amountPaid);
      formData.append("status", newMember.status);

      // Append image if selected
      if (newMember.profileImage) {
        formData.append("profileImage", newMember.profileImage);
      }

      // Make API call with FormData
      const response = await axiosInstance.post(
        `${BaseUrl}members/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data) {
        const createdMemberId = response.data.data?.memberId;

        // If personal trainer is selected, assign it
        if (newMember.interestedIn === "Personal Training" && newMember.trainerId && createdMemberId) {
          try {
            await axiosInstance.post(`${BaseUrl}members/assign-trainer`, {
              memberId: createdMemberId,
              trainerId: parseInt(newMember.trainerId),
              adminId,
            });
          } catch (trainerErr) {
            console.error("Failed to automatically assign trainer:", trainerErr);
          }
        }

        // Automatically mark the lead as Converted if this came from a lead
        if (convertedLeadId) {
          try {
            await axiosInstance.put(`/leads/${convertedLeadId}`, { status: "Converted" });
            setConvertedLeadId(null); // Reset
          } catch (leadErr) {
            console.error("Failed to automatically convert lead status", leadErr);
          }
        }

        // Refresh members list
        await fetchMembersByAdminId();

        setNewMember({
          fullName: "",
          phone: "",
          email: "",
          password: "",
          planId: "",
          planIds: [],
          address: "",
          gender: "",
          dateOfBirth: "",
          startDate: new Date().toISOString().split("T")[0],
          paymentMode: "cash",
          amountPaid: "",
          interestedIn: "",
          status: "Active",
          profileImage: null,
          profileImagePreview: "",
          goal: "",
          trainerId: "",
        });
        setNewGoalType("");

        setShowAddForm(false);
        alert("Member added successfully!");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      const backendMsg = error.response?.data?.message;
      alert(backendMsg || "Failed to add member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit member with API call
  const handleEditMember = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      // Create FormData object
      const formData = new FormData();

      // Append all member data
      formData.append("adminId", adminId);
      formData.append("fullName", editMember.fullName);
      formData.append("email", editMember.email);
      formData.append("phone", editMember.phone);
      formData.append("gender", editMember.gender);
      formData.append("address", editMember.address);
      formData.append("dateOfBirth", editMember.dateOfBirth);
      formData.append("interestedIn", editMember.interestedIn);
      formData.append("status", editMember.status);
      formData.append("goal", editMember.goal || "");
      
      // ✅ Support multiple plans in edit
      if (editMember.planIds && editMember.planIds.length > 0) {
        formData.append("planIds", JSON.stringify(editMember.planIds));
        formData.append("planId", editMember.planIds[0]); // Backward compatibility
      } else if (editMember.planId) {
        formData.append("planIds", JSON.stringify([editMember.planId]));
        formData.append("planId", editMember.planId);
      }
      
      // ✅ Use startDate for new plans (required field)
      if (!editMember.startDate) {
        alert("Please select a Start Date for new plans");
        setEditLoading(false);
        return;
      }
      formData.append("membershipFrom", editMember.startDate);
      formData.append(
        "paymentMode",
        editMember.paymentMode.charAt(0).toUpperCase() +
        editMember.paymentMode.slice(1)
      );
      formData.append("amountPaid", editMember.amountPaid);

      // Append image if selected
      if (editMember.profileImage) {
        formData.append("profileImage", editMember.profileImage);
      }

      // Make API call with FormData
      const response = await axiosInstance.put(
        `${BaseUrl}members/update/${editMember.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success) {
        // If personal trainer is selected, assign it
        if (editMember.interestedIn === "Personal Training" && editMember.trainerId) {
          try {
            await axiosInstance.post(`${BaseUrl}members/assign-trainer`, {
              memberId: editMember.id,
              trainerId: parseInt(editMember.trainerId),
              adminId,
            });
          } catch (trainerErr) {
            console.error("Failed to automatically assign trainer:", trainerErr);
          }
        }

        // Refresh members list to get updated data
        await fetchMembersByAdminId();

        setShowEditForm(false);
        alert("Member updated successfully!");
      } else {
        alert("Failed to update member. Please try again.");
      }
    } catch (error) {
      console.error("Error updating member:", error);
      const backendMsg = error.response?.data?.message;
      alert(backendMsg || "Failed to update member. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      setDeleteLoading(true);

      try {
        const response = await axiosInstance.delete(
          `${BaseUrl}members/delete/${id}`
        );

        if (response.data && response.data.success) {
          // Refresh members list
          await fetchMembersByAdminId();

          alert("Member deleted successfully!");
        } else {
          alert("Failed to delete member. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting member:", error);
        alert("Failed to delete member. Please try again.");
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleEditFormOpen = async (member) => {
    try {
      console.log("Opening edit form for member:", member);

      // Fetch full member details to get assignedPlans
      let memberDetails = member;
      if (member.id) {
        try {
          const response = await axiosInstance.get(
            `${BaseUrl}members/detail/${member.id}`
          );
          if (response.data?.success) {
            memberDetails = response.data.member || response.data.data;
          }
        } catch (err) {
          console.log("Could not fetch member details, using list data");
        }
      }

      // Extract planIds from assignedPlans array
      const planIds = memberDetails.assignedPlans && memberDetails.assignedPlans.length > 0
        ? memberDetails.assignedPlans.map(p => p.planId)
        : (memberDetails.planId ? [memberDetails.planId] : []);

      const goalVal = member.goal || memberDetails.goal || "";
      setEditGoalType(["Weight Loss", "Weight Gain", "Body Building"].includes(goalVal) ? goalVal : (goalVal ? "Other" : ""));

      setEditMember({
        id: member.id,
        fullName: member.name,
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        address: member.address,
        dateOfBirth: member.dob,
        interestedIn: member.interestedIn || memberDetails.interestedIn || "",
        status: member.status,
        planId: member.planId, // Keep for backward compatibility
        planIds: planIds, // ✅ Multiple plans array
        paymentMode: member.paymentMode || "cash",
        amountPaid: member.amountPaid || "",
        startDate: member.planStart ? new Date(member.planStart).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        profileImage: null,
        profileImagePreview: member.profileImage || "",
        existingProfileImage: member.profileImage || "",
        goal: goalVal,
        trainerId: memberDetails.trainerId || "",
      });
      setShowEditForm(true);
    } catch (error) {
      console.error("Error in handleEditFormOpen:", error);
      alert("An error occurred while opening the edit form. Please try again.");
    }
  };

  const handleRenewPlan = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        adminId: adminId,
        planId: parseInt(renewPlan.plan),
        paymentMode:
          renewPlan.paymentMode.charAt(0).toUpperCase() +
          renewPlan.paymentMode.slice(1),
        amountPaid: parseFloat(renewPlan.amountPaid),
      };

      const response = await axiosInstance.put(
        `${BaseUrl}members/renew/${renewPlan.memberId}`,
        payload
      );

      if (response.data && response.data.success) {
        // Refresh members list to get updated data
        await fetchMembersByAdminId();

        setRenewPlan({
          memberId: "",
          plan: "",
          paymentMode: "cash",
          amountPaid: "",
        });
        setShowRenewForm(false);
        alert("Membership renewed successfully!");
      } else {
        alert("Failed to renew membership. Please try again.");
      }
    } catch (error) {
      console.error("Error renewing membership:", error);
      alert("Failed to renew membership. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewFormOpen = (member) => {
    setRenewPlan({
      ...renewPlan,
      memberId: member.id.toString(),
      plan: member.planId, // Use planId here as well
    });
    setShowRenewForm(true);
  };

  const getStatusClass = (status) => {
    if (!status) return "bg-danger";
    return String(status).toLowerCase() === "active" ? "bg-success" : "bg-danger";
  };

  const getPlanNameById = (planId) => {
    if (!planId || apiPlans.length === 0) return "Unknown Plan";
    const plan = apiPlans.find((p) => p.id === parseInt(planId));
    return plan ? plan.name : "Unknown Plan";
  };

  // Get filtered plans based on API response structure
  const getFilteredPlans = (interestedIn) => {
    if (!plansLoaded || apiPlans.length === 0) {
      console.log("Plans not loaded or empty.");
      return [];
    }

    let filtered = [];
    switch (interestedIn) {
      case "Personal Training":
        // Filter for plans where type is "PERSONAL"
        filtered = apiPlans.filter((plan) => plan.type === "PERSONAL");
        break;
      case "Personal Trainer":
        // Filter for plans where trainerType is "personal"
        filtered = apiPlans.filter((plan) => plan.trainerType === "personal");
        break;
      case "General Trainer":
        // Filter for plans where trainerType is "general"
        filtered = apiPlans.filter((plan) => plan.trainerType === "general");
        break;
      case "Group Classes":
        // Filter for plans where type is "GROUP"
        filtered = apiPlans.filter((plan) => plan.type === "GROUP");
        break;
      default:
        filtered = [];
        break;
    }
    console.log(`Filtering for "${interestedIn}":`, filtered);
    return filtered;
  };

  // Function to generate and download receipt as image using html2canvas
const handleDownloadReceipt = async (member) => {
    try {
      // Fetch full member details to get payment information
      let memberDetails = null;
      let paymentData = null;
      let adminDetails = null;

      // Get adminId from member API response
      let memberAdminId = null;
      
      try {
        const memberResponse = await axiosInstance.get(
          `${BaseUrl}members/detail/${member.id}`
        );
        if (memberResponse.data?.success) {
          memberDetails = memberResponse.data.member || memberResponse.data.data;
          memberAdminId = memberDetails?.adminId || member?.adminId || adminId;
        }
      } catch (err) {
        console.log("Member details not available");
        memberAdminId = member?.adminId || adminId;
      }

      const finalAdminId = memberAdminId || adminId;

      // Fetch payment history for the member
      try {
        const paymentResponse = await axiosInstance.get(
          `${BaseUrl}payments/member/${member.id}`
        );
        if (paymentResponse.data?.success && paymentResponse.data.payments?.length > 0) {
          paymentData = paymentResponse.data.payments[0];
        }
      } catch (err) {
        console.log("Payment history not available");
      }

      // ✅ Fetch admin profile from member-self/profile API (contains gymName, gymAddress, gstNumber, phone, email, tax)
      try {
        const adminProfileResponse = await axiosInstance.get(
          `member-self/profile/${finalAdminId}`
        );
        if (adminProfileResponse.data?.success && adminProfileResponse.data?.profile) {
          const profile = adminProfileResponse.data.profile;
          adminDetails = {
            fullName: profile.fullName || "Gym Name",
            gymName: profile.gymName || profile.fullName || "Gym Name",
            gymAddress: profile.gymAddress || profile.address_street || profile.address || "Gym Address",
            gstNumber: profile.gstNumber || "",
            tax: profile.tax || "5",
            phone: profile.phone || "",
            email: profile.email || ""
          };
        }
      } catch (err) {
        console.log("Admin profile API failed, trying auth/user API");
        // Fallback to auth/user API
        try {
          const adminResponse = await axiosInstance.get(
            `${BaseUrl}auth/user/${finalAdminId}`
          );
          if (adminResponse.data) {
            adminDetails = {
              fullName: adminResponse.data.fullName || adminResponse.data.name || "Gym Name",
              gymName: adminResponse.data.gymName || adminResponse.data.fullName || "Gym Name",
              gymAddress: adminResponse.data.gymAddress || adminResponse.data.address || "Gym Address",
              gstNumber: adminResponse.data.gstNumber || adminResponse.data.gst_number || "",
              tax: adminResponse.data.tax || "5",
              phone: adminResponse.data.phone || "",
              email: adminResponse.data.email || ""
            };
          }
        } catch (err2) {
          console.log("Auth API also failed, using localStorage data");
          const userData = getUserFromStorage();
          adminDetails = {
            fullName: userData?.fullName || "Gym Name",
            gymName: userData?.gymName || userData?.fullName || "Gym Name",
            gymAddress: userData?.gymAddress || userData?.address || "Gym Address",
            gstNumber: userData?.gstNumber || "",
            tax: userData?.tax || "5",
            phone: userData?.phone || "",
            email: userData?.email || ""
          };
        }
      }

      // ✅ Fetch from app-settings (only for gym_name override, other fields from profile API)
      try {
        const settingsResponse = await axiosInstance.get(
          `adminSettings/app-settings/admin/${finalAdminId}`
        );
        if (settingsResponse.data?.data) {
          const settingsData = settingsResponse.data.data;
          // Only override gym_name from app_settings if available
          if (settingsData.gym_name || settingsData.gymName) {
            adminDetails.gymName = settingsData.gym_name || settingsData.gymName;
          }
        }
      } catch (err) {
        console.log("Settings not available, using admin profile data only");
      }

      // ✅ Get all assigned plans (support multiple plans)
      const assignedPlans = memberDetails?.assignedPlans || [];
      
      // Calculate totals from all plans
      let totalBaseAmount = 0;
      let totalTaxAmount = 0;
      let totalQuantity = 0;
      
      // Build services array for invoice table
      const services = [];
      
      if (assignedPlans.length > 0) {
        // Use assigned plans
        assignedPlans.forEach((assignedPlan, index) => {
          const planPrice = assignedPlan.amountPaid || assignedPlan.price || 0;
          const taxRate = parseFloat(adminDetails?.tax || "5");
          const planTax = (planPrice * taxRate) / 100;
          const planTotal = planPrice + planTax;
          
          services.push({
            no: index + 1,
            name: assignedPlan.planName || "Gym subscription",
            qty: "1 PCS",
            rate: planPrice,
            tax: planTax,
            total: planTotal
          });
          
          totalBaseAmount += planPrice;
          totalTaxAmount += planTax;
          totalQuantity += 1;
        });
      } else {
        // Fallback to single plan
        const plan = apiPlans.find((p) => p.id === parseInt(member.planId));
        const planName = plan ? plan.name : "Gym annual subscription";
        const planPrice = plan ? parseFloat(plan.price.toString().replace("₹", "").replace(/,/g, "")) : (memberDetails?.amountPaid || 0);
        const taxRate = parseFloat(adminDetails?.tax || "5");
        const planTax = (planPrice * taxRate) / 100;
        const planTotal = planPrice + planTax;
        
        services.push({
          no: 1,
          name: planName,
          qty: "1 PCS",
          rate: planPrice,
          tax: planTax,
          total: planTotal
        });
        
        totalBaseAmount = planPrice;
        totalTaxAmount = planTax;
        totalQuantity = 1;
      }

      // Calculate final amounts
      const paymentMode = paymentData?.paymentMode || memberDetails?.paymentMode || "Cash";
      const cashPaid = paymentData?.amount || memberDetails?.amountPaid || totalBaseAmount;
      const invoiceNo = paymentData?.invoiceNo || `${member.id}`;
      const paymentDate = paymentData?.paymentDate
        ? new Date(paymentData.paymentDate).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

      // Calculate tax (CGST and SGST - split 50-50)
      const taxRate = parseFloat(adminDetails?.tax || "5");
      const cgstAmount = totalTaxAmount / 2;
      const sgstAmount = totalTaxAmount / 2;
      const subtotal = totalBaseAmount;
      const totalAmount = subtotal + totalTaxAmount;

      // Member details
      const memberName = memberDetails?.fullName || member.name || "N/A";
      const memberPhone = memberDetails?.phone || member.phone || "N/A";
      const memberAddress = memberDetails?.address || member.address || "N/A";

      // Fetch logo
      let logoDataUrl = GymLogo;
      try {
        const logoResponse = await axiosInstance.get(`adminSettings/app-settings/admin/${finalAdminId}`);
        if (logoResponse.data?.data?.logo) {
          logoDataUrl = logoResponse.data.data.logo;
        }
      } catch (err) {
        console.log("Failed to fetch logo, using default");
      }

      // Convert logo to data URL
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        logoDataUrl = await new Promise((resolve) => {
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch (err) {
              resolve(logoDataUrl);
            }
          };
          img.onerror = () => resolve(logoDataUrl);
          img.src = logoDataUrl;
        });
      } catch (err) {
        // Keep original logoDataUrl if conversion fails
      }

      // Company details
      const companyName = adminDetails?.gymName || adminDetails?.fullName || "Gym Name";
      const companyAddress = adminDetails?.gymAddress || adminDetails?.address || "Gym Address";
      const companyGST = adminDetails?.gstNumber || "";
      const companyPhone = adminDetails?.phone || "";
      const companyEmail = adminDetails?.email || "";
      
      // Extract state from address
      const addressParts = companyAddress.split(',');
      const placeOfSupply = addressParts[addressParts.length - 2]?.trim() || addressParts[addressParts.length - 1]?.trim() || "Telangana";
      
      // Convert amount to words
      const amountInWords = numberToWords(Math.floor(totalAmount));
      const balance = totalAmount - cashPaid;

      // Create receipt HTML matching exact image design
      const receiptHTML = `
        <div id="receipt-container" style="
          width: 794px;
          min-height: 1123px;
          background: linear-gradient(135deg, #fffef5 0%, #fffdf0 100%);
          padding: 0;
          font-family: Arial, sans-serif;
          color: #1a1a1a;
          margin: 0 auto;
          box-sizing: border-box;
          position: relative;
          border: 2px solid #ffffff;
        ">
          <!-- Corner Decorations -->
          <div style="position: absolute; top: 15px; left: 15px; width: 25px; height: 25px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(to right, #c9a961, transparent);"></div>
            <div style="position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: linear-gradient(to bottom, #c9a961, transparent);"></div>
            <div style="position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border: 2px solid #c9a961; border-radius: 50%;"></div>
          </div>
          <div style="position: absolute; top: 15px; right: 15px; width: 25px; height: 25px;">
            <div style="position: absolute; top: 0; right: 0; width: 100%; height: 3px; background: linear-gradient(to left, #c9a961, transparent);"></div>
            <div style="position: absolute; top: 0; right: 0; width: 3px; height: 100%; background: linear-gradient(to bottom, #c9a961, transparent);"></div>
            <div style="position: absolute; top: 3px; right: 3px; width: 8px; height: 8px; border: 2px solid #c9a961; border-radius: 50%;"></div>
          </div>
          <div style="position: absolute; bottom: 15px; left: 15px; width: 25px; height: 25px;">
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: linear-gradient(to right, #c9a961, transparent);"></div>
            <div style="position: absolute; bottom: 0; left: 0; width: 3px; height: 100%; background: linear-gradient(to top, #c9a961, transparent);"></div>
            <div style="position: absolute; bottom: 3px; left: 3px; width: 8px; height: 8px; border: 2px solid #c9a961; border-radius: 50%;"></div>
          </div>
          <div style="position: absolute; bottom: 15px; right: 15px; width: 25px; height: 25px;">
            <div style="position: absolute; bottom: 0; right: 0; width: 100%; height: 3px; background: linear-gradient(to left, #c9a961, transparent);"></div>
            <div style="position: absolute; bottom: 0; right: 0; width: 3px; height: 100%; background: linear-gradient(to top, #c9a961, transparent);"></div>
            <div style="position: absolute; bottom: 3px; right: 3px; width: 8px; height: 8px; border: 2px solid #c9a961; border-radius: 50%;"></div>
          </div>

          <!-- Watermark -->
          <div style="position: absolute; bottom: 40%; right: 10%; opacity: 0.04; font-size: 200px; font-weight: bold; color: #c9a961; transform: rotate(-15deg); pointer-events: none; z-index: 0; font-family: 'Arial Black', sans-serif;">FIT</div>

          <!-- Content -->
          <div style="position: relative; z-index: 1; padding: 25px 35px;">
            
            <!-- Header -->
            <div style="border: 2px solid #c9a961; padding: 18px 20px; margin-bottom: 18px; background: linear-gradient(to bottom, #ffffff, #fffef8);">
              <div style="font-size: 26px; font-weight: bold; color: #1a1a1a; margin-bottom: 6px; letter-spacing: 0.5px;">
                ${companyName}
              </div>
              <div style="font-size: 10px; color: #333; line-height: 1.5;">
                ${companyGST ? `<span style="font-weight: 600;">GSTIN</span> ${companyGST}<br/>` : ''}
                ${companyPhone ? `<span style="margin-right: 10px;">📞 ${companyPhone}</span>` : ''} ${companyEmail ? `<span>📧 ${companyEmail}</span>` : ''}<br/>
                ${companyAddress ? `<span>📍 ${companyAddress}</span>` : ''}
              </div>
            </div>

            <!-- Tax Invoice Title (Right Aligned) -->
            <div style="text-align: right; margin-bottom: 15px;">
              <span style="font-size: 18px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px;">TAX INVOICE</span>
            </div>

            <!-- Invoice Details -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 18px; font-size: 10px; color: #1a1a1a;">
              <div>
                <div style="font-weight: bold; margin-bottom: 3px;">Invoice No.</div>
                <div>${invoiceNo}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; margin-bottom: 3px;">Invoice Date</div>
                <div>${paymentDate}</div>
              </div>
            </div>

            <!-- Bill To -->
            <div style="margin-bottom: 18px; font-size: 10px; color: #1a1a1a; line-height: 1.6;">
              <div style="font-weight: bold; margin-bottom: 6px;">Bill To</div>
              <div>${memberName}</div>
              <div>${memberAddress}</div>
              <div>Mobile ${memberPhone}</div>
              <div style="margin-top: 8px;"><span style="font-weight: bold;">Place of Supply</span> ${placeOfSupply}</div>
            </div>

            <!-- Services Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px;">
              <thead>
                <tr style="background: #f5f5f5; color: #1a1a1a;">
                  <th style="padding: 8px 6px; text-align: left; border: 1px solid #d0d0d0; font-weight: bold; width: 40px;">No</th>
                  <th style="padding: 8px 6px; text-align: left; border: 1px solid #d0d0d0; font-weight: bold;">SERVICES</th>
                  <th style="padding: 8px 6px; text-align: center; border: 1px solid #d0d0d0; font-weight: bold; width: 60px;">Qty.</th>
                  <th style="padding: 8px 6px; text-align: right; border: 1px solid #d0d0d0; font-weight: bold; width: 80px;">Rate</th>
                  <th style="padding: 8px 6px; text-align: right; border: 1px solid #d0d0d0; font-weight: bold; width: 70px;">Tax</th>
                  <th style="padding: 8px 6px; text-align: right; border: 1px solid #d0d0d0; font-weight: bold; width: 80px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${services.map(service => `
                  <tr>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0; text-align: center;">${service.no}</td>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0;">${service.name}</td>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0; text-align: center;">${service.qty}</td>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0; text-align: right;">${service.rate.toLocaleString('en-IN')}</td>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0; text-align: right;">${Math.round(service.tax)}<br/><span style="font-size: 8px;">(${taxRate}%)</span></td>
                    <td style="padding: 10px 6px; border: 1px solid #d0d0d0; text-align: right; font-weight: bold;">${Math.round(service.total).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Subtotal Bar -->
            <div style="background: linear-gradient(to right, #f5f0e0, #faf7ed); padding: 8px 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; border-top: 2px solid #c9a961; border-bottom: 2px solid #c9a961;">
              <span style="font-weight: bold;">SUBTOTAL</span>
              <span>${totalQuantity}</span>
              <span style="font-weight: bold;">₹ ${Math.round(totalTaxAmount).toLocaleString('en-IN')}</span>
              <span style="font-weight: bold;">₹ ${Math.round(totalAmount).toLocaleString('en-IN')}</span>
            </div>

            <!-- Bottom Section: Terms & Tax Breakdown -->
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              
              <!-- Left: Terms -->
              <div style="flex: 1; font-size: 9px; line-height: 1.6; color: #333;">
                <div style="font-weight: bold; margin-bottom: 8px; font-size: 10px;">Terms & Conditions</div>
                <div>1. Goods once sold will not be taken back or exchanged</div>
                <div>2. All disputes are subject to ${placeOfSupply} jurisdiction only</div>
              </div>

              <!-- Right: Tax Breakdown -->
              <div style="width: 240px; font-size: 10px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Taxable Amount</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹ ${Math.round(subtotal).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">CGST @${(taxRate/2).toFixed(1)}%</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹ ${Math.round(cgstAmount).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">SGST @${(taxRate/2).toFixed(1)}%</td>
                    <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">₹ ${Math.round(sgstAmount).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="background: linear-gradient(to right, #f5f0e0, #faf7ed);">
                    <td style="padding: 8px 10px; font-weight: bold;">Total Amount</td>
                    <td style="padding: 8px 10px; text-align: right; font-weight: bold; font-size: 11px;">₹ ${Math.round(totalAmount).toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Payment Summary -->
            <!-- Amount Summary (Exact Alignment Like Image) -->
<div style="
  width: 280px;
  margin-left: auto;
  font-size: 10px;
  color: #1a1a1a;
  line-height: 1.9;
  margin-bottom: 20px;
">

  <!-- Total Amount -->
  <div style="
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 11px;
    border-top: 2px solid #c9a961;
    padding-top: 6px;
    margin-bottom: 6px;
  ">
    <span>Total Amount</span>
    <span>₹ ${Math.round(totalAmount).toLocaleString('en-IN')}</span>
  </div>

  <!-- Received Amount -->
  <div style="display: flex; justify-content: space-between; color: #555;">
    <span>Received Amount</span>
    <span>₹ ${Math.round(cashPaid).toLocaleString('en-IN')}</span>
  </div>

  <!-- Balance -->
  <div style="display: flex; justify-content: space-between; font-weight: bold;">
    <span>Balance</span>
    <span>₹ ${Math.round(Math.abs(balance)).toLocaleString('en-IN')}</span>
  </div>

  <!-- Amount in Words -->
  <div style="margin-top: 10px; font-weight: bold;">
    Total Amount (in words)
  </div>

  <div style="font-size: 10px; color: #333;">
    ${amountInWords} Rupees
  </div>

</div>


            <!-- Signature -->
          <!-- Signature (PDF Safe) -->
<div style="
  width: 100%;
  margin-top: 25px;
  overflow: visible;
">
  <div style="
    float: right;
    border: 2px solid #c9a961;
    padding: 25px 35px 18px 35px;
    min-width: 220px;
    background: #fff;
  ">

    <div style="
      border-bottom: 2px solid #c9a961;
      height: 32px;
      margin-bottom: 10px;
    "></div>

    <div style="
      font-size: 10px;
      font-weight: bold;
      color: #555;
    ">
      Signature
    </div>

    <div style="
      font-size: 12px;
      font-weight: bold;
      color: #1a1a1a;
    ">
      ${companyName}
    </div>

  </div>
  <div style="clear: both;"></div>
</div>


          </div>
        </div>
      `;

      // Create a temporary container
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = receiptHTML;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      document.body.appendChild(tempDiv);

      // Get the receipt container
      const receiptElement = tempDiv.querySelector("#receipt-container");

      // Wait for images to load
      const images = receiptElement.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            })
        )
      );

      // Convert to canvas with high quality
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        width: 794,
        height: receiptElement.scrollHeight,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 794,
        windowHeight: receiptElement.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector("#receipt-container");
          if (clonedElement) {
            const images = clonedElement.querySelectorAll("img");
            images.forEach((img) => {
              if (img.src && !img.complete) {
                img.style.display = "none";
              }
            });
          }
        }
      });

      // A4 dimensions
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      // Download PDF
      pdf.save(`Invoice_${invoiceNo}_${memberName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Failed to generate receipt. Please try again.");
    }
  };

  return (
    <>
    <div className="container-fluid py-2 py-md-4">
      {/* Header - Responsive */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-md-6 mb-3 mb-md-0">
          <h2 className="fw-bold mb-0 text-center text-md-start">
            Members Management
          </h2>
        </div>
        <div className="col-12 col-md-6">
          <div className="d-flex justify-content-center justify-content-md-end gap-2 flex-wrap">
            <div className="dropdown">
              <button
                className="btn text-white dropdown-toggle mb-2 mb-md-0"
                type="button"
                id="exportDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ backgroundColor: "#28a745", borderRadius: "8px", fontWeight: 600, padding: "8px 20px" }}
              >
                <Download size={18} className="me-2" />
                <span className="d-none d-sm-inline">Export Data</span>
                <span className="d-sm-none">Export</span>
              </button>
              <ul className="dropdown-menu shadow-sm" aria-labelledby="exportDropdown" style={{ borderRadius: "8px", border: "none" }}>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToExcel}>
                    <span style={{ color: "#28a745", marginRight: "10px", fontWeight: 600 }}>XLSX</span> Export to Excel
                  </button>
                </li>
                <li>
                  <button className="dropdown-item d-flex align-items-center py-2" onClick={exportToPDF}>
                    <span style={{ color: "#dc3545", marginRight: "10px", fontWeight: 600 }}>PDF</span> Export to PDF
                  </button>
                </li>
              </ul>
            </div>
            <button
              className="btn text-white mb-2 mb-md-0"
              style={{ backgroundColor: "#6EB2CC", padding: "8px 20px" }}
              onClick={() => setShowAddForm(true)}
            >
              <UserPlus size={18} className="me-2" />
              <span className="d-none d-sm-inline">Add Member</span>
              <span className="d-sm-none">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter - Responsive */}
      <div className="row mb-3 mb-md-4 g-2 g-md-3">
        <div className="col-12 col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-12 col-md-4">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table - Responsive */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {/* Desktop Table View */}
          <div className="d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Gender</th>
                    <th>Plan</th>
                    <th>Expiry</th>
                    <th>Assigned To</th>
                    {/* <th>Remaining Days</th> */}
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membersLoading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></div>
                        Loading members...
                      </td>
                    </tr>
                  ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td>
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt="Profile"
                              className="rounded-circle"
                              style={{
                                width: "36px",
                                height: "36px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center rounded-circle bg-secondary text-white"
                              style={{ width: "36px", height: "36px" }}
                            >
                              {member.name.charAt(0)}
                            </div>
                          )}
                        </td>
                        <td>{member.name}</td>
                        <td>{member.phone}</td>
                        <td>{member.email}</td>
                        <td>{member.gender}</td>
                        <td>
                          {member.assignedPlans && member.assignedPlans.length > 0 ? (
                            <MemberPlansDisplay plans={member.assignedPlans} compact={true} />
                          ) : (
                            <span>{getPlanNameById(member.planId) || "No Plan"}</span>
                          )}
                        </td>
                        <td>
                          {member.assignedPlans && member.assignedPlans.length > 0 ? (
                            <div>
                              {member.assignedPlans
                                .filter(p => p.computedStatus === 'Active')
                                .map(p => new Date(p.membershipTo).toLocaleDateString())
                                .join(', ')}
                            </div>
                          ) : (
                            <span>{member.expiry ? new Date(member.expiry).toLocaleDateString() : "N/A"}</span>
                          )}
                        </td>
                        <td>
                          {member.assignedPlans && member.assignedPlans.length > 0 ? (
                            <div>
                              {member.assignedPlans
                                .filter(p => p.computedStatus === 'Active')
                                .map(p => p.trainerName || 'None')
                                .join(', ')}
                            </div>
                          ) : (
                            <span>None</span>
                          )}
                        </td>
                        {/* <td>
                          {member.remainingDays === null || member.remainingDays === undefined ? (
                            "-"
                          ) : member.remainingDays <= 10 ? (
                            <span style={{ color: "red", fontWeight: "600" }}>{member.remainingDays}</span>
                          ) : (
                            member.remainingDays
                          )}
                        </td> */}
                        <td>
                          <span
                            className={`badge ${getStatusClass(member.status)}`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => navigate(`/admin/member-assessment/${member.id}`)}
                              title="Health Log / Assessment"
                            >
                              <Activity size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleViewMember(member)}
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleEditFormOpen(member)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{
                                color: "#6EB2CC",
                                borderColor: "#6EB2CC",
                              }}
                              onClick={() => handleRenewFormOpen(member)}
                              title="Renew Plan"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleDownloadReceipt(member)}
                              title="Download Receipt"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => { setAssignTrainerMember(member); setSelectedTrainerId(""); setShowAssignTrainerModal(true); }}
                              title="Assign Personal Trainer"
                            >
                              <UserCheck size={16} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteMember(member.id)}
                              title="Delete"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? (
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        No members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="d-md-none">
            {membersLoading ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></div>
                Loading members...
              </div>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <div key={member.id} className="border-bottom p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      {member.profileImage ? (
                        <img
                          src={member.profileImage}
                          alt="Profile"
                          className="rounded-circle me-3"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle bg-secondary text-white me-3"
                          style={{ width: "50px", height: "50px" }}
                        >
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h6 className="mb-1 fw-bold">{member.name}</h6>
                        <span
                          className={`badge ${getStatusClass(member.status)}`}
                        >
                          {member.status}
                        </span>
                      </div>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn btn-sm btn-secondary dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        Actions
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => navigate(`/admin/member-assessment/${member.id}`)}
                          >
                            <Activity size={16} className="me-2" /> Health Log
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handleViewMember(member)}
                          >
                            <Eye size={16} className="me-2" /> View
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handleEditFormOpen(member)}
                          >
                            <Edit size={16} className="me-2" /> Edit
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handleRenewFormOpen(member)}
                          >
                            <RefreshCw size={16} className="me-2" /> Renew
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => handleDownloadReceipt(member)}
                          >
                            <Download size={16} className="me-2" /> Download Receipt
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? (
                              <>
                                <div
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 size={16} className="me-2" /> Delete
                              </>
                            )}
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="row g-2 text-sm">
                    <div className="col-6">
                      <strong>Phone:</strong> {member.phone}
                    </div>
                    <div className="col-6">
                      <strong>Gender:</strong> {member.gender}
                    </div>
                    <div className="col-6">
                      <strong>Plan:</strong> {getPlanNameById(member.planId)}
                    </div>
                    <div className="col-6">
                      <strong>Expiry:</strong>{" "}
                      {new Date(member.expiry).toLocaleDateString()}
                    </div>
                    <div className="col-6">
                      <strong>Remaining:</strong>{" "}
                      {member.remainingDays === null || member.remainingDays === undefined
                        ? "-"
                        : member.remainingDays <= 10
                          ? (
                            <span style={{ color: "red", fontWeight: 600 }}>{member.remainingDays}</span>
                          )
                          : member.remainingDays}
                    </div>
                    <div className="col-12">
                      <strong>Email:</strong> {member.email}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">No members found</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddForm && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Member</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddForm(false)}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <form onSubmit={handleAddMember} autoComplete="off">
                  <div className="col-12 text-center mb-3">
                    {newMember.profileImagePreview ? (
                      <img
                        src={newMember.profileImagePreview}
                        alt="Preview"
                        className="rounded-circle"
                        style={{
                          width: "100px",
                          height: "100px",
                          objectFit: "cover",
                          border: "2px solid #ddd",
                        }}
                      />
                    ) : (
                      <div
                        className="bg-light border rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: "100px", height: "100px" }}
                      >
                        <User size={40} className="text-muted" />
                      </div>
                    )}
                    <input
                      type="file"
                      className="form-control mt-2"
                      accept="image/*"
                      onChange={(e) => handleProfileImageChange(e, false)}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newMember.fullName}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            fullName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Phone <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newMember.phone}
                        onChange={(e) =>
                          setNewMember({ ...newMember, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        value={newMember.email}
                        onChange={(e) =>
                          setNewMember({ ...newMember, email: e.target.value })
                        }
                        autoComplete="new-email"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={newMember.password}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            password: e.target.value,
                          })
                        }
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newMember.dateOfBirth}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            dateOfBirth: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Status <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={newMember.status}
                        onChange={(e) =>
                          setNewMember({ ...newMember, status: e.target.value })
                        }
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Goal</label>
                      <select
                        className="form-select"
                        value={newGoalType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewGoalType(val);
                          if (val !== "Other") {
                            setNewMember({ ...newMember, goal: val });
                          } else {
                            setNewMember({ ...newMember, goal: "" });
                          }
                        }}
                      >
                        <option value="">Select Goal</option>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                        <option value="Body Building">Body Building</option>
                        <option value="Other">Other (Specify)</option>
                      </select>
                      {newGoalType === "Other" && (
                        <input
                          type="text"
                          className="form-control mt-2"
                          placeholder="Specify custom goal"
                          value={newMember.goal}
                          onChange={(e) =>
                            setNewMember({ ...newMember, goal: e.target.value })
                          }
                          required
                        />
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Gender <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gender"
                            id="male"
                            value="Male"
                            checked={newMember.gender === "Male"}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                gender: e.target.value,
                              })
                            }
                            required
                          />
                          <label className="form-check-label" htmlFor="male">
                            Male
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gender"
                            id="female"
                            value="Female"
                            checked={newMember.gender === "Female"}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                gender: e.target.value,
                              })
                            }
                            required
                          />
                          <label className="form-check-label" htmlFor="female">
                            Female
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="gender"
                            id="other"
                            value="Other"
                            checked={newMember.gender === "Other"}
                            onChange={(e) =>
                              setNewMember({
                                ...newMember,
                                gender: e.target.value,
                              })
                            }
                            required
                          />
                          <label className="form-check-label" htmlFor="other">
                            Other
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Interested In <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex flex-wrap gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="interestedIn"
                            id="personalTraining"
                            value="Personal Training"
                            checked={
                              newMember.interestedIn === "Personal Training"
                            }
                            onChange={(e) => {
                              setNewMember({
                                ...newMember,
                                interestedIn: e.target.value,
                                planId: "",
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="personalTraining"
                          >
                            Personal Training
                          </label>
                        </div>
                        {/* <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="interestedIn"
                            id="personalTrainer"
                            value="Personal Trainer"
                            checked={
                              newMember.interestedIn === "Personal Trainer"
                            }
                            onChange={(e) => {
                              setNewMember({
                                ...newMember,
                                interestedIn: e.target.value,
                                planId: "",
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="personalTrainer"
                          >
                            Personal Trainer
                          </label>
                        </div> */}
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="interestedIn"
                            id="generalTrainer"
                            value="General Trainer"
                            checked={
                              newMember.interestedIn === "General Trainer"
                            }
                            onChange={(e) => {
                              setNewMember({
                                ...newMember,
                                interestedIn: e.target.value,
                                planId: "",
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="generalTrainer"
                          >
                            General Trainer
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="interestedIn"
                            id="groupClasses"
                            value="Group Classes"
                            checked={newMember.interestedIn === "Group Classes"}
                            onChange={(e) => {
                              setNewMember({
                                ...newMember,
                                interestedIn: e.target.value,
                                planId: "",
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="groupClasses"
                          >
                            Group Classes
                          </label>
                        </div>
                      </div>
                    </div>
                    {newMember.interestedIn === "Personal Training" && (
                      <div className="col-12 mt-2">
                        <label className="form-label fw-semibold">
                          Select Personal Trainer
                        </label>
                        <select
                          className="form-select"
                          value={newMember.trainerId}
                          onChange={(e) =>
                            setNewMember({
                              ...newMember,
                              trainerId: e.target.value,
                            })
                          }
                        >
                          <option value="">-- Select Trainer --</option>
                          {personalTrainers.map((t) => (
                            <option key={t.staffId} value={t.staffId}>
                              {t.fullName || t.name} ({t.phone || "No phone"})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="col-12">
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newMember.address}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            address: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Plans <span className="text-danger">*</span> 
                        <small className="text-muted ms-2">(Select one or multiple plans)</small>
                      </label>
                      {planLoading ? (
                        <div className="form-select text-center">
                          <div
                            className="spinner-border spinner-border-sm text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <span className="ms-2">Loading plans...</span>
                        </div>
                      ) : planError ? (
                        <div className="alert alert-danger py-2">
                          {planError}
                        </div>
                      ) : (
                        <div>
                          <div className="border rounded p-3" style={{ maxHeight: "250px", overflowY: "auto" }}>
                            {!newMember.interestedIn ? (
                              <p className="text-muted mb-0">Please select 'Interested In' first</p>
                            ) : getFilteredPlans(newMember.interestedIn).length === 0 ? (
                              <p className="text-muted mb-0">No plans available</p>
                            ) : (
                              <div className="row g-2">
                                {getFilteredPlans(newMember.interestedIn).map((plan) => (
                                  <div key={plan.id} className="col-12 col-md-6">
                                    <div 
                                      className={`card h-100 ${newMember.planIds.includes(plan.id) ? 'border-primary shadow-sm' : ''}`}
                                      style={{ cursor: "pointer", transition: "all 0.2s", backgroundColor: newMember.planIds.includes(plan.id) ? '#f8f9fc' : '#ffffff' }}
                                      onClick={() => {
                                        const planId = plan.id;
                                        const isChecked = !newMember.planIds.includes(planId);
                                        setNewMember({
                                          ...newMember,
                                          planIds: isChecked
                                            ? [...newMember.planIds, planId]
                                            : newMember.planIds.filter(id => id !== planId),
                                          planId: isChecked && newMember.planIds.length === 0 
                                            ? planId 
                                            : newMember.planId
                                        });
                                      }}
                                    >
                                      <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                          <h6 className="card-title fw-bold mb-0 text-primary">{plan.name}</h6>
                                          <div className="form-check m-0 p-0">
                                            <input
                                              className="form-check-input ms-0"
                                              type="checkbox"
                                              checked={newMember.planIds.includes(plan.id)}
                                              readOnly
                                              style={{ cursor: "pointer", marginTop: "2px" }}
                                            />
                                          </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                          <span className="badge bg-secondary">{plan.validity} Days</span>
                                          <span className="fw-bold fs-6">{plan.price}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {newMember.planIds.length > 0 && (
                            <div className="mt-2">
                              <small className="text-success">
                                ✓ {newMember.planIds.length} plan(s) selected
                              </small>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={newMember.startDate}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            startDate: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Payment Mode <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={newMember.paymentMode}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            paymentMode: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Amount Paid <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={newMember.amountPaid}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            amountPaid: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                  </div>
                  <div className="modal-footer mt-3">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ backgroundColor: "#6EB2CC" }}
                      disabled={loading}
                    >
                      {loading ? "Adding..." : "Add Member"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditForm && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Member</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEditForm(false)}
                ></button>
              </div>
              <div
                className="modal-body"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                <form onSubmit={handleEditMember}>
                  <div className="row g-3">
                    <div className="col-12 text-center mb-3">
                      {editMember.profileImagePreview ? (
                        <img
                          src={editMember.profileImagePreview}
                          alt="Preview"
                          className="rounded-circle"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            border: "2px solid #ddd",
                          }}
                        />
                      ) : editMember.existingProfileImage ? (
                        <img
                          src={editMember.existingProfileImage}
                          alt="Profile"
                          className="rounded-circle"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            border: "2px solid #ddd",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light border rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: "100px", height: "100px" }}
                        >
                          <User size={40} className="text-muted" />
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control mt-2"
                        accept="image/*"
                        onChange={(e) => handleProfileImageChange(e, true)}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editMember.fullName}
                        onChange={(e) =>
                          setEditMember({
                            ...editMember,
                            fullName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editMember.phone}
                        onChange={(e) =>
                          setEditMember({
                            ...editMember,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editMember.email}
                        onChange={(e) =>
                          setEditMember({
                            ...editMember,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={editMember.status}
                        onChange={(e) =>
                          setEditMember({
                            ...editMember,
                            status: e.target.value,
                          })
                        }
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Goal</label>
                      <select
                        className="form-select"
                        value={editGoalType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditGoalType(val);
                          if (val !== "Other") {
                            setEditMember({ ...editMember, goal: val });
                          } else {
                            setEditMember({ ...editMember, goal: "" });
                          }
                        }}
                      >
                        <option value="">Select Goal</option>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                        <option value="Body Building">Body Building</option>
                        <option value="Other">Other (Specify)</option>
                      </select>
                      {editGoalType === "Other" && (
                        <input
                          type="text"
                          className="form-control mt-2"
                          placeholder="Specify custom goal"
                          value={editMember.goal}
                          onChange={(e) =>
                            setEditMember({ ...editMember, goal: e.target.value })
                          }
                          required
                        />
                      )}
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Interested In <span className="text-danger">*</span>
                      </label>
                      <div className="d-flex gap-3 flex-wrap">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editInterestedIn"
                            id="editPersonalTraining"
                            value="Personal Training"
                            checked={
                              editMember.interestedIn === "Personal Training"
                            }
                            onChange={(e) => {
                              setEditMember({
                                ...editMember,
                                interestedIn: e.target.value,
                                planId: "", // Reset plan selection when interested in changes
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="editPersonalTraining"
                          >
                            Personal Training
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editInterestedIn"
                            id="editGeneral"
                            value="General Trainer"
                            checked={editMember.interestedIn === "General Trainer"}
                            onChange={(e) => {
                              setEditMember({
                                ...editMember,
                                interestedIn: e.target.value,
                                planId: "", // Reset plan selection when interested in changes
                              });
                            }}
                            required
                          />
                          <label className="form-check-label" htmlFor="editGeneral">
                            General Trainer
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="editInterestedIn"
                            id="editGroupClasses"
                            value="Group Classes"
                            checked={editMember.interestedIn === "Group Classes"}
                            onChange={(e) => {
                              setEditMember({
                                ...editMember,
                                interestedIn: e.target.value,
                                planId: "", // Reset plan selection when interested in changes
                              });
                            }}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="editGroupClasses"
                          >
                            Group Classes
                          </label>
                        </div>
                      </div>
              </div>
              {editMember.interestedIn === "Personal Training" && (
                <div className="col-12 mt-2">
                  <label className="form-label fw-semibold">
                    Select Personal Trainer
                  </label>
                  <select
                    className="form-select"
                    value={editMember.trainerId}
                    onChange={(e) =>
                      setEditMember({
                        ...editMember,
                        trainerId: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Select Trainer --</option>
                    {personalTrainers.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.fullName || t.name} ({t.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-12">
                <label className="form-label">
                  Plans <span className="text-danger">*</span>
                </label>
                {planLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading plans...</p>
                  </div>
                ) : planError ? (
                  <div className="alert alert-danger" role="alert">
                    {planError}
                  </div>
                ) : (
                  <div>
                    <div className="border rounded p-3" style={{ maxHeight: "250px", overflowY: "auto" }}>
                      {!editMember.interestedIn ? (
                        <p className="text-muted mb-0">Please select 'Interested In' first</p>
                      ) : getFilteredPlans(editMember.interestedIn).length === 0 ? (
                        <p className="text-muted mb-0">No plans available</p>
                      ) : (
                        <div className="row g-2">
                          {getFilteredPlans(editMember.interestedIn).map((plan) => (
                            <div key={plan.id} className="col-12 col-md-6">
                              <div 
                                className={`card h-100 ${editMember.planIds.includes(plan.id) ? 'border-primary shadow-sm' : ''}`}
                                style={{ cursor: "pointer", transition: "all 0.2s", backgroundColor: editMember.planIds.includes(plan.id) ? '#f8f9fc' : '#ffffff' }}
                                onClick={() => {
                                  const planId = plan.id;
                                  const isChecked = !editMember.planIds.includes(planId);
                                  setEditMember({
                                    ...editMember,
                                    planIds: isChecked
                                      ? [...editMember.planIds, planId]
                                      : editMember.planIds.filter(id => id !== planId),
                                    planId: isChecked && editMember.planIds.length === 0 
                                      ? planId 
                                      : editMember.planId
                                  });
                                }}
                              >
                                <div className="card-body p-3">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="card-title fw-bold mb-0 text-primary">{plan.name}</h6>
                                    <div className="form-check m-0 p-0">
                                      <input
                                        className="form-check-input ms-0"
                                        type="checkbox"
                                        checked={editMember.planIds.includes(plan.id)}
                                        readOnly
                                        style={{ cursor: "pointer", marginTop: "2px" }}
                                      />
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center mt-3">
                                    <span className="badge bg-secondary">{plan.validity} Days</span>
                                    <span className="fw-bold fs-6">{plan.price}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {editMember.planIds.length > 0 && (
                      <div className="mt-2">
                        <small className="text-success">
                          ✓ {editMember.planIds.length} plan(s) selected
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">
                  Start Date (for new plans) <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={editMember.startDate}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
                <small className="text-muted">
                  This date will be used for newly assigned plans
                </small>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Gender</label>
                <select
                  className="form-select"
                  value={editMember.gender}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={editMember.dateOfBirth}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      dateOfBirth: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={editMember.paymentMode}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      paymentMode: e.target.value,
                    })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Amount Paid</label>
                <input
                  type="number"
                  className="form-control"
                  value={editMember.amountPaid}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      amountPaid: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={editMember.address}
                  onChange={(e) =>
                    setEditMember({
                      ...editMember,
                      address: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="modal-footer mt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEditForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white"
                style={{ backgroundColor: "#6EB2CC" }}
                disabled={editLoading}
              >
                {editLoading ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
        </div>
      )}

      {/* Renew Plan Modal */}
      {showRenewForm && (
        <div
          className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Renew Membership Plan</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowRenewForm(false)}
            ></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleRenewPlan}>
              <div className="mb-3">
                <label className="form-label">Membership Plan</label>
                <select
                  className="form-select"
                  value={renewPlan.plan}
                  onChange={(e) =>
                    setRenewPlan({ ...renewPlan, plan: e.target.value })
                  }
                  required
                >
                  <option value="">Select Plan</option>
                  {plansLoaded &&
                    apiPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price} ({plan.validity} days)
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={renewPlan.paymentMode}
                  onChange={(e) =>
                    setRenewPlan({
                      ...renewPlan,
                      paymentMode: e.target.value,
                    })
                  }
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Amount Paid</label>
                <input
                  type="number"
                  className="form-control"
                  value={renewPlan.amountPaid}
                  onChange={(e) =>
                    setRenewPlan({
                      ...renewPlan,
                      amountPaid: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRenewForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn text-white"
                  style={{ backgroundColor: "#6EB2CC" }}
                >
                  Renew Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* View Member Modal */}
      {showViewModal && selectedMember && (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Member Details</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowViewModal(false)}
            ></button>
          </div>
          <div
            className="modal-body"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="row">
              <div className="col-12 col-lg-4 text-center mb-4 mb-lg-0">
                {selectedMember.profileImage ? (
                  <img
                    src={selectedMember.profileImage}
                    alt="Profile"
                    className="rounded-circle mb-3"
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex justify-content-center align-items-center rounded-circle bg-primary text-white mx-auto mb-3"
                    style={{ width: "120px", height: "120px" }}
                  >
                    <span className="fs-1 fw-bold">
                      {selectedMember.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                )}
                <h5 className="mb-2">{selectedMember.name}</h5>
                <span
                  className={`badge ${getStatusClass(
                    selectedMember.status
                  )}`}
                >
                  {selectedMember.status}
                </span>
              </div>
              <div className="col-12 col-lg-8">
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <strong>Phone:</strong>
                    <div>{selectedMember.phone}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <strong>Email:</strong>
                    <div>{selectedMember.email}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <strong>Gender:</strong>
                    <div>{selectedMember.gender}</div>
                  </div>
                  <div className="col-12">
                    <strong>Assigned Plans:</strong>
                    {selectedMember.assignedPlans && selectedMember.assignedPlans.length > 0 ? (
                      <div className="mt-2">
                        <MemberPlansDisplay plans={selectedMember.assignedPlans} compact={false} />
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="text-muted">
                          <small>Plan: {getPlanNameById(selectedMember.planId) || "No Plan"}</small>
                          {selectedMember.planStart && (
                            <div>
                              <small>Start: {new Date(selectedMember.planStart).toLocaleDateString()}</small>
                            </div>
                          )}
                          {selectedMember.expiry && (
                            <div>
                              <small>Expiry: {new Date(selectedMember.expiry).toLocaleDateString()}</small>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-12 col-sm-6">
                    <strong>Date of Birth:</strong>
                    <div>
                      {new Date(selectedMember.dob).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <strong>Interested In:</strong>
                    <div>{selectedMember.interestedIn}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <strong>Goal:</strong>
                    <div>{selectedMember.goal || "Not Specified"}</div>
                  </div>
                  <div className="col-12">
                    <strong>Address:</strong>
                    <div>{selectedMember.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary w-100 w-md-auto"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropperCancel}
        />
      )}
    </div>


      {/* Assign Trainer Modal */}
      {showAssignTrainerModal && assignTrainerMember && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <UserCheck size={20} className="me-2 text-warning" />
                  Assign Personal Trainer
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignTrainerModal(false)} />
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Member: <strong>{assignTrainerMember.name}</strong>
                </p>
                <label className="form-label fw-semibold">Select Personal Trainer</label>
                <select
                  className="form-select"
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                >
                  <option value="">-- Select Trainer --</option>
                  {personalTrainers.length === 0 ? (
                    <option disabled>No personal trainers found</option>
                  ) : (
                    personalTrainers.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.fullName || t.name} ({t.phone || "No phone"})
                      </option>
                    ))
                  )}
                </select>
                {personalTrainers.length === 0 && (
                  <p className="text-muted small mt-2">
                    No personal trainers registered yet. Please add staff with Personal Trainer role first.
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignTrainerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning text-white"
                  onClick={handleAssignTrainer}
                  disabled={!selectedTrainerId || assignTrainerLoading}
                >
                  {assignTrainerLoading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Assigning...</>
                  ) : (
                    "Assign Trainer"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminMember;