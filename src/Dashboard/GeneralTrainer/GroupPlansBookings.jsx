import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  Tab,
  Card,
  Table,
  Button,
  Modal,
  Badge,
  Form,
  Dropdown,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaEye,
  FaCalendar,
  FaClock,
  FaUsers,
  FaRupeeSign,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaExclamationCircle,
  FaTimesCircle,
  FaFilter,
} from "react-icons/fa";
import BaseUrl from "../../Api/BaseUrl";

const GroupPlansBookings = () => {
  const [selectedPlanTab, setSelectedPlanTab] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupPlans, setGroupPlans] = useState([]);
  const [planCustomers, setPlanCustomers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState(null);
  const [activeTab, setActiveTab] = useState("members"); // 'plans', 'members', or 'membership'

  // New state for membership plans
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState(null);
  
  // New state for plan details modal
  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [planDetailsLoading, setPlanDetailsLoading] = useState(false);

   const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  };

  const user = getUserFromStorage();
  const memberId = user?.id || null;
  const branchId = user?.branchId || null;
  const name = user?.fullName || null;
  const staffId = user?.staffId || null;
  const adminId = user?.adminId || null;

  // Fetch group plans from MemberPlan API (filtering for GROUP type)
  useEffect(() => {
    const fetchGroupPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BaseUrl}MemberPlan?adminId=${adminId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Filter only GROUP type plans and transform data to match component structure
          const groupTypePlans = data.plans
            .filter((plan) => plan.type === "GROUP")
            .map((plan) => ({
              id: plan.id,
              name: plan.name,
              sessions: plan.sessions,
              validity: plan.validityDays,
              price: plan.price.toString(),
              description: "Group training plan",
              totalMembers: 0, // Will be updated when members are fetched
              type: plan.type,
              trainerId: plan.trainerId,
              trainerType: plan.trainerType,
              status: plan.status,
            }));

          setGroupPlans(groupTypePlans);

          // Initialize empty customer arrays for each plan
          const initialCustomers = {};
          groupTypePlans.forEach((plan) => {
            initialCustomers[plan.id] = [];
          });
          setPlanCustomers(initialCustomers);
        } else {
          setError("Failed to fetch group plans data");
        }
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
        console.error("Error fetching group plans:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "plans") {
      fetchGroupPlans();
    }
  }, [adminId, activeTab]);

  // Fetch members data from API
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        // Updated API endpoint
        const response = await fetch(
          `${BaseUrl}members/admin/${adminId}/plan`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setMembers(data.members);
        } else {
          setMembersError("Failed to fetch members data");
        }
      } catch (err) {
        setMembersError(`Error fetching members: ${err.message}`);
        console.error("Error fetching members:", err);
      } finally {
        setMembersLoading(false);
      }
    };

    if (activeTab === "members") {
      fetchMembers();
    }
  }, [adminId, activeTab]);

  // Fetch membership plans data from API
  useEffect(() => {
    const fetchMembershipPlans = async () => {
      try {
        setMembershipLoading(true);
        const response = await fetch(
          `${BaseUrl}MemberPlan?adminId=${adminId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          // Filter only MEMBER type plans with trainer type "general" and transform data
          const memberPlansGeneral = data.plans
            .filter((plan) => plan.type === "MEMBER" && plan.trainerType === "general")
            .map((plan) => ({
              id: plan.id,
              name: plan.name,
              sessions: plan.sessions,
              validity: plan.validityDays,
              price: plan.price.toString(),
              type: plan.type,
              trainerId: plan.trainerId,
              trainerType: plan.trainerType,
              adminId: plan.adminId,
              branchId: plan.branchId,
              createdAt: plan.createdAt,
              updatedAt: plan.updatedAt,
              status: plan.status,
            }));

          setMembershipPlans(memberPlansGeneral);
        } else {
          setMembershipError("Failed to fetch membership plans data");
        }
      } catch (err) {
        setMembershipError(`Error fetching membership plans: ${err.message}`);
        console.error("Error fetching membership plans:", err);
      } finally {
        setMembershipLoading(false);
      }
    };

    if (activeTab === "membership") {
      fetchMembershipPlans();
    }
  }, [adminId, activeTab]);

  // Get customers for selected plan
  const getCustomersForPlan = (planId) => {
    let customers = planCustomers[planId] || [];

    // Apply date filter
    if (dateFilter) {
      customers = customers.filter((customer) => {
        const purchaseDate = new Date(customer.purchaseDate);
        const filterDate = new Date(dateFilter);
        return purchaseDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      customers = customers.filter((customer) => {
        const today = new Date();
        const expiryDate = new Date(customer.expiryDate);

        if (statusFilter === "active") {
          return customer.status === "Active" || customer.status === "ACTIVE";
        } else if (statusFilter === "inactive") {
          return customer.status === "Inactive" || customer.status === "INACTIVE";
        } else if (statusFilter === "expired") {
          return expiryDate < today;
        } else if (statusFilter === "completed") {
          return customer.sessionsRemaining === 0;
        }
        return true;
      });
    }

    return customers;
  };
  
  // Memoized filtered members for the "All Members" tab
  const filteredMembers = useMemo(() => {
    let filtered = [...members];

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter((member) => {
        const joinDate = new Date(member.membershipFrom || member.joinDate);
        const filterDate = new Date(dateFilter);
        return joinDate.toDateString() === filterDate.toDateString();
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((member) => {
        if (statusFilter === "active") {
          return member.status === "Active" || member.status === "ACTIVE";
        } else if (statusFilter === "inactive") {
          return member.status === "Inactive" || member.status === "INACTIVE";
        } else if (statusFilter === "expired") {
          const today = new Date();
          const expiryDate = new Date(member.membershipTo);
          return expiryDate < today;
        }
        return true;
      });
    }

    return filtered;
  }, [members, dateFilter, statusFilter]);


  // Handle view customer details
  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  // Handle view member details
// Handle view member details - UPDATED TO USE NEW API
const handleViewMember = async (member) => {
  try {
    // Show loading state
    setShowCustomerModal(true);
    setSelectedCustomer(null);
    
    // Fetch member details from the new API endpoint
    const response = await fetch(
      `${BaseUrl}members/detail/${member.id}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Transform member data to match customer structure for modal
      const transformedMember = {
        id: data.member.id,
        name: data.member.fullName,
        email: data.member.email,
        contact: data.member.phone,
        purchaseDate: data.member.membershipFrom,
        expiryDate: data.member.membershipTo,
        sessionsBooked: data.member.sessionDetails.attended || 0,
        sessionsRemaining: data.member.sessionDetails.remaining || 0,
        status: data.member.status || "Active",
        planName: data.member.planName || "Unknown",
        planDuration: `${data.member.validityDays} days`,
        planPrice: data.member.amountPaid || "0",
        paymentMode: data.member.paymentMode || "Unknown",
        amountPaid: data.member.amountPaid || "0",
        gender: data.member.gender || "Unknown",
        dateOfBirth: data.member.dateOfBirth || "Unknown",
        interestedIn: data.member.interestedIn || "Unknown",
        address: data.member.address || "Unknown",
        joinDate: data.member.joinDate,
        type: data.member.planType || "Unknown",
        trainerType: data.member.trainerType || "Not Assigned",
        planId: data.member.planId,
        profileImage: data.member.profileImage || "",
        totalSessions: data.member.totalSessions || 0,
        validityDays: data.member.validityDays || 0,
        sessionState: data.member.sessionDetails.sessionState || "Active",
        // Add a flag to indicate this is a member, not a plan
        isMember: true
      };

      setSelectedCustomer(transformedMember);
    } else {
      setError("Failed to fetch member details");
    }
  } catch (err) {
    setError(`Error fetching member details: ${err.message}`);
    console.error("Error fetching member details:", err);
  }
};

  // Handle view membership plan details - fetch members and show plan modal
  const handleViewMembershipPlan = async (plan) => {
    try {
      setPlanDetailsLoading(true);

      // Fetch membership-plan members for trainerType general
      const response = await fetch(
        `${BaseUrl}members/member-plan/general/${adminId}/admin/${plan.id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const planDetails = {
          id: data.data.plan.id,
          name: data.data.plan.name,
          sessions: data.data.plan.sessions,
          validity: data.data.plan.validityDays,
          price: data.data.plan.price,
          type: data.data.plan.type,
          trainerType: data.data.plan.trainerType,
          membersCount: data.data.Total_Members,
          activeMembersCount: data.data.statistics?.active || 0,
          expiredMembersCount: data.data.statistics?.expired || 0,
          completedMembersCount: data.data.statistics?.completed || 0,
          members: (data.data.members || []).map((member) => ({
            id: member.id,
            name: member.fullName,
            email: member.email,
            phone: member.phone,
            gender: member.gender,
            address: member.address,
            joinDate: member.joinDate,
            membershipFrom: member.membershipFrom,
            membershipTo: member.membershipTo,
            paymentMode: member.paymentMode,
            amountPaid: member.amountPaid,
            dateOfBirth: member.dateOfBirth,
            status: member.status,
            planId: member.planId,
            planName: member.planName,
            sessions: member.sessions,
            validityDays: member.validityDays,
            price: member.price,
            planType: member.planType,
          })),
        };

        // Update planCustomers for quick access in the UI
        setPlanCustomers((prev) => ({
          ...prev,
          [plan.id]: planDetails.members.map((member) => ({
            id: member.id,
            name: member.name,
            purchaseDate: member.membershipFrom,
            expiryDate: member.membershipTo,
            sessionsBooked: member.sessions || 0,
            sessionsRemaining: member.sessions || 0,
            contact: member.phone,
            email: member.email,
            status: member.status,
            planId: member.planId,
            planName: member.planName,
          })),
        }));

        setSelectedPlanDetails(planDetails);
        setShowPlanDetailsModal(true);
      } else {
        setMembershipError("Failed to fetch membership plan details");
      }
    } catch (err) {
      setMembershipError(`Error fetching membership plan details: ${err.message}`);
      console.error("Error fetching membership plan details:", err);
    } finally {
      setPlanDetailsLoading(false);
    }
  };

  // Handle view plan details - UPDATED TO USE NEW API
  const handleViewPlanDetails = async (planId) => {
    try {
      setPlanDetailsLoading(true);
      
      // Fetch plan details from the new API endpoint
      const response = await fetch(
        `${BaseUrl}members/group-plan/${adminId}/admin/${planId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Create plan details object from the API response
        const planDetails = {
          id: data.data.plan.id,
          name: data.data.plan.name,
          sessions: data.data.plan.sessions,
          validity: data.data.plan.validityDays,
          price: data.data.plan.price,
          type: data.data.plan.type,
          membersCount: data.data.Total_Members,
          activeMembersCount: data.data.statistics.active,
          expiredMembersCount: data.data.statistics.expired,
          completedMembersCount: data.data.statistics.completed,
          members: (data.data.members || []).map((member) => ({
            id: member.id,
            name: member.fullName || member.name,
            email: member.email || '',
            phone: member.phone || '',
            gender: member.gender || '',
            address: member.address || '',
            joinDate: member.joinDate || '',
            membershipFrom: member.membershipFrom || '',
            membershipTo: member.membershipTo || '',
            paymentMode: member.paymentMode || '',
            amountPaid: member.amountPaid || '',
            dateOfBirth: member.dateOfBirth || '',
            status: member.status || 'Active',
            planId: member.planId || planId,
            planName: member.planName || data.data.plan.name,
            sessions: member.sessions || data.data.plan.sessions,
            validityDays: member.validityDays || data.data.plan.validityDays,
            price: member.price || data.data.plan.price,
            planType: member.planType || data.data.plan.type,
          }))
        };
        
        // Update the planCustomers state with the fetched members
        setPlanCustomers(prev => ({
          ...prev,
          [planId]: planDetails.members.map((member) => ({
            id: member.id,
            name: member.name,
            purchaseDate: member.membershipFrom,
            expiryDate: member.membershipTo,
            sessionsBooked: member.sessions || 0,
            sessionsRemaining: member.sessions || 0,
            contact: member.phone,
            email: member.email,
            status: member.status,
            planId: member.planId,
            planName: member.planName,
          }))
        }));
        
        setSelectedPlanDetails(planDetails);
        setShowPlanDetailsModal(true);
      } else {
        setError("Failed to fetch plan details");
      }
    } catch (err) {
      setError(`Error fetching plan details: ${err.message}`);
      console.error("Error fetching plan details:", err);
    } finally {
      setPlanDetailsLoading(false);
    }
  };

  // Get status indicator
const getStatusIndicator = (status, sessionsRemaining, expiryDate) => {
  // If status is explicitly provided, use it
  if (status) {
    const statusStr = status.toString().toLowerCase();
    if (statusStr === "active") {
      return (
        <Badge bg="success">
          <FaCheckCircle className="me-1" />
          Active
        </Badge>
      );
    } else if (statusStr === "inactive") {
      return (
        <Badge bg="danger">
          <FaExclamationCircle className="me-1" />
          Inactive
        </Badge>
      );
    } else if (statusStr === "expired") {
      return (
        <Badge bg="danger">
          <FaExclamationCircle className="me-1" />
          Expired
        </Badge>
      );
    } else if (statusStr === "completed") {
      return (
        <Badge bg="secondary">
          <FaTimesCircle className="me-1" />
          Completed
        </Badge>
      );
    }
  }

  // Otherwise, calculate status from sessions and expiry date
  const today = new Date();
  const expiry = new Date(expiryDate);

  if (sessionsRemaining === 0) {
    return (
      <Badge bg="secondary">
        <FaTimesCircle className="me-1" />
        Sessions Completed
      </Badge>
    );
  }

  if (expiry < today) {
    return (
      <Badge bg="danger">
        <FaExclamationCircle className="me-1" />
        Expired
      </Badge>
    );
  }

  return (
    <Badge bg="success">
      <FaCheckCircle className="me-1" />
      Active
    </Badge>
  );
};

  // Calculate session progress percentage
  const getProgressPercentage = (sessionsBooked, sessionsRemaining) => {
    const totalSessions = sessionsBooked + sessionsRemaining;
    return totalSessions > 0
      ? Math.round((sessionsBooked / totalSessions) * 100)
      : 0;
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
  };

  // Mobile customer card view
  const MobileCustomerCard = ({ customer, index }) => (
    <Card className="mb-3 border shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ width: "32px", height: "32px", fontSize: "14px" }}
            >
              {index + 1}
            </div>
            <h5 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>
              {customer.name}
            </h5>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleViewCustomer(customer)}
            style={{
              borderColor: "#2f6a87",
              color: "#2f6a87",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
            }}
          >
            <FaEye size={14} />
          </Button>
        </div>

        <div className="mb-2">
          {getStatusIndicator(
            customer.status,
            customer.sessionsRemaining,
            customer.expiryDate
          )}
        </div>

        <div className="row g-2">
          <div className="col-6">
            <small className="text-muted d-block">Purchase Date</small>
            <div className="d-flex align-items-center">
              <FaCalendar size={12} className="text-muted me-1" />
              <span className="small">{customer.purchaseDate}</span>
            </div>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Expiry Date</small>
            <div className="d-flex align-items-center">
              <FaCalendar size={12} className="text-muted me-1" />
              <span className="small">{customer.expiryDate}</span>
            </div>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Sessions Booked</small>
            <span
              className="badge bg-primary"
              style={{ backgroundColor: "#2f6a87" }}
            >
              {customer.sessionsBooked}
            </span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Sessions Remaining</small>
            <span className="badge bg-success">
              {customer.sessionsRemaining}
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  // Mobile member card view
const MobileMemberCard = ({ member, index }) => (
  <Card className="mb-3 border shadow-sm">
    <Card.Body className="p-3">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="d-flex align-items-center">
          <div
            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{ width: "32px", height: "32px", fontSize: "14px" }}
          >
            {index + 1}
          </div>
          <h5 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>
            {member.fullName}
          </h5>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => handleViewMember(member)}
          style={{
            borderColor: "#2f6a87",
            color: "#2f6a87",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
          }}
        >
          <FaEye size={14} />
        </Button>
      </div>

      <div className="mb-2">
        {getStatusIndicator(member.status)}
      </div>

      <div className="row g-2">
        <div className="col-6">
          <small className="text-muted d-block">Plan Type</small>
          <span className="small">{member.type || "Unknown"}</span>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">Trainer Type</small>
          <span className="small">{member.trainerType || "Not Assigned"}</span>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">Join Date</small>
          <div className="d-flex align-items-center">
            <FaCalendar size={12} className="text-muted me-1" />
            <span className="small">{member.membershipFrom || member.joinDate}</span>
          </div>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">Email</small>
          <span className="small text-truncate">{member.email}</span>
        </div>
      </div>
    </Card.Body>
  </Card>
);

  // Mobile membership plan card view
  const MobileMembershipPlanCard = ({ plan, index }) => (
    <Card className="mb-3 border shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <div
              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ width: "32px", height: "32px", fontSize: "14px" }}
            >
              {index + 1}
            </div>
            <h5 className="mb-0 fw-bold" style={{ color: "#2f6a87" }}>
              {plan.name}
            </h5>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => handleViewMembershipPlan(plan)}
            style={{
              borderColor: "#2f6a87",
              color: "#2f6a87",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
            }}
          >
            <FaEye size={14} />
          </Button>
        </div>

        <div className="mb-2">{getStatusIndicator(plan.status)}</div>

        <div className="row g-2">
          <div className="col-6">
            <small className="text-muted d-block">Sessions</small>
            <span
              className="badge bg-primary"
              style={{ backgroundColor: "#2f6a87" }}
            >
              {plan.sessions}
            </span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Validity</small>
            <span className="badge bg-info">{plan.validity} days</span>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Price</small>
            <div className="d-flex align-items-center">
              <FaRupeeSign size={12} className="text-muted me-1" />
              <span>{plan.price}</span>
            </div>
          </div>
          <div className="col-6">
            <small className="text-muted d-block">Days Used/Left</small>
            <span className="badge bg-warning">
              {plan.daysUsed}/{plan.daysLeft}
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="bg-light min-vh-100">
      <Container fluid className="py-3 py-md-4 px-md-5 px-3">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <h1
            className="fw-bold mb-3 mb-md-0 text-center"
            style={{ color: "#2f6a87", fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}
          >
            Group Training Plans & Members
          </h1>
          <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
            <Form.Control
              type="date"
              size="sm"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: "150px" }}
            />
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                size="sm"
                id="status-filter-dropdown"
                className="w-100"
              >
                <FaFilter className="me-1" />
                {statusFilter === "all"
                  ? "All Status"
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setStatusFilter("all")}>
                  All Status
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("active")}>
                  Active
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("inactive")}>
                  Inactive
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setStatusFilter("expired")}>
                  Expired
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Nav variant="tabs" className="mb-4" style={{ borderColor: "#2f6a87" }}>
          <Nav.Item>
            <Nav.Link
              className="fs-6 px-4 py-3 fw-medium"
              style={{
                color: activeTab === "members" ? "#2f6a87" : "#6c757d",
                borderColor:
                  activeTab === "members" ? "#2f6a87" : "transparent",
                backgroundColor:
                  activeTab === "members" ? "#f8f9fa" : "transparent",
              }}
              onClick={() => setActiveTab("members")}
            >
              All Members
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className="fs-6 px-4 py-3 fw-medium"
              style={{
                color: activeTab === "plans" ? "#2f6a87" : "#6c757d",
                borderColor: activeTab === "plans" ? "#2f6a87" : "transparent",
                backgroundColor:
                  activeTab === "plans" ? "#f8f9fa" : "transparent",
              }}
              onClick={() => setActiveTab("plans")}
            >
              Group Plans
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              className="fs-6 px-4 py-3 fw-medium"
              style={{
                color: activeTab === "membership" ? "#2f6a87" : "#6c757d",
                borderColor:
                  activeTab === "membership" ? "#2f6a87" : "transparent",
                backgroundColor:
                  activeTab === "membership" ? "#f8f9fa" : "transparent",
              }}
              onClick={() => setActiveTab("membership")}
            >
              Membership Plans
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Loading State */}
        {loading && activeTab === "plans" && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ color: "#2f6a87" }}
            >
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}

        {/* Members Loading State */}
        {membersLoading && activeTab === "members" && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ color: "#2f6a87" }}
            >
              <span className="visually-hidden">Loading members...</span>
            </Spinner>
          </div>
        )}

        {/* Membership Loading State */}
        {membershipLoading && activeTab === "membership" && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner
              animation="border"
              role="status"
              style={{ color: "#2f6a87" }}
            >
              <span className="visually-hidden">Loading membership plans...</span>
            </Spinner>
          </div>
        )}

        {/* Error State */}
        {error && activeTab === "plans" && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Members Error State */}
        {membersError && activeTab === "members" && (
          <Alert variant="danger" className="mb-4">
            {membersError}
          </Alert>
        )}

        {/* Membership Error State */}
        {membershipError && activeTab === "membership" && (
          <Alert variant="danger" className="mb-4">
            {membershipError}
          </Alert>
        )}

        {/* Plans as Cards - Optimized Version */}
        {!loading && !error && activeTab === "plans" && (
          <div className="mb-5">
            <Row className="g-3 g-md-4">
              {groupPlans.map((plan) => (
                <Col xs={12} sm={6} lg={4} key={plan.id}>
                  <Card
                    className="h-100 shadow-sm border-0 plan-card"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      cursor: "pointer",
                      border:
                        selectedPlanTab === plan.id
                          ? "2px solid #2f6a87"
                          : "1px solid #e9ecef",
                    }}
                    onClick={() => {
                      setSelectedPlanTab(plan.id);
                      // Fetch members for this plan when clicked
                      handleViewPlanDetails(plan.id);
                    }}
                  >
                    <div
                      style={{
                        height: "8px",
                        backgroundColor: "#2f6a87",
                        width: "100%",
                      }}
                    ></div>
                    <Card.Body className="d-flex flex-column p-3">
                      <div className="text-center mb-3">
                        <div
                          className="badge mb-2 px-3 py-1"
                          style={{
                            backgroundColor: "#2f6a87",
                            color: "white",
                            fontSize: "0.75rem",
                            borderRadius: "50px",
                          }}
                        >
                          GROUP CLASS
                        </div>
                        <h5
                          className="fw-bold mb-1"
                          style={{ color: "#2f6a87", fontSize: "1.1rem" }}
                        >
                          {plan.name}
                        </h5>
                        <p className="text-muted small mb-2">
                          {plan.description}
                        </p>
                      </div>
                      <ul className="list-unstyled mb-3 flex-grow-1">
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div
                            className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <FaClock size={12} className="text-muted" />
                          </div>
                          <div>
                            <div
                              className="fw-medium"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {plan.sessions} Sessions
                            </div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div
                            className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <FaCalendar size={12} className="text-muted" />
                          </div>
                          <div>
                            <div
                              className="fw-medium"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {plan.validity} Days
                            </div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div
                            className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <FaUsers size={12} className="text-muted" />
                          </div>
                          <div>
                            <div
                              className="fw-medium"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {getCustomersForPlan(plan.id).length} Member
                              {getCustomersForPlan(plan.id).length !== 1
                                ? "s"
                                : ""}
                            </div>
                          </div>
                        </li>
                        <li className="mb-2 d-flex align-items-center gap-2">
                          <div
                            className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <FaRupeeSign size={12} className="text-muted" />
                          </div>
                          <div>
                            <div
                              className="fw-medium"
                              style={{ fontSize: "0.9rem" }}
                            >
                              {plan.price}
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="text-center mt-auto">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPlanDetails(plan.id);
                          }}
                          style={{
                            borderColor: "#2f6a87",
                            color: "#2f6a87",
                            transition: "all 0.2s ease",
                          }}
                          className="w-100"
                        >
                          View Plan Details
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Membership Plans as Cards */}
        {!membershipLoading &&
          !membershipError &&
          activeTab === "membership" && (
            <div className="mb-5">
              <Row className="g-3 g-md-4">
                {membershipPlans.map((plan) => (
                  <Col xs={12} sm={6} lg={4} key={plan.id}>
                    <Card
                      className="h-100 shadow-sm border-0 plan-card"
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          height: "8px",
                          backgroundColor: "#2f6a87",
                          width: "100%",
                        }}
                      ></div>
                      <Card.Body className="d-flex flex-column p-3">
                        <div className="text-center mb-3">
                          <div
                            className="badge mb-2 px-3 py-1"
                            style={{
                              backgroundColor: "#2f6a87",
                              color: "white",
                              fontSize: "0.75rem",
                              borderRadius: "50px",
                            }}
                          >
                            GENERAL PLAN
                          </div>
                          <h5
                            className="fw-bold mb-1"
                            style={{ color: "#2f6a87", fontSize: "1.1rem" }}
                          >
                            {plan.name}
                          </h5>
                        </div>
                        <ul className="list-unstyled mb-3 flex-grow-1">
                          <li className="mb-2 d-flex align-items-center gap-2">
                            <div
                              className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaClock size={12} className="text-muted" />
                            </div>
                            <div>
                              <div
                                className="fw-medium"
                                style={{ fontSize: "0.9rem" }}
                              >
                                {plan.sessions} Sessions
                              </div>
                            </div>
                          </li>
                          <li className="mb-2 d-flex align-items-center gap-2">
                            <div
                              className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaCalendar size={12} className="text-muted" />
                            </div>
                            <div>
                              <div
                                className="fw-medium"
                                style={{ fontSize: "0.9rem" }}
                              >
                                {plan.validity} Days
                              </div>
                            </div>
                          </li>
                          <li className="mb-2 d-flex align-items-center gap-2">
                            <div
                              className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaRupeeSign size={12} className="text-muted" />
                            </div>
                            <div>
                              <div
                                className="fw-medium"
                                style={{ fontSize: "0.9rem" }}
                              >
                                {plan.price}
                              </div>
                            </div>
                          </li>
                          <li className="mb-2 d-flex align-items-center gap-2">
                            <div
                              className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaClock size={12} className="text-muted" />
                            </div>
                            <div>
                              <div
                                className="fw-medium"
                                style={{ fontSize: "0.9rem" }}
                              >
                                {plan.daysUsed} / {plan.daysLeft} Days Used/Left
                              </div>
                            </div>
                          </li>
                        </ul>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          {getStatusIndicator(plan.status)}
                        </div>
                        <div className="text-center mt-auto">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewMembershipPlan(plan)}
                            style={{
                              borderColor: "#2f6a87",
                              color: "#2f6a87",
                              transition: "all 0.2s ease",
                            }}
                            className="w-100"
                          >
                            View Details
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

        {/* Members Table - Desktop View */}
        {!membersLoading && !membersError && activeTab === "members" && (
          <Card
            className="border-0 shadow-sm mb-4"
            style={{ borderRadius: "16px" }}
          >
            <Card.Header className="bg-white border-0 pb-0">
              <Nav
                variant="tabs"
                className="border-bottom"
                style={{ borderColor: "#2f6a87" }}
              >
                <Nav.Item>
                  <Nav.Link
                    className="fs-6 px-4 py-3 fw-medium"
                    style={{
                      color: "#2f6a87",
                      borderColor: "#2f6a87",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    All Members ({filteredMembers.length})
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body>
              <div
                className="mb-4 p-3 bg-light rounded"
                style={{ borderLeft: "4px solid #2f6a87" }}
              >
                <h5 className="fw-bold mb-2" style={{ color: "#2f6a87" }}>
                  Members
                </h5>
                <div className="d-flex flex-wrap gap-3 gap-md-4 text-muted">
                  <div className="d-flex align-items-center gap-2">
                    <FaUsers size={16} />
                    <span>{filteredMembers.length} Total Members</span>
                  </div>
                  {dateFilter && (
                    <div className="d-flex align-items-center gap-2">
                      <FaCalendar size={16} />
                      <span>Filtered by date: {new Date(dateFilter).toLocaleDateString()}</span>
                    </div>
                  )}
                  {statusFilter !== "all" && (
                    <div className="d-flex align-items-center gap-2">
                      <FaFilter size={16} />
                      <span>Filtered by status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Members Table - Desktop View */}
              <div className="d-none d-md-block table-responsive">
                <Table hover responsive className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        #
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Member Name
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Email
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Phone
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Plan Type
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Trainer Type
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Join Date
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Status
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-5">
                          <div className="text-muted">No members found matching the current filters.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member, index) => (
                        <tr key={member.id}>
                          <td className="py-3 fw-bold">{index + 1}</td>
                          <td className="py-3">
                            <strong style={{ color: "#2f6a87" }}>
                              {member.fullName}
                            </strong>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <FaEnvelope size={14} className="text-muted" />
                              <span>{member.email}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <FaPhone size={14} className="text-muted" />
                              <span>{member.phone}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-info">
                              {member.type || "Unknown"}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-warning">
                              {member.trainerType || "Not Assigned"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <FaCalendar size={14} className="text-muted" />
                              <span>{member.membershipFrom || member.joinDate}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            {getStatusIndicator(member.status)}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewMember(member)}
                              style={{
                                borderColor: "#2f6a87",
                                color: "#2f6a87",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0",
                              }}
                            >
                              <FaEye size={16} />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="d-md-none">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="text-muted">No members found matching the current filters.</div>
                  </div>
                ) : (
                  filteredMembers.map((member, index) => (
                    <MobileMemberCard
                      key={member.id}
                      member={member}
                      index={index}
                    />
                  ))
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Customer Details Tabs */}
        {selectedPlanTab && !loading && !error && activeTab === "plans" && (
          <Card
            className="border-0 shadow-sm mb-4"
            style={{ borderRadius: "16px" }}
          >
            <Card.Header className="bg-white border-0 pb-0">
              <Nav
                variant="tabs"
                className="border-bottom"
                style={{ borderColor: "#2f6a87" }}
              >
                <Nav.Item>
                  <Nav.Link
                    className="fs-6 px-4 py-3 fw-medium"
                    style={{
                      color: "#2f6a87",
                      borderColor: "#2f6a87",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {groupPlans.find((p) => p.id === selectedPlanTab)?.name}{" "}
                    Members
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Header>

            <Card.Body>
              <div
                className="mb-4 p-3 bg-light rounded"
                style={{ borderLeft: "4px solid #2f6a87" }}
              >
                <h5 className="fw-bold mb-2" style={{ color: "#2f6a87" }}>
                  {groupPlans.find((p) => p.id === selectedPlanTab)?.name}
                </h5>
                <div className="d-flex flex-wrap gap-3 gap-md-4 text-muted">
                  <div className="d-flex align-items-center gap-2">
                    <FaClock size={16} />
                    <span>
                      {
                        groupPlans.find((p) => p.id === selectedPlanTab)
                          ?.sessions
                      }{" "}
                      Total Sessions
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FaCalendar size={16} />
                    <span>
                      {
                        groupPlans.find((p) => p.id === selectedPlanTab)
                          ?.validity
                      }{" "}
                      Days Validity
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FaUsers size={16} />
                    <span>
                      {getCustomersForPlan(selectedPlanTab).length} Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Members Table - Desktop View */}
              <div className="d-none d-md-block table-responsive">
                <Table hover responsive className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        #
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Member Name
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Purchase Date
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Expiry Date
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Sessions Booked
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Sessions Remaining
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Status
                      </th>
                      <th
                        className="py-3"
                        style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const customers = getCustomersForPlan(selectedPlanTab);

                      if (customers.length === 0) {
                        return (
                          <tr>
                            <td colSpan="8" className="text-center py-5">
                              <div className="text-muted">
                                No members found matching the current filters.
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return customers.map((customer, index) => (
                        <tr key={customer.id}>
                          <td className="py-3 fw-bold">{index + 1}</td>
                          <td className="py-3">
                            <strong style={{ color: "#2f6a87" }}>
                              {customer.name}
                            </strong>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <FaCalendar size={14} className="text-muted" />
                              <span>{customer.purchaseDate}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center gap-2">
                              <FaCalendar size={14} className="text-muted" />
                              <span>{customer.expiryDate}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className="badge bg-primary"
                              style={{
                                backgroundColor: "#2f6a87",
                                color: "white",
                              }}
                            >
                              {customer.sessionsBooked}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-success">
                              {customer.sessionsRemaining}
                            </span>
                          </td>
                          <td className="py-3">
                            {getStatusIndicator(
                              customer.status,
                              customer.sessionsRemaining,
                              customer.expiryDate
                            )}
                          </td>
                          <td className="py-3">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewCustomer(customer)}
                              style={{
                                borderColor: "#2f6a87",
                                color: "#2f6a87",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0",
                              }}
                            >
                              <FaEye size={16} />
                            </Button>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="d-md-none">
                {(() => {
                  const customers = getCustomersForPlan(selectedPlanTab);

                  if (customers.length === 0) {
                    return (
                      <div className="text-center py-5">
                        <div className="text-muted">
                          No members found matching the current filters.
                        </div>
                      </div>
                    );
                  }

                  return customers.map((customer, index) => (
                    <MobileCustomerCard
                      key={customer.id}
                      customer={customer}
                      index={index}
                    />
                  ));
                })()}
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Plan Details Modal - Updated to use new API */}
        {showPlanDetailsModal && (
          <Modal
            show={showPlanDetailsModal}
            onHide={() => setShowPlanDetailsModal(false)}
            centered
            size="lg"
            fullscreen="sm-down"
          >
            <Modal.Header
              closeButton
              style={{
                backgroundColor: "#f8f9fa",
                borderBottom: "1px solid #dee2e6",
              }}
            >
              <Modal.Title
                style={{ color: "#333", fontWeight: "600", fontSize: "1.2rem" }}
              >
                Plan Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3 p-md-4">
              {planDetailsLoading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <Spinner
                    animation="border"
                    role="status"
                    style={{ color: "#2f6a87" }}
                  >
                    <span className="visually-hidden">Loading plan details...</span>
                  </Spinner>
                </div>
              ) : selectedPlanDetails ? (
                <div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5
                        className="fw-bold mb-0"
                        style={{ color: "#2f6a87", fontSize: "1.3rem" }}
                      >
                        {selectedPlanDetails.name}
                      </h5>
                      <Badge bg="info" className="text-white">
                        {selectedPlanDetails.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-12 col-md-6 mb-3 mb-md-0">
                      <div className="mb-2">
                        <small className="text-muted d-block">Sessions</small>
                        <div className="d-flex align-items-center">
                          <FaClock size={14} className="text-muted me-2" />
                          <span>{selectedPlanDetails.sessions}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="mb-2">
                        <small className="text-muted d-block">Validity</small>
                        <div className="d-flex align-items-center">
                          <FaCalendar size={14} className="text-muted me-2" />
                          <span>{selectedPlanDetails.validity} Days</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 mb-3 mb-md-0">
                      <div className="mb-2">
                        <small className="text-muted d-block">Price</small>
                        <div className="d-flex align-items-center">
                          <FaRupeeSign size={14} className="text-muted me-2" />
                          <span>{selectedPlanDetails.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="mb-2">
                        <small className="text-muted d-block">Total Members</small>
                        <span>{selectedPlanDetails.membersCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <h6 className="fw-bold mb-3" style={{ color: "#2f6a87" }}>
                      Member Statistics
                    </h6>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="p-2 p-md-3 bg-light rounded">
                          <div
                            className="fw-bold"
                            style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                          >
                            {selectedPlanDetails.activeMembersCount}
                          </div>
                          <small className="text-muted">Active Members</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 p-md-3 bg-light rounded">
                          <div
                            className="fw-bold"
                            style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                          >
                            {selectedPlanDetails.expiredMembersCount}
                          </div>
                          <small className="text-muted">Expired Members</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 p-md-3 bg-light rounded">
                          <div
                            className="fw-bold"
                            style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                          >
                            {selectedPlanDetails.completedMembersCount}
                          </div>
                          <small className="text-muted">Completed Members</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <h6 className="fw-bold mb-3" style={{ color: "#2f6a87" }}>
                      Members List
                    </h6>
                    <div className="table-responsive">
                      <Table hover responsive className="align-middle mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              #
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Name
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Email
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Phone
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Join Date
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Membership Period
                            </th>
                            <th
                              className="py-3"
                              style={{ backgroundColor: "#f8f9fa", color: "#2f6a87" }}
                            >
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPlanDetails.members.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="text-center py-5">
                                <div className="text-muted">No members found for this plan.</div>
                              </td>
                            </tr>
                          ) : (
                            selectedPlanDetails.members.map((member, index) => (
                              <tr key={member.id}>
                                <td className="py-3 fw-bold">{index + 1}</td>
                                <td className="py-3">
                                  <strong style={{ color: "#2f6a87" }}>
                                    {member.name}
                                  </strong>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <FaEnvelope size={14} className="text-muted" />
                                    <span>{member.email}</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <FaPhone size={14} className="text-muted" />
                                    <span>{member.phone}</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <FaCalendar size={14} className="text-muted" />
                                    <span>{new Date(member.joinDate).toLocaleDateString()}</span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <div className="d-flex align-items-center gap-2">
                                    <FaCalendar size={14} className="text-muted" />
                                    <span>
                                      {new Date(member.membershipFrom).toLocaleDateString()} - {new Date(member.membershipTo).toLocaleDateString()}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3">
                                  {getStatusIndicator(member.status)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="text-muted">No plan details available.</div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #dee2e6" }}>
              <Button
                variant="secondary"
                onClick={() => setShowPlanDetailsModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}

{/* Member Details Modal - Updated to use new API */}
<Modal
  show={showCustomerModal}
  onHide={() => setShowCustomerModal(false)}
  centered
  size="lg"
  fullscreen="sm-down"
>
  <Modal.Header
    closeButton
    style={{
      backgroundColor: "#f8f9fa",
      borderBottom: "1px solid #dee2e6",
    }}
  >
    <Modal.Title
      style={{ color: "#333", fontWeight: "600", fontSize: "1.2rem" }}
    >
      {selectedCustomer?.isMember 
        ? "Member Details" 
        : selectedCustomer?.type
        ? "Membership Plan Details"
        : "Customer Details"}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-3 p-md-4">
    {selectedCustomer ? (
      <div>
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            {selectedCustomer.profileImage && (
              <img
                src={selectedCustomer.profileImage}
                alt={selectedCustomer.name}
                className="rounded-circle me-3"
                style={{ width: "80px", height: "80px", objectFit: "cover" }}
              />
            )}
            <div>
              <h5
                className="fw-bold mb-1"
                style={{ color: "#2f6a87", fontSize: "1.3rem" }}
              >
                {selectedCustomer.name}
              </h5>
              <div className="d-flex align-items-center">
                <span className="text-muted me-2">Status:</span>
                {getStatusIndicator(
                  selectedCustomer.status,
                  selectedCustomer.sessionsRemaining,
                  selectedCustomer.expiryDate
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <div className="mb-2">
              <small className="text-muted d-block">Email</small>
              <div className="d-flex align-items-center">
                <FaEnvelope size={14} className="text-muted me-2" />
                <span className="text-break">
                  {selectedCustomer.email}
                </span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="mb-2">
              <small className="text-muted d-block">Phone</small>
              <div className="d-flex align-items-center">
                <FaPhone size={14} className="text-muted me-2" />
                <span>{selectedCustomer.contact}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedCustomer.planName && (
          <div className="row mb-3">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <div className="mb-2">
                <small className="text-muted d-block">Plan</small>
                <span>{selectedCustomer.planName}</span>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="mb-2">
                <small className="text-muted d-block">Duration</small>
                <span>{selectedCustomer.planDuration}</span>
              </div>
            </div>
          </div>
        )}

        <div className="row mb-3">
          <div className="col-12 col-md-6 mb-3 mb-md-0">
            <div className="mb-2">
              <small className="text-muted d-block">
                Purchase Date
              </small>
              <div className="d-flex align-items-center">
                <FaCalendar size={14} className="text-muted me-2" />
                <span>
                  {selectedCustomer.purchaseDate
                    ? new Date(selectedCustomer.purchaseDate).toLocaleDateString()
                    : selectedCustomer.joinDate
                    ? new Date(selectedCustomer.joinDate).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="mb-2">
              <small className="text-muted d-block">Expiry Date</small>
              <div className="d-flex align-items-center">
                <FaCalendar size={14} className="text-muted me-2" />
                <span>
                  {selectedCustomer.expiryDate
                    ? new Date(selectedCustomer.expiryDate).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {selectedCustomer.paymentMode && (
          <div className="row mb-3">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <div className="mb-2">
                <small className="text-muted d-block">
                  Payment Mode
                </small>
                <span>{selectedCustomer.paymentMode}</span>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="mb-2">
                <small className="text-muted d-block">
                  Amount Paid
                </small>
                <span>₹{selectedCustomer.amountPaid}</span>
              </div>
            </div>
          </div>
        )}

        {selectedCustomer.type && (
          <div className="row mb-3">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <div className="mb-2">
                <small className="text-muted d-block">Plan Type</small>
                <span>{selectedCustomer.type}</span>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="mb-2">
                <small className="text-muted d-block">Trainer Type</small>
                <span>{selectedCustomer.trainerType || "Not Assigned"}</span>
              </div>
            </div>
          </div>
        )}

        {selectedCustomer.sessionsBooked !== undefined && (
          <div className="border-top pt-3">
            <h6 className="fw-bold mb-3" style={{ color: "#2f6a87" }}>
              Session Details
            </h6>
            <div className="row text-center">
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {selectedCustomer.sessionsBooked}
                  </div>
                  <small className="text-muted">Attended</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {selectedCustomer.sessionsRemaining}
                  </div>
                  <small className="text-muted">Remaining</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {selectedCustomer.sessionsBooked +
                      selectedCustomer.sessionsRemaining}
                  </div>
                  <small className="text-muted">Total</small>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1">
                <small>
                  Progress:{" "}
                  {getProgressPercentage(
                    selectedCustomer.sessionsBooked,
                    selectedCustomer.sessionsRemaining
                  )}
                  %
                </small>
                <small>
                  {selectedCustomer.sessionsBooked}/
                  {selectedCustomer.sessionsBooked +
                    selectedCustomer.sessionsRemaining}
                </small>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${getProgressPercentage(
                      selectedCustomer.sessionsBooked,
                      selectedCustomer.sessionsRemaining
                    )}%`,
                    backgroundColor: "#2f6a87",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {selectedCustomer.daysUsed !== undefined && (
          <div className="border-top pt-3">
            <h6 className="fw-bold mb-3" style={{ color: "#2f6a87" }}>
              Plan Usage Details
            </h6>
            <div className="row text-center">
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {selectedCustomer.daysUsed}
                  </div>
                  <small className="text-muted">Days Used</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {selectedCustomer.daysLeft}
                  </div>
                  <small className="text-muted">Days Left</small>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 p-md-3 bg-light rounded">
                  <div
                    className="fw-bold"
                    style={{ color: "#2f6a87", fontSize: "1.2rem" }}
                  >
                    {parseInt(selectedCustomer.daysUsed) +
                      parseInt(selectedCustomer.daysLeft)}
                  </div>
                  <small className="text-muted">Total Days</small>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="d-flex justify-content-between mb-1">
                <small>
                  Progress:{" "}
                  {Math.round(
                    (parseInt(selectedCustomer.daysUsed) /
                      (parseInt(selectedCustomer.daysUsed) +
                        parseInt(selectedCustomer.daysLeft))) *
                        100
                  )}
                  %
                </small>
                <small>
                  {selectedCustomer.daysUsed}/
                  {parseInt(selectedCustomer.daysUsed) +
                    parseInt(selectedCustomer.daysLeft)}
                </small>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${Math.round(
                      (parseInt(selectedCustomer.daysUsed) /
                        (parseInt(selectedCustomer.daysUsed) +
                          parseInt(selectedCustomer.daysLeft))) *
                        100
                    )}%`,
                    backgroundColor: "#2f6a87",
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="d-flex justify-content-center align-items-center py-5">
        <Spinner
          animation="border"
          role="status"
          style={{ color: "#2f6a87" }}
        >
          <span className="visually-hidden">Loading member details...</span>
        </Spinner>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer style={{ borderTop: "1px solid #dee2e6" }}>
    <Button
      variant="secondary"
      onClick={() => setShowCustomerModal(false)}
    >
      Close
    </Button>
  </Modal.Footer>
</Modal>
      </Container>
    </div>
  );
};

export default GroupPlansBookings;