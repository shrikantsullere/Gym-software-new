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
    FaBook,
} from "react-icons/fa";
import axiosInstance from "../../Api/axiosInstance";
import BaseUrl from "../../Api/BaseUrl";

const MemberAllPlans = () => {
    const [activeTab, setActiveTab] = useState("group");
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [membershipPlans, setMembershipPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [apiPlans, setApiPlans] = useState([]);
    const [plansLoaded, setPlansLoaded] = useState(false);
    const [renewalRequests, setRenewalRequests] = useState([]);
    const [membershipRequests, setMembershipRequests] = useState([]);
    const [activeRequestTab, setActiveRequestTab] = useState("renewal");
    const [trainers, setTrainers] = useState([]);
    const [trainersLoading, setTrainersLoading] = useState(false);
    const customColor = "#6EB2CC";
    const [groupPlans, setGroupPlans] = useState([]);
    const [personalPlans, setPersonalPlans] = useState([]);
    const [bookingForm, setBookingForm] = useState({
        memberId: "",
        planId: "",
        paymentMethod: "upi", // Default to upi
        transactionId: "",
        paymentProofImage: null,
    });
    const [settings, setSettings] = useState(null);

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
    const userId = user?.id || null;
    const branchId = user?.branchId || null;
    const adminId = user?.adminId || null;
    const name = user?.fullName || null;
    const [actualMemberId, setActualMemberId] = useState(null); // ✅ Store actual memberId

    console.log("admin id User:", adminId);
    
    // ✅ Fetch actual memberId from member profile API using userId
    useEffect(() => {
        const fetchMemberId = async () => {
            if (!userId) return;
            try {
                // Fetch member profile - it returns memberId
                const response = await axiosInstance.get(`member-self/profile/${userId}`);
                if (response.data?.success && response.data?.profile?.memberId) {
                    setActualMemberId(response.data.profile.memberId);
                } else {
                    // Fallback: use userId (in some cases userId = memberId)
                    console.warn("memberId not found in profile, using userId");
                    setActualMemberId(userId);
                }
            } catch (err) {
                console.error("Error fetching memberId:", err);
                // Fallback to userId
                setActualMemberId(userId);
            }
        };
        fetchMemberId();
    }, [userId]);

    const memberId = actualMemberId || user?.memberId || userId; // ✅ Use actual memberId
    
    // Fetch all data on mount
    useEffect(() => {
        if (adminId && memberId) {
            fetchPlansFromAPI();
            fetchRenewalRequests();
            fetchMembershipRequests();
        }
        if (adminId) {
            fetchSettings();
        }
    }, [adminId, memberId]);

    const fetchSettings = async () => {
        try {
            const response = await axiosInstance.get(`global-settings/public/${adminId}`);
            if (response.data.success) {
                setSettings(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    // Fetch trainers when trainer type changes
    useEffect(() => {
        if (selectedPlan && selectedPlan.type === "member" && selectedPlan.trainerType) {
            fetchTrainers(selectedPlan.trainerType);
        }
    }, [selectedPlan]);

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

    // Fetch Membership Booking Requests
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
                    memberName: req.userName || req.memberName || "Unknown",
                    memberEmail: req.userEmail,
                    memberPhone: req.userPhone || req.memberPhone || "N/A",
                    memberStatus: req.memberStatus || "Inactive",
                    requestedPlan: req.planName,
                    price: "N/A",
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
            const response = await axiosInstance.get(
                `${BaseUrl}MemberPlan?adminId=${adminId}`
            );
            if (response.data.success) {
                // Only keep active plans
                const activePlans = response.data.plans.filter(plan => 
                    plan.status === "Active" || plan.status === true
                );
                
                const formattedPlans = activePlans.map((plan) => ({
                    id: plan.id,
                    name: plan.name,
                    sessions: plan.sessions,
                    validity: plan.validityDays,
                    price: `₹${plan.price.toLocaleString()}`,
                    numericPrice: plan.price, // ✅ Store numeric price for API calls
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

    const getPlansByType = (type) => {
        if (type === "group") return groupPlans;
        if (type === "personal") return personalPlans;
        if (type === "member") return membershipPlans;
        return [];
    };

    const handleBookPlan = (plan) => {
        setSelectedPlan(plan);
        setBookingForm({
            memberId: memberId,
            planId: plan.id,
            paymentMethod: "upi",
            transactionId: "",
            paymentProofImage: null,
        });
        setShowBookingModal(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        if (!bookingForm.transactionId && bookingForm.paymentMethod === "upi") {
            setError("Please provide UPI transaction ID");
            return;
        }

        if (!memberId || !adminId) {
            setError("Member or Admin information missing. Please log in again.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Get plan details to get price
            const plan = selectedPlan;
            // Extract numeric price from plan (handle both string and number)
            let planPrice = 0;
            if (plan?.numericPrice) {
                planPrice = Number(plan.numericPrice);
            } else if (plan?.price) {
                // Parse from string like "₹1,500" or "1500"
                planPrice = parseFloat(String(plan.price).replace(/[₹,]/g, '')) || 0;
            }
            
            if (planPrice <= 0) {
                setError("Invalid plan price. Please select a valid plan.");
                setLoading(false);
                return;
            }


                // Cash/UPI Offline Booking Request (Needs admin/staff approval)
                const formData = new FormData();
                formData.append('fullName', name || user?.fullName || "Member");
                formData.append('email', user?.email || "");
                formData.append('phone', user?.phone || "");
                formData.append('gender', user?.gender || "Male");
                formData.append('adminId', parseInt(adminId));
                if (branchId) formData.append('branchId', parseInt(branchId));
                formData.append('planId', parseInt(bookingForm.planId));
                formData.append('price', planPrice);
                formData.append('userId', parseInt(userId)); // Pass userId so backend knows it's an existing member
                
                const pm = bookingForm.paymentMethod === "upi" ? "UPI" : "Cash";
                formData.append('paymentMode', pm);

                if (pm === "UPI") {
                    formData.append('upiId', bookingForm.transactionId);
                    if (bookingForm.paymentProofImage) {
                        formData.append('paymentProofImage', bookingForm.paymentProofImage);
                    }
                }

                const response = await axiosInstance.post(
                    `${BaseUrl}booking/create`,
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                if (response.data.success) {
                    alert("📝 Booking request submitted successfully! Your plan will be activated once the gym admin approves your offline payment.");
                    setShowBookingModal(false);
                    setSelectedPlan(null);
                    setBookingForm({
                        memberId: "",
                        planId: "",
                        paymentMethod: "upi",
                        transactionId: "",
                        paymentProofImage: null
                    });
                    
                    window.location.reload();  
                } else {
                    setError(response.data.message || "Failed to submit booking request.");
                }
        } catch (err) {
            console.error("Error purchasing plan:", err);
            setError(err.response?.data?.message || "Failed to purchase plan. Please try again.");
        } finally {
            setLoading(false);
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
                        backgroundColor: customColor,
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
                        <Button
                            size="sm"
                            className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-medium"
                            onClick={() => handleBookPlan(plan)}
                            style={{
                                backgroundColor: customColor,
                                borderColor: customColor,
                                color: "white",
                                fontSize: "0.8rem",
                                padding: "0.3rem 0.5rem",
                            }}
                        >
                            <FaBook size={12} /> Book Plan
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    return (
        <div className="bg-light min-vh-100">
            <Container fluid className="px-2 px-sm-3 px-md-5 py-3 py-md-4">
                <h1
                    className="mb-3 mb-md-4 fw-bold text-dark"
                    style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)" }}
                >
                    All Plans & Booking Management
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

                {/* Booking Modal */}
                <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Book Plan</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleBookingSubmit}>
                        <Modal.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {selectedPlan && (
                                <div className="mb-3">
                                    <h5>{selectedPlan.name}</h5>
                                    <p>
                                        {selectedPlan.sessions} Sessions, Validity: {selectedPlan.validity} Days
                                    </p>
                                    <p>Price: {selectedPlan.price}</p>
                                </div>
                            )}
                            <Form.Group className="mb-3">
                                <Form.Label>Payment Method</Form.Label>
                                <Form.Select
                                    value={bookingForm.paymentMethod}
                                    onChange={(e) =>
                                        setBookingForm({ ...bookingForm, paymentMethod: e.target.value })
                                    }
                                >
                                    <option value="upi">Offline UPI (Pay via QR)</option>
                                    <option value="cash">Cash (Pay at Gym)</option>
                                </Form.Select>
                            </Form.Group>
                            
                            {bookingForm.paymentMethod === "upi" && (
                                <div className="p-3 border rounded mb-3">
                                    <h6 className="fw-bold mb-2">Scan to Pay</h6>
                                    {settings?.upiQrCode && (
                                        <div className="text-center mb-3">
                                            <img src={settings.upiQrCode} alt="UPI QR Code" style={{ maxWidth: '200px', height: 'auto' }} />
                                        </div>
                                    )}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Transaction ID / UTR Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter UTR"
                                            value={bookingForm.transactionId}
                                            onChange={(e) =>
                                                setBookingForm({ ...bookingForm, transactionId: e.target.value })
                                            }
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-2">
                                        <Form.Label>Payment Screenshot (Optional)</Form.Label>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                setBookingForm({ ...bookingForm, paymentProofImage: e.target.files[0] })
                                            }
                                        />
                                    </Form.Group>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                style={{ backgroundColor: customColor, borderColor: customColor }}
                                disabled={loading}
                            >
                                {loading ? "Submitting..." : "Submit Booking"}
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </Container>
        </div>
    );
};

export default MemberAllPlans;