import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  Tab,
  Button,
  Card,
  Alert,
  Modal,
  Form,
  Table,
} from "react-bootstrap";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
} from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import BaseUrl from "../../Api/BaseUrl";
import GetAdminId from "../../Api/GetAdminId";

const CreatePlan = () => {
  const adminId = GetAdminId();
  const [activeTab, setActiveTab] = useState("group");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState({ id: null, type: null });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [requestToProcess, setRequestToProcess] = useState(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    sessions: "",
    validity: "",
    price: "",
    type: "group",
    trainerType: "",
    trainerId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createPlanError, setCreatePlanError] = useState(null);
  const [apiPlans, setApiPlans] = useState([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [membershipRequests, setMembershipRequests] = useState([]); // 👈 New state
  const [activeRequestTab, setActiveRequestTab] = useState("renewal");
  const [trainers, setTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const customColor = "#6EB2CC";
  const [groupPlans, setGroupPlans] = useState([]);
  const [personalPlans, setPersonalPlans] = useState([]);

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

  // Fetch all data on mount
  useEffect(() => {
    fetchPlansFromAPI();
    fetchRenewalRequests();
    fetchMembershipRequests(); // 👈 New
  }, []);

  // Fetch trainers when trainer type changes
  useEffect(() => {
    if (newPlan.type === "member" && newPlan.trainerType) {
      fetchTrainers(newPlan.trainerType);
    }
  }, [newPlan.trainerType, newPlan.type]);

  const fetchTrainers = async (trainerType) => {
    setTrainersLoading(true);
    try {
      const adminId = localStorage.getItem("userId") || "4";
      const response = await axiosInstance.get(
        `${BaseUrl}class/trainers/personal-general?adminId=${adminId}`
      );
      if (response.data.success) {
        const filteredTrainers = response.data.trainers.filter((trainer) => {
          if (trainerType === "personal") {
            return trainer.roleId === 5;
          } else if (trainerType === "general") {
            return trainer.roleId === 6;
          }
          return false;
        });
        setTrainers(filteredTrainers);
      } else {
        console.error("Failed to fetch trainers");
      }
    } catch (err) {
      console.error("Error fetching trainers:", err);
    } finally {
      setTrainersLoading(false);
    }
  };

  // 👇 NEW: Fetch Membership Booking Requests
  const fetchMembershipRequests = async () => {
    try {
      const response = await axiosInstance.get(
        `booking/admin/booking-requests/${adminId}`
      );
      if (response?.data?.success && Array.isArray(response.data.data)) {
        const formatted = response.data.data.map((req) => ({
          id: req.bookingRequestId,
          bookingRequestId: req.bookingRequestId,
          memberId: req.memberId,
          // 👇 Use userName if available, else memberName
          memberName: req.userName || req.memberName || "Unknown",
          // 👇 Email is NOT in response → mark as not provided
          memberEmail: req.userEmail, // or omit entirely
          memberPhone: req.userPhone || req.memberPhone || "N/A",
          memberStatus: req.memberStatus || "Inactive",
          requestedPlan: req.planName, // since it's a membership request
          price: "N/A", // not in response
          validity: "N/A",
          upiId: "N/A",
          requestedAt: req.createdAt || "N/A",
          status: req.bookingStatus === "pending" ? "pending" : "approved",
          requestType: "membership",
        }));
        setMembershipRequests(formatted);
      }
    } catch (err) {
      console.error("Error fetching membership requests:", err);
    }
  };

  const fetchPlansFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminId = localStorage.getItem("userId") || "4";
      const response = await axiosInstance.get(
        `${BaseUrl}MemberPlan?adminId=${adminId}`
      );
      if (response.data.success) {
        const formattedPlans = response.data.plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          sessions: plan.sessions,
          validity: plan.validityDays,
          price: `₹${plan.price.toLocaleString()}`,
          active: plan.status !== undefined ? (plan.status === "Active" || plan.status === true) : true,
          type: plan.type.toLowerCase(),
          trainerType: plan.trainerType || "",
          trainerId: plan.trainerId || null,
        }));
        setApiPlans(formattedPlans);
        setPlansLoaded(true);
        setGroupPlans(formattedPlans.filter((p) => p.type === "group"));
        setPersonalPlans(formattedPlans.filter((p) => p.type === "personal"));
        setMembershipPlans(formattedPlans.filter((p) => p.type === "member"));
      } else {
        setError("Failed to fetch plans.");
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err.response?.data?.message || "Failed to fetch plans.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewalRequests = async () => {
    try {
      const response = await axiosInstance.get(`members/renew/${adminId}`);
      if (response?.data && response.data.success && response.data.data) {
        const payload = response.data.data;
        const members = Array.isArray(payload.members) ? payload.members : [];
        const plans = Array.isArray(payload.plans) ? payload.plans : [];

        const formatted = members.flatMap((member) => {
          const previews = Array.isArray(member.renewalPreview)
            ? member.renewalPreview
            : null;
          if (Array.isArray(previews) && previews.length > 0) {
            return previews.map((preview) => {
              const planMeta = plans.find((p) => p.id === preview.planId) || {};
              return {
                id: member.id,
                memberId: member.id,
                previewPlanId: preview.planId,
                memberName: member.fullName || "Unknown",
                memberEmail: member.userEmail || "N/A",
                memberPhone: member.phone || "N/A",
                currentPlan:
                  plans.find((p) => p.id === member.planId)?.name ||
                  (member.plan?.planName || member.plan?.name) ||
                  `Plan ${member.planId}` ||
                  "N/A",
                requestedPlan: preview.planName || planMeta.name || "Unknown",
                requestedPlanType: (planMeta.type || member.plan?.planType || "").toLowerCase() || "unknown",
                price: preview.price ? `₹${preview.price.toLocaleString()}` : (member.plan?.price ? `₹${member.plan.price}` : "N/A"),
                sessions: planMeta.sessions || member.plan?.sessions || "N/A",
                validity: preview.validityDays || planMeta.validityDays || member.plan?.validityDays || "N/A",
                membershipFrom: preview.previewMembershipFrom || member.previewMembershipFrom || member.membershipFrom || "N/A",
                membershipTo: preview.previewMembershipTo || member.previewMembershipTo || member.membershipTo || "N/A",
                requestedAt: member.previewMembershipFrom || member.membershipTo || new Date().toLocaleString(),
                status: "pending",
                branchId: member.branchId || null,
                requestType: "renewal",
              };
            });
          }
          if (member.plan) {
            const planObj = member.plan;
            return [
              {
                id: member.id,
                memberId: member.id,
                previewPlanId: planObj.planId || planObj.id || null,
                memberName: member.fullName || "Unknown",
                memberEmail: member.email || "N/A",
                memberPhone: member.phone || "N/A",
                currentPlan: (member.plan?.planName || member.plan?.name) || `Plan ${member.plan?.planId || member.plan?.id}` || "N/A",
                requestedPlan: member.plan?.planName || member.plan?.name || "Unknown",
                requestedPlanType: (member.plan?.planType || "").toLowerCase() || "unknown",
                price: member.plan?.price ? `₹${member.plan.price}` : (member.amountPaid ? `₹${member.amountPaid}` : "N/A"),
                sessions: member.plan?.sessions || "N/A",
                validity: member.plan?.validityDays || "N/A",
                membershipFrom: member.previewMembershipFrom || member.membershipFrom || "N/A",
                membershipTo: member.previewMembershipTo || member.membershipTo || "N/A",
                requestedAt: member.previewMembershipFrom || member.membershipTo || new Date().toLocaleString(),
                status: "pending",
                branchId: member.branchId || null,
                requestType: "renewal",
              },
            ];
          }
          return [
            {
              id: member.id,
              memberId: member.id,
              memberName: member.fullName || "Unknown",
              memberEmail: member.email || "N/A",
              memberPhone: member.phone || "N/A",
              currentPlan: "N/A",
              requestedPlan: "-",
              requestedPlanType: "-",
              price: member.amountPaid ? `₹${member.amountPaid}` : "N/A",
              sessions: "N/A",
              validity: "N/A",
              membershipFrom: member.membershipFrom || "N/A",
              membershipTo: member.membershipTo || "N/A",
              requestedAt: member.membershipTo || "N/A",
              status: "pending",
              branchId: member.branchId || null,
              requestType: "renewal",
            },
          ];
        });
        setRenewalRequests(formatted);
      }
    } catch (err) {
      console.error("Error fetching renewal requests:", err);
    }
  };

  const fetchPlanById = async (planId) => {
    setViewLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(
        `${BaseUrl}MemberPlan/${planId}`
      );
      if (response.data.success) {
        const plan = response.data.plan;
        const formattedPlan = {
          id: plan.id,
          name: plan.name,
          sessions: plan.sessions,
          validity: plan.validityDays,
          price: `₹${plan.price.toLocaleString()}`,
          active: plan.status !== undefined ? (plan.status === "Active" || plan.status === true) : true,
          type: plan.type.toLowerCase(),
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
        setSelectedPlan(formattedPlan);
        setShowViewModal(true);
      } else {
        setError("Failed to fetch plan details.");
      }
    } catch (err) {
      console.error("Error fetching plan:", err);
      setError(err.response?.data?.message || "Failed to fetch plan.");
    } finally {
      setViewLoading(false);
    }
  };

  const getPlansByType = (type) => {
    if (type === "group") return groupPlans;
    if (type === "personal") return personalPlans;
    if (type === "member") return membershipPlans;
    return [];
  };

  const updatePlansByType = (type, updatedPlans) => {
    if (type === "group") setGroupPlans(updatedPlans);
    else if (type === "personal") setPersonalPlans(updatedPlans);
    else if (type === "member") setMembershipPlans(updatedPlans);
  };

  const handleCreatePlan = async () => {
    if (
      !newPlan.name ||
      !newPlan.sessions ||
      !newPlan.validity ||
      !newPlan.price
    ) {
      setCreatePlanError("Please fill all fields");
      return;
    }
    if (
      newPlan.type === "member" &&
      (!newPlan.trainerType || !newPlan.trainerId)
    ) {
      setCreatePlanError(
        "Please select trainer type and trainer for membership plans"
      );
      return;
    }
    setLoading(true);
    setCreatePlanError(null);
    try {
      const adminId = localStorage.getItem("userId") || "4";
      const payload = {
        planName: newPlan.name,
        sessions: parseInt(newPlan.sessions),
        validity: parseInt(newPlan.validity),
        price: parseInt(newPlan.price),
        adminId: parseInt(adminId),
        type: newPlan.type.toUpperCase(),
      };
      if (newPlan.type === "member") {
        payload.trainerType = newPlan.trainerType;
        payload.trainerId = parseInt(newPlan.trainerId);
      }
      const response = await axiosInstance.post(
        `${BaseUrl}MemberPlan`,
        payload
      );
      if (response.data.success) {
        const plan = {
          id: response.data.plan.id,
          name: response.data.plan.name,
          sessions: response.data.plan.sessions,
          validity: response.data.plan.validityDays,
          price: `₹${response.data.plan.price.toLocaleString()}`,
          active: true,
          type: response.data.plan.type.toLowerCase(),
        };
        const currentPlans =
          newPlan.type === "group"
            ? groupPlans
            : newPlan.type === "personal"
              ? personalPlans
              : membershipPlans;
        updatePlansByType(newPlan.type, [...currentPlans, plan]);
        setApiPlans([...apiPlans, plan]);
        setNewPlan({
          name: "",
          sessions: "",
          validity: "",
          price: "",
          type: activeTab === "personal" ? "personal" : "group",
          trainerType: "",
          trainerId: "",
        });
        setShowCreateModal(false);
        alert(
          `✅ ${newPlan.type === "group"
            ? "Group"
            : newPlan.type === "personal"
              ? "Personal"
              : "Membership"
          } Plan Created: ${plan.name}`
        );
      } else {
        setCreatePlanError("Failed to create plan.");
      }
    } catch (err) {
      console.error("Error creating plan:", err);
      setCreatePlanError(
        err.response?.data?.message || "Failed to create plan."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlan = (plan, planType) => {
    setSelectedPlan({ ...plan, type: planType });
    setNewPlan({
      name: plan.name,
      sessions: plan.sessions.toString(),
      validity: plan.validity.toString(),
      price: plan.price.replace("₹", "").replace(",", ""),
      type: planType,
    });
    setShowEditModal(true);
  };

  const handleUpdatePlan = async () => {
    if (
      !newPlan.name ||
      !newPlan.sessions ||
      !newPlan.validity ||
      !newPlan.price
    ) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const adminId = localStorage.getItem("userId") || "4";
      const payload = {
        planName: newPlan.name,
        sessions: parseInt(newPlan.sessions),
        validity: parseInt(newPlan.validity),
        price: parseInt(newPlan.price),
        adminId: parseInt(adminId),
        type: newPlan.type.toUpperCase(),
      };
      const response = await axiosInstance.put(
        `${BaseUrl}MemberPlan/${adminId}/${selectedPlan.id}`,
        payload
      );
      if (response.data.success) {
        const updatedPlan = {
          ...selectedPlan,
          id: response.data.plan.id,
          name: response.data.plan.name,
          sessions: response.data.plan.sessions,
          validity: response.data.plan.validityDays,
          price: `₹${response.data.plan.price.toLocaleString()}`,
          type: response.data.plan.type.toLowerCase(),
          active: selectedPlan.active,
        };
        const currentPlans = getPlansByType(selectedPlan.type);
        updatePlansByType(
          selectedPlan.type,
          currentPlans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p))
        );
        setApiPlans(
          apiPlans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p))
        );
        setNewPlan({
          name: "",
          sessions: "",
          validity: "",
          price: "",
          type: "group",
        });
        setShowEditModal(false);
        setSelectedPlan(null);
        alert(`✅ Plan Updated: ${updatedPlan.name}`);
      } else {
        setError("Failed to update plan.");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      setError(err.response?.data?.message || "Failed to update plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = (planId, planType) => {
    setPlanToDelete({ id: planId, type: planType });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.delete(
        `${BaseUrl}MemberPlan/${planToDelete.id}`
      );
      if (response.data.success) {
        const { id, type } = planToDelete;
        const currentPlans = getPlansByType(type);
        updatePlansByType(
          type,
          currentPlans.filter((p) => p.id !== id)
        );
        setApiPlans(apiPlans.filter((p) => p.id !== id));
        setShowDeleteModal(false);
        alert("✅ Plan Deleted!");
      } else {
        setError("Failed to delete plan.");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError(err.response?.data?.message || "Failed to delete plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPlanToDelete({ id: null, type: null });
  };

  const handleTogglePlan = async (planId, planType) => {
    setLoading(true);
    setError(null);
    try {
      const currentPlans = getPlansByType(planType);
      const plan = currentPlans.find((p) => p.id === planId);
      if (!plan) {
        setError("Plan not found");
        return;
      }
      const newStatus = !plan.active ? "Active" : "Inactive";
      const response = await axiosInstance.put(
        `${BaseUrl}MemberPlan/${adminId}/${planId}`,
        {
          status: newStatus,
        }
      );
      if (response.data.success) {
        const updatedActiveStatus = response.data.plan.status === "Active" || response.data.plan.status === true;
        updatePlansByType(
          planType,
          currentPlans.map((p) =>
            p.id === planId ? { ...p, active: updatedActiveStatus } : p
          )
        );
        setApiPlans(
          apiPlans.map((p) =>
            p.id === planId ? { ...p, active: updatedActiveStatus } : p
          )
        );
        if (selectedPlan && selectedPlan.id === planId) {
          setSelectedPlan({ ...selectedPlan, active: updatedActiveStatus });
        }
        alert(`✅ Plan status updated to ${newStatus}!`);
      } else {
        setError("Failed to update plan status.");
      }
    } catch (err) {
      console.error("Error toggling plan:", err);
      setError(err.response?.data?.message || "Failed to update plan status.");
    } finally {
      setLoading(false);
    }
  };

  // 👇 Handle Membership Request Approval/Rejection
  const handleProcessMembershipStatus = async (status) => {
    if (!requestToProcess || requestToProcess.requestType !== "membership") return;
    try {
      const endpoint = `booking/approve/${requestToProcess.bookingRequestId}`;
      const payload = {
        status: status === "approved" ? "approved" : "rejected",
      };
      const response = await axiosInstance.post(endpoint, payload);
      if (response.data.success) {
        setMembershipRequests((prev) =>
          prev.map((req) =>
            req.id === requestToProcess.id ? { ...req, status } : req
          )
        );
        const msg =
          status === "approved"
            ? "✅ Membership Request Approved!"
            : "❌ Membership Request Rejected.";
        alert(msg);
        setShowStatusModal(false);
        setRequestToProcess(null);
      } else {
        setError("Failed to update membership request status.");
      }
    } catch (err) {
      console.error("Error updating membership request:", err);
      setError(
        err.response?.data?.message ||
        "Failed to update request status. Please try again."
      );
    }
  };

  const handleOpenStatusModal = (request) => {
    setRequestToProcess(request);
    setShowStatusModal(true);
  };

  const handleProcessStatus = async (status) => {
    if (!requestToProcess) return;
    if (requestToProcess.requestType === "renewal") {
      // Existing renewal logic
      try {
        const { memberId, previewPlanId } = requestToProcess;
        if (!memberId) {
          setError("Member ID is missing in the request.");
          return;
        }
        const endpoint = `/members/admin/renewal/${memberId}/status`;
        const payload = {
          adminId: parseInt(adminId),
          ...(previewPlanId && { planId: parseInt(previewPlanId) }),
          status: status === "approved" ? "Active" : "Reject",
        };
        const response = await axiosInstance.put(endpoint, payload);
        if (response.data.success) {
          setRenewalRequests((prev) =>
            prev.map((req) =>
              req.id === requestToProcess.id ? { ...req, status } : req
            )
          );
          const msg =
            status === "approved"
              ? "✅ Renewal Approved! Member will be notified."
              : "❌ Renewal Rejected. Member will be notified.";
          alert(msg);
          setShowStatusModal(false);
          setRequestToProcess(null);
        } else {
          setError("Failed to update renewal status.");
        }
      } catch (err) {
        console.error("Error updating renewal status:", err);
        setError(
          err.response?.data?.message ||
          "Failed to update renewal status. Please try again."
        );
      }
    } else if (requestToProcess.requestType === "membership") {
      await handleProcessMembershipStatus(status);
    }
  };

  const pendingRenewals = renewalRequests.filter((r) => r.status === "pending");
  const approvedRenewals = renewalRequests.filter(
    (r) => r.status === "approved"
  );
  const rejectedRenewals = renewalRequests.filter(
    (r) => r.status === "rejected"
  );

  const pendingMemberships = membershipRequests.filter((r) => r.status === "pending");
  const approvedMemberships = membershipRequests.filter(
    (r) => r.status === "approved"
  );
  const rejectedMemberships = membershipRequests.filter(
    (r) => r.status === "rejected"
  );

  const renewalStats = [
    {
      label: "Pending Renewals",
      count: pendingRenewals.length,
      bg: "#fff3cd",
      color: "#856404",
    },
    {
      label: "Approved Renewals",
      count: approvedRenewals.length,
      bg: "#d1ecf1",
      color: "#0c5460",
    },
    {
      label: "Rejected Renewals",
      count: rejectedRenewals.length,
      bg: "#f8d7da",
      color: "#721c24",
    },
  ];

  const membershipStats = [
    {
      label: "Pending Membership",
      count: pendingMemberships.length,
      bg: "#fff3cd",
      color: "#856404",
    },
    {
      label: "Approved Membership",
      count: approvedMemberships.length,
      bg: "#d1ecf1",
      color: "#0c5460",
    },
    {
      label: "Rejected Membership",
      count: rejectedMemberships.length,
      bg: "#f8d7da",
      color: "#721c24",
    },
  ];

  const renderPlanCard = (plan, planType) => (
    <Col xs={12} sm={6} lg={4} key={plan.id} className="d-flex mb-3">
      <Card
        className="h-100 shadow-sm border-0 w-100"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <div
          style={{
            height: "6px",
            backgroundColor: plan.active ? customColor : "#ccc",
            width: "100%",
          }}
        ></div>
        <Card.Body className="d-flex flex-column p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div
                className="badge mb-2 px-2 py-1"
                style={{
                  backgroundColor: customColor,
                  color: "white",
                  fontSize: "0.7rem",
                }}
              >
                {planType === "group"
                  ? "GROUP"
                  : planType === "personal"
                    ? "PERSONAL"
                    : "MEMBER"}
              </div>
              <h5
                className="fw-bold mb-0"
                style={{
                  color: customColor,
                  fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
                }}
              >
                {plan.name}
              </h5>
            </div>
            <div className="d-flex gap-1">
              <Button
                variant="link"
                size="sm"
                className="p-1 rounded-circle"
                style={{
                  color: "#6EB2CC",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
                onClick={() => fetchPlanById(plan.id)}
              >
                <FaEye size={14} />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="p-1 rounded-circle"
                style={{
                  color: "#6EB2CC",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
                onClick={() => handleEditPlan(plan, planType)}
              >
                <FaEdit size={14} />
              </Button>
              <Button
                variant="link"
                size="sm"
                className="p-1 rounded-circle"
                style={{
                  color: "#dc3545",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                }}
                onClick={() => handleDeletePlan(plan.id, planType)}
              >
                <FaTrash size={14} />
              </Button>
            </div>
          </div>
          <ul className="list-unstyled mb-3 flex-grow-1">
            <li className="mb-2 d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                🎯
              </span>
              <strong style={{ fontSize: "0.9rem" }}>
                {plan.sessions} Sessions
              </strong>
            </li>
            <li className="mb-2 d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                📅
              </span>
              <strong style={{ fontSize: "0.9rem" }}>
                Validity: {plan.validity} Days
              </strong>
            </li>
            <li className="mb-2 d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                💰
              </span>
              <strong style={{ fontSize: "0.9rem" }}>
                Price: {plan.price}
              </strong>
            </li>
            {planType === "member" && plan.trainerType && (
              <li className="mb-2 d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                  👤
                </span>
                <strong style={{ fontSize: "0.9rem" }}>
                  Trainer Type:{" "}
                  {plan.trainerType === "personal"
                    ? "Personal Trainer"
                    : "General Trainer"}
                </strong>
              </li>
            )}
          </ul>
          <div className="d-flex gap-2 mt-auto">
            {plan.active ? (
              <Button
                size="sm"
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-medium"
                onClick={() => handleTogglePlan(plan.id, planType)}
                style={{
                  backgroundColor: customColor,
                  borderColor: customColor,
                  color: "white",
                  fontSize: "0.8rem",
                  padding: "0.3rem 0.5rem",
                }}
              >
                <FaToggleOn size={12} /> Active
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-medium"
                onClick={() => handleTogglePlan(plan.id, planType)}
                style={{
                  backgroundColor: "#6c757d",
                  borderColor: "#6c757d",
                  color: "white",
                  fontSize: "0.8rem",
                  padding: "0.3rem 0.5rem",
                }}
              >
                <FaToggleOff size={12} /> Inactive
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  const renderRequestRow = (req, index, type) => (
    <tr key={req.id}>
      <td>{index + 1}</td>
      <td>
        <strong>{req.memberName}</strong>
        <div className="text-muted small">{req.memberEmail}</div>
      </td>
      <td>
        <div>{req.requestedPlan}</div>
        <div className="text-muted small">Requested Plan</div>
      </td>
      <td>
        <span
          className="badge px-3 py-2"
          style={{
            backgroundColor: customColor,
            color: "white",
            borderRadius: "20px",
          }}
        >
          {type === "renewal" ? req.requestedPlanType : "Membership"}
        </span>
      </td>
      <td>{req.requestedAt}</td>
      <td>
        {req.status === "pending" && (
          <span
            className="badge bg-warning text-dark px-3 py-2"
            style={{ borderRadius: "20px" }}
          >
            Pending
          </span>
        )}
        {req.status === "approved" && (
          <span
            className="badge px-3 py-2"
            style={{
              backgroundColor: customColor,
              color: "white",
              borderRadius: "20px",
            }}
          >
            Approved
          </span>
        )}
        {req.status === "rejected" && (
          <span
            className="badge bg-danger px-3 py-2"
            style={{ borderRadius: "20px" }}
          >
            Rejected
          </span>
        )}
      </td>
      <td>
        <div className="d-flex gap-2 align-items-center">
          {req.status === "pending" ? (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              onClick={() => handleOpenStatusModal(req)}
              style={{
                backgroundColor: "#ffc107",
                borderColor: "#ffc107",
                color: "#212529",
              }}
            >
              <FaToggleOn size={14} /> Process
            </Button>
          ) : req.status === "approved" ? (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              style={{
                backgroundColor: customColor,
                borderColor: customColor,
                color: "white",
              }}
              disabled
            >
              <FaToggleOn size={14} /> Active
            </Button>
          ) : (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              style={{
                backgroundColor: "#6c757d",
                borderColor: "#6c757d",
                color: "white",
              }}
              disabled
            >
              <FaToggleOff size={14} /> Inactive
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  const renderRequestCard = (req, index, type) => (
    <Card
      key={req.id}
      className="mb-3 border shadow-sm"
      style={{ borderRadius: "10px" }}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0 fw-bold">{req.memberName}</h6>
          <span className="badge bg-secondary rounded-pill">{index + 1}</span>
        </div>
        <div className="mb-2">
          <span className="text-muted small">Email: </span>
          {req.memberEmail}
        </div>
        <div className="mb-2">
          <span className="text-muted small">Requested Plan: </span>
          {req.requestedPlan}
        </div>
        <div className="mb-2">
          <span className="text-muted small">Type: </span>
          <span
            className="badge px-2 py-1"
            style={{
              backgroundColor: customColor,
              color: "white",
              borderRadius: "20px",
            }}
          >
            {type === "renewal" ? req.requestedPlanType : "Membership"}
          </span>
        </div>
        <div className="row mb-2">
          <div className="col-6">
            <span className="text-muted small">Price: </span>
            {req.price}
          </div>
          <div className="col-6">
            <span className="text-muted small">Validity: </span>
            {req.validity} days
          </div>
        </div>
        <div className="mb-3">
          <span className="text-muted small">Requested: </span>
          {req.requestedAt}
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            {req.status === "pending" && (
              <span
                className="badge bg-warning text-dark px-3 py-2"
                style={{ borderRadius: "20px" }}
              >
                Pending
              </span>
            )}
            {req.status === "approved" && (
              <span
                className="badge px-3 py-2"
                style={{
                  backgroundColor: customColor,
                  color: "white",
                  borderRadius: "20px",
                }}
              >
                Approved
              </span>
            )}
            {req.status === "rejected" && (
              <span
                className="badge bg-danger px-3 py-2"
                style={{ borderRadius: "20px" }}
              >
                Rejected
              </span>
            )}
          </div>
          {req.status === "pending" ? (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              onClick={() => handleOpenStatusModal(req)}
              style={{
                backgroundColor: "#ffc107",
                borderColor: "#ffc107",
                color: "#212529",
              }}
            >
              <FaToggleOn size={14} /> Process
            </Button>
          ) : req.status === "approved" ? (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              style={{
                backgroundColor: customColor,
                borderColor: customColor,
                color: "white",
              }}
              disabled
            >
              <FaToggleOn size={14} /> Active
            </Button>
          ) : (
            <Button
              size="sm"
              className="d-flex align-items-center gap-1 fw-medium"
              style={{
                backgroundColor: "#6c757d",
                borderColor: "#6c757d",
                color: "white",
              }}
              disabled
            >
              <FaToggleOff size={14} /> Inactive
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="bg-light min-vh-100">
      <Container fluid className="px-2 px-sm-3 px-md-5 py-3 py-md-4">
        <h1
          className="mb-3 mb-md-4 fw-bold text-dark"
          style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
        >
          Plan & Booking Management
        </h1>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4 p-3 bg-white rounded shadow-sm border">
          <div className="d-flex flex-column flex-md-row gap-3 w-100 w-md-auto">
            <Button
              variant={activeTab === "group" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("group")}
              className="px-3 px-md-4 py-2 fw-medium d-flex align-items-center justify-content-center"
              style={{
                backgroundColor:
                  activeTab === "group" ? customColor : "transparent",
                borderColor: customColor,
                color: activeTab === "group" ? "white" : customColor,
                width: "100%",
                maxWidth: "300px",
              }}
            >
              Group Class Plans
            </Button>
            <Button
              variant={activeTab === "personal" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("personal")}
              className="px-3 px-md-4 py-2 fw-medium d-flex align-items-center justify-content-center"
              style={{
                backgroundColor:
                  activeTab === "personal" ? customColor : "transparent",
                borderColor: customColor,
                color: activeTab === "personal" ? "white" : customColor,
                width: "100%",
                maxWidth: "300px",
              }}
            >
              Personal Training Plans
            </Button>
            <Button
              variant={activeTab === "member" ? "primary" : "outline-primary"}
              onClick={() => setActiveTab("member")}
              className="px-3 px-md-4 py-2 fw-medium d-flex align-items-center justify-content-center"
              style={{
                backgroundColor:
                  activeTab === "member" ? customColor : "transparent",
                borderColor: customColor,
                color: activeTab === "member" ? "white" : customColor,
                width: "100%",
                maxWidth: "300px",
              }}
            >
              MemberShip Plans
            </Button>
          </div>
          <Button
            onClick={() => {
              setNewPlan({
                name: "",
                sessions: "",
                validity: "",
                price: "",
                type:
                  activeTab === "personal"
                    ? "personal"
                    : activeTab === "member"
                      ? "member"
                      : "group",
                trainerType: "",
                trainerId: "",
              });
              setCreatePlanError(null);
              setShowCreateModal(true);
            }}
            className="px-3 px-md-4 py-2 d-flex align-items-center justify-content-center"
            style={{
              backgroundColor: customColor,
              borderColor: customColor,
              color: "white",
              width: "100%",
              maxWidth: "200px",
            }}
          >
            <FaPlus size={14} className="me-2" />
            Create Plan
          </Button>
        </div>

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row>
            <Col md={12}>
              <Tab.Content>
                <Tab.Pane eventKey="group">
                  {loading && !plansLoaded ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                        style={{ color: customColor }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Loading plans...</p>
                    </div>
                  ) : groupPlans.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-4 mb-3">📋</div>
                      <p className="fs-5">No group plans found.</p>
                    </div>
                  ) : (
                    <Row className="g-2 g-md-3">
                      {getPlansByType("group").map((plan) =>
                        renderPlanCard(plan, "group")
                      )}
                    </Row>
                  )}
                </Tab.Pane>
                <Tab.Pane eventKey="personal">
                  {loading && !plansLoaded ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                        style={{ color: customColor }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Loading plans...</p>
                    </div>
                  ) : personalPlans.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-4 mb-3">📋</div>
                      <p className="fs-5">No personal plans found.</p>
                    </div>
                  ) : (
                    <Row className="g-2 g-md-3">
                      {getPlansByType("personal").map((plan) =>
                        renderPlanCard(plan, "personal")
                      )}
                    </Row>
                  )}
                </Tab.Pane>
                <Tab.Pane eventKey="member">
                  {loading && !plansLoaded ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                        style={{ color: customColor }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3">Loading plans...</p>
                    </div>
                  ) : membershipPlans.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-4 mb-3">📋</div>
                      <p className="fs-5">No membership plans found.</p>
                    </div>
                  ) : (
                    <Row className="g-2 g-md-3">
                      {getPlansByType("member").map((plan) =>
                        renderPlanCard(plan, "member")
                      )}
                    </Row>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>

        {/* =============== MEMBERSHIP & RENEWAL REQUESTS SECTION =============== */}
        <div
          className="mt-5 pt-4 border-top"
          style={{ borderColor: customColor }}
        >
          <h3
            className="fw-bold mb-4 text-dark"
            style={{ fontSize: "clamp(1.2rem, 3vw, 1.4rem)" }}
          >
            Booking Requests
          </h3>

          {/* Request Tabs */}
          <Nav
            variant="tabs"
            activeKey={activeRequestTab}
            onSelect={(k) => setActiveRequestTab(k)}
            className="mb-4"
          >
            <Nav.Item>
              <Nav.Link eventKey="renewal">All Renewal Requests</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="membership">Membership Requests</Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Renewal Requests Tab */}
          {activeRequestTab === "renewal" && (
            <>
              <Row className="mb-4 g-3">
                {renewalStats.map((item, i) => (
                  <Col xs={12} sm={6} md={4} key={i}>
                    <Card
                      className="text-center border-0 shadow-sm h-100"
                      style={{ backgroundColor: "#f8f9fa", borderRadius: "12px" }}
                    >
                      <Card.Body className="py-3 py-md-4">
                        <div
                          className="d-flex justify-content-center align-items-center mb-2"
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: item.bg,
                            margin: "0 auto",
                          }}
                        >
                          <span
                            className="fw-bold"
                            style={{ color: item.color, fontSize: "1.5rem" }}
                          >
                            {item.count}
                          </span>
                        </div>
                        <h5 className="fw-bold mb-1" style={{ color: customColor }}>
                          {item.label}
                        </h5>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card className="border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                <Card.Header
                  className="bg-light border-0 pb-3"
                  style={{ borderBottom: `3px solid ${customColor}` }}
                >
                  <h5 className="mb-0 text-dark" style={{ fontWeight: "600" }}>
                    Renewal Requests
                  </h5>
                  <small className="text-muted">
                    Total: {renewalRequests.length} requests
                  </small>
                </Card.Header>
                <Card.Body className="p-0">
                  {renewalRequests.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <div className="display-4 mb-3">📭</div>
                      <p className="fs-5">No renewal requests yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table hover responsive className="align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>#</th>
                              <th>Member</th>
                              <th>Requested Plan</th>
                              <th>Type</th>
                              <th>Requested At</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {renewalRequests.map((req, index) =>
                              renderRequestRow(req, index, "renewal")
                            )}
                          </tbody>
                        </Table>
                      </div>
                      <div className="d-md-none p-3">
                        {renewalRequests.map((req, index) =>
                          renderRequestCard(req, index, "renewal")
                        )}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {/* Membership Requests Tab */}
          {activeRequestTab === "membership" && (
            <>
              <Row className="mb-4 g-3">
                {membershipStats.map((item, i) => (
                  <Col xs={12} sm={6} md={4} key={i}>
                    <Card
                      className="text-center border-0 shadow-sm h-100"
                      style={{ backgroundColor: "#f8f9fa", borderRadius: "12px" }}
                    >
                      <Card.Body className="py-3 py-md-4">
                        <div
                          className="d-flex justify-content-center align-items-center mb-2"
                          style={{
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            backgroundColor: item.bg,
                            margin: "0 auto",
                          }}
                        >
                          <span
                            className="fw-bold"
                            style={{ color: item.color, fontSize: "1.5rem" }}
                          >
                            {item.count}
                          </span>
                        </div>
                        <h5 className="fw-bold mb-1" style={{ color: customColor }}>
                          {item.label}
                        </h5>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Card className="border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                <Card.Header
                  className="bg-light border-0 pb-3"
                  style={{ borderBottom: `3px solid ${customColor}` }}
                >
                  <h5 className="mb-0 text-dark" style={{ fontWeight: "600" }}>
                    Membership Requests
                  </h5>
                  <small className="text-muted">
                    Total: {membershipRequests.length} requests
                  </small>
                </Card.Header>
                <Card.Body className="p-0">
                  {membershipRequests.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <div className="display-4 mb-3">📭</div>
                      <p className="fs-5">No membership requests yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive d-none d-md-block">
                        <Table hover responsive className="align-middle mb-0">
                          <thead className="bg-light">
                            <tr>
                              <th>#</th>
                              <th>Member</th>
                              <th>Requested Plan</th>
                              <th>Type</th>
                              <th>Requested At</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {membershipRequests.map((req, index) =>
                              renderRequestRow(req, index, "membership")
                            )}
                          </tbody>
                        </Table>
                      </div>
                      <div className="d-md-none p-3">
                        {membershipRequests.map((req, index) =>
                          renderRequestCard(req, index, "membership")
                        )}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </div>

        {/* Status Modal */}
        <Modal
          show={showStatusModal}
          onHide={() => setShowStatusModal(false)}
          centered
          size="sm"
        >
          <Modal.Header
            className="py-2 px-3"
            style={{
              backgroundColor: "#f8f9fa",
              borderBottom: `2px solid ${customColor}`,
            }}
          >
            <Modal.Title
              style={{ color: "#333", fontWeight: "600", fontSize: "1.1rem" }}
            >
              {requestToProcess?.requestType === "membership"
                ? "Process Membership Request"
                : "Process Renewal Request"}
            </Modal.Title>
            <Button
              variant="link"
              className="p-0 m-0"
              onClick={() => setShowStatusModal(false)}
              style={{ color: "#6c757d" }}
            >
              <span aria-hidden="true">&times;</span>
            </Button>
          </Modal.Header>
          <Modal.Body className="py-3 px-3">
            {requestToProcess && (
              <div>
                <p className="mb-2 fw-medium text-center">
                  {requestToProcess.requestType === "membership"
                    ? "Process membership request from:"
                    : "Process renewal request from:"}
                </p>
                <div className="text-center mb-3">
                  <strong>{requestToProcess.memberName}</strong>
                  <div className="text-muted small">
                    {requestToProcess.memberEmail}
                  </div>
                  <div className="text-muted small">
                    {requestToProcess.requestedPlan}
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-center">
                  <Button
                    variant="success"
                    size="sm"
                    className="px-3"
                    onClick={() => handleProcessStatus("approved")}
                    style={{ backgroundColor: "#28a745", borderColor: "#28a745" }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="px-3"
                    onClick={() => handleProcessStatus("rejected")}
                    style={{ backgroundColor: "#dc3545", borderColor: "#dc3545" }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Other Modals (Create, Edit, View, Delete) — unchanged */}

        {/* Create Plan Modal */}
        <Modal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          centered
          size="lg"
          fullscreen="sm-down"
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: "#f8f9fa",
              borderBottom: `2px solid ${customColor}`,
            }}
          >
            <Modal.Title style={{ color: "#333", fontWeight: "600" }}>
              Create New{" "}
              {newPlan.type === "group"
                ? "Group"
                : newPlan.type === "personal"
                  ? "Personal"
                  : "Membership"}{" "}
              Plan
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            {createPlanError && (
              <Alert variant="danger">{createPlanError}</Alert>
            )}
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Plan Type</Form.Label>
                <Form.Select
                  value={newPlan.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setNewPlan({
                      ...newPlan,
                      type: type,
                      trainerType: type === "member" ? newPlan.trainerType : "",
                      trainerId: type === "member" ? newPlan.trainerId : "",
                    });
                  }}
                  style={{ padding: "12px", fontSize: "1rem" }}
                >
                  <option value="personal">Personal Training Plan</option>
                  <option value="group">Group Class Plan</option>
                  <option value="member">MemberShip Plan</option>
                </Form.Select>
              </Form.Group>
              {newPlan.type === "member" && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-medium">
                          Trainer Type
                        </Form.Label>
                        <Form.Select
                          value={newPlan.trainerType}
                          onChange={(e) => {
                            setNewPlan({
                              ...newPlan,
                              trainerType: e.target.value,
                              trainerId: "",
                            });
                          }}
                          style={{ padding: "12px", fontSize: "1rem" }}
                        >
                          <option value="">Select Trainer Type</option>
                          <option value="personal">Personal Trainer</option>
                          <option value="general">General Trainer</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-medium">
                          Select Trainer
                        </Form.Label>
                        {trainersLoading ? (
                          <div className="d-flex align-items-center">
                            <div
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            >
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            Loading trainers...
                          </div>
                        ) : (
                          <Form.Select
                            value={newPlan.trainerId}
                            onChange={(e) =>
                              setNewPlan({
                                ...newPlan,
                                trainerId: e.target.value,
                              })
                            }
                            style={{ padding: "12px", fontSize: "1rem" }}
                            disabled={
                              !newPlan.trainerType || trainers.length === 0
                            }
                          >
                            <option value="">
                              {newPlan.trainerType
                                ? "Select a Trainer"
                                : "Select Trainer Type First"}
                            </option>
                            {trainers.map((trainer) => (
                              <option key={trainer.id} value={trainer.id}>
                                {trainer.fullName}
                              </option>
                            ))}
                          </Form.Select>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Plan Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Premium Pack"
                      value={newPlan.name}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, name: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">
                      Number of Sessions
                    </Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="e.g., 12"
                      value={newPlan.sessions}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, sessions: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">
                      Validity (Days)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="e.g., 60"
                      value={newPlan.validity}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, validity: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Price (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="e.g., 5999"
                      value={newPlan.price}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, price: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer
            style={{ borderTop: "1px solid #eee" }}
            className="flex-column flex-sm-row"
          >
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="w-100 w-sm-auto"
              style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              disabled={loading}
              className="w-100 w-sm-auto mt-2 mt-sm-0"
              style={{ backgroundColor: customColor, borderColor: customColor }}
            >
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit, View, Delete Modals — unchanged from your original code (kept for completeness but not shown here to save space) */}

        {/* Edit Plan Modal */}
        <Modal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          centered
          size="lg"
          fullscreen="sm-down"
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: "#f8f9fa",
              borderBottom: `2px solid ${customColor}`,
            }}
          >
            <Modal.Title>
              Edit{" "}
              {selectedPlan?.type === "group"
                ? "Group"
                : selectedPlan?.type === "personal"
                  ? "Personal"
                  : "Membership"}{" "}
              Plan
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            {error && <Alert variant="danger">{error}</Alert>}
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Plan Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newPlan.name}
                  onChange={(e) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
                  }
                  style={{ padding: "12px", fontSize: "1rem" }}
                />
              </Form.Group>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Sessions</Form.Label>
                    <Form.Control
                      type="number"
                      value={newPlan.sessions}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, sessions: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">
                      Validity (Days)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      value={newPlan.validity}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, validity: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium">Price (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      value={newPlan.price}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, price: e.target.value })
                      }
                      style={{ padding: "12px", fontSize: "1rem" }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer
            style={{ borderTop: "1px solid #eee" }}
            className="flex-column flex-sm-row"
          >
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              className="w-100 w-sm-auto"
              style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePlan}
              disabled={loading}
              className="w-100 w-sm-auto mt-2 mt-sm-0"
              style={{
                backgroundColor: customColor,
                borderColor: customColor,
                color: "#fff",
              }}
            >
              {loading ? "Updating..." : "Update Plan"}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* View Plan Modal */}
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          centered
          size="lg"
          fullscreen="sm-down"
        >
          <Modal.Header
            closeButton
            style={{
              backgroundColor: "#f8f9fa",
              borderBottom: `2px solid ${customColor}`,
            }}
          >
            <Modal.Title>View Plan Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            {viewLoading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-primary"
                  style={{ color: customColor }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Fetching plan details...</p>
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : selectedPlan ? (
              <div className="p-4 bg-light rounded">
                <h5 className="fw-bold mb-4">
                  {selectedPlan.name} (
                  {selectedPlan.type === "group"
                    ? "Group"
                    : selectedPlan.type === "personal"
                      ? "Personal"
                      : "Membership"}
                  )
                </h5>
                <div className="row">
                  {[
                    {
                      label: "Sessions",
                      value: selectedPlan.sessions,
                      icon: "🎯",
                    },
                    {
                      label: "Validity",
                      value: `${selectedPlan.validity} days`,
                      icon: "📅",
                    },
                    { label: "Price", value: selectedPlan.price, icon: "💰" },
                    {
                      label: "Status",
                      value: selectedPlan.active ? "Active" : "Inactive",
                      icon: "⚡",
                    },
                    {
                      label: "Created At",
                      value: selectedPlan.createdAt
                        ? new Date(selectedPlan.createdAt).toLocaleString()
                        : "N/A",
                      icon: "🕒",
                    },
                    {
                      label: "Last Updated",
                      value: selectedPlan.updatedAt
                        ? new Date(selectedPlan.updatedAt).toLocaleString()
                        : "N/A",
                      icon: "🔄",
                    },
                  ].map((item, i) => (
                    <div className="col-md-6 mb-3" key={i}>
                      <div className="d-flex align-items-center">
                        <span
                          className="me-3"
                          style={{ color: customColor, fontSize: "1.2rem" }}
                        >
                          {item.icon}
                        </span>
                        <div>
                          <div className="text-muted small">{item.label}</div>
                          <div className="fw-bold">{item.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-5">No plan details available.</div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowViewModal(false)}
              style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={handleCancelDelete} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <p className="text-center fw-medium">
              Are you sure you want to delete this plan?
            </p>
            <p className="text-center text-muted small">
              This action cannot be undone.
            </p>
          </Modal.Body>
          <Modal.Footer className="justify-content-center flex-column flex-sm-row">
            <Button
              variant="secondary"
              onClick={handleCancelDelete}
              className="w-100 w-sm-auto"
              style={{ backgroundColor: "#6c757d", borderColor: "#6c757d" }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={loading}
              className="w-100 w-sm-auto mt-2 mt-sm-0"
              style={{ backgroundColor: "#dc3545", borderColor: "#dc3545" }}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default CreatePlan;