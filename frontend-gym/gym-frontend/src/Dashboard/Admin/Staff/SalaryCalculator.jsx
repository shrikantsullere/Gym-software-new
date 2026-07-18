// src/components/SalaryCalculator.js
import React, { useState, useEffect } from "react";
import { FaPlus, FaTrashAlt, FaEdit, FaEye } from "react-icons/fa";
import axiosInstance from "../../../Api/axiosInstance";
import BaseUrl from "../../../Api/BaseUrl";
import GetAdminId from "../../../Api/GetAdminId";

const SalaryCalculator = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState("add"); // 'add', 'edit', 'view'
  const [selectedSalary, setSelectedSalary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const adminId = GetAdminId();

  // Add state for form data
  const [formData, setFormData] = useState({
    salary_id: "",
    staff_id: "",
    payment_type: "Fixed",
    period_start: "",
    period_end: "",
    hours_worked: "",
    hourly_rate: "",
    hourly_total: "",
    fixed_salary: "",
    commission_total: "",
    bonuses: [],
    deductions: [],
    net_pay: "",
    status: "Generated",
    paid_at: "",
  });

  // State for bonus and deduction inputs
  const [bonusInput, setBonusInput] = useState({ label: "", amount: "" });
  const [deductionInput, setDeductionInput] = useState({
    label: "",
    amount: "",
  });
  const [overtimeInput, setOvertimeInput] = useState({
    duration: "",
    amount: "",
  });
  const [leaveInput, setLeaveInput] = useState({
    absentDays: "",
    totalDaysInMonth: "30",
  });

  // Sample data — in real app, fetch from API
  const [staffList, setStaffList] = useState([]);
  const [salaries, setSalaries] = useState([]);

  // Fetch staff data on component mount
  // Fetch staff data on component mount
  useEffect(() => {
    const fetchData = async () => {
      await fetchStaffList();
      await fetchSalaries();
    };
    fetchData();
  }, []);

  const fetchStaffList = async () => {
    try {
      // Fixed API endpoint
      const response = await axiosInstance.get(
        `/staff/admin/${adminId}`
      );
      console.log("Staff API response:", response.data); // Debug log
      if (response.data.success) {
        // Transform API response to match component's expected format
        const transformedStaff = response.data.staff.map((staff) => ({
          id: staff.staffId,
          staff_id: staff.staffId,
          first_name: staff.fullName,
          last_name: "",
          role: getRoleName(staff.roleId),
          hourly_rate: staff.hourlyRate || 0,
          commission_rate_percent: staff.commissionRate || 0,
          fixed_salary: staff.fixedSalary || 0,
          email: staff.email,
          phone: staff.phone,
          branchId: staff.branchId,
        }));
        setStaffList(transformedStaff);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError("Failed to load staff data");
    }
  };

  // Helper function to get role name from roleId - Updated with all role IDs
  const getRoleName = (roleId) => {
    const roles = {
      1: "Admin",
      // 2: "Manager",
      3: "Trainer",
      4: "Receptionist",
      5: "Personal Trainer",
      6: "General Trainer",
      7: "Receptionist",
      8: "Housekeeping",
    };
    return roles[roleId] || "Unknown";
  };

  const fetchSalaries = async () => {
    try {
      // Fixed API endpoint
      const response = await axiosInstance.get(`/salaries/${adminId}`);
      console.log("Salaries API response:", response.data); // Debug log
      if (response.data.success) {
        // Transform API response to match component's expected format
        const transformedSalaries = response.data.data.map((salary) => {
          // Get staff information
          const staffInfo = getStaffInfo(salary.staffId);

          return {
            id: salary.id, // Add internal ID
            salary_id: salary.salaryId,
            staff_id: salary.staffId,
            role: salary.role,
            period_start: salary.periodStart,
            period_end: salary.periodEnd,
            hours_worked: salary.hoursWorked,
            hourly_rate: salary.hourlyRate,
            hourly_total: salary.hourlyTotal,
            fixed_salary: salary.fixedSalary,
            commission_total: salary.commissionTotal,
            bonuses: salary.bonuses ? JSON.parse(salary.bonuses) : [],
            deductions: salary.deductions ? JSON.parse(salary.deductions) : [],
            net_pay: salary.netPay,
            status: salary.status,
            paid_at: salary.paidAt,
            staff_name: staffInfo ? staffInfo.first_name : "Unknown",
            staff_email: staffInfo ? staffInfo.email : null,
            staff_phone: staffInfo ? staffInfo.phone : null,
          };
        });
        setSalaries(transformedSalaries);
      }
    } catch (err) {
      console.error("Error fetching salaries:", err);
      setError("Failed to load salary data");
    }
  };
  // ===== HANDLERS =====
  const handleAddNew = () => {
    setModalType("add");
    setSelectedSalary(null);
    // Reset form data for adding new salary
    setFormData({
      salary_id: getNextSalaryId(),
      staff_id: "",
      payment_type: "Fixed",
      period_start: "",
      period_end: "",
      hours_worked: "",
      hourly_rate: "",
      hourly_total: "",
      fixed_salary: "",
      commission_total: "",
      bonuses: [],
      deductions: [],
      net_pay: "",
      status: "Generated",
      paid_at: "",
    });
    setBonusInput({ label: "", amount: "" });
    setDeductionInput({ label: "", amount: "" });
    setOvertimeInput({ duration: "", amount: "" });
    setLeaveInput({ absentDays: "", totalDaysInMonth: "30" });
    setError(null);
    setIsModalOpen(true);
  };

  const handleView = (salary) => {
    setModalType("view");
    setSelectedSalary(salary);
    // Populate form with selected salary data
    setFormData({
      salary_id: salary.salary_id,
      staff_id: salary.staff_id,
      period_start: salary.period_start,
      period_end: salary.period_end,
      hours_worked: salary.hours_worked || "",
      hourly_rate: salary.hourly_rate || "",
      hourly_total: salary.hourly_total || "",
      fixed_salary: salary.fixed_salary || "",
      commission_total: salary.commission_total || "",
      bonuses: salary.bonuses || [],
      deductions: salary.deductions || [],
      net_pay: salary.net_pay,
      status: salary.status,
      paid_at: salary.paid_at
        ? new Date(salary.paid_at).toISOString().slice(0, 16)
        : "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (salary) => {
    setModalType("edit");
    setSelectedSalary(salary);
    // Populate form with selected salary data
    setFormData({
      salary_id: salary.salary_id,
      staff_id: salary.staff_id,
      period_start: salary.period_start,
      period_end: salary.period_end,
      hours_worked: salary.hours_worked || "",
      hourly_rate: salary.hourly_rate || "",
      hourly_total: salary.hourly_total || "",
      fixed_salary: salary.fixed_salary || "",
      commission_total: salary.commission_total || "",
      bonuses: salary.bonuses || [],
      deductions: salary.deductions || [],
      net_pay: salary.net_pay,
      status: salary.status,
      paid_at: salary.paid_at
        ? new Date(salary.paid_at).toISOString().slice(0, 16)
        : "",
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (salary) => {
    setSelectedSalary(salary);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSalary) {
      try {
        // Use internal ID for API call
        const internalId =
          selectedSalary.id || selectedSalary.salary_id.replace("SAL-", "");

        const response = await axiosInstance.delete(
          `/salaries/${internalId}` // Use internal ID in URL
        );
        if (response.data.success) {
          setSalaries((prev) =>
            prev.filter((s) => s.salary_id !== selectedSalary.salary_id)
          );
          alert(`Salary record ${selectedSalary.salary_id} deleted.`);
        } else {
          setError("Failed to delete salary record");
        }
      } catch (err) {
        console.error("Delete error:", err);
        setError("Failed to delete salary record");
      }
    }
    setIsDeleteModalOpen(false);
    setSelectedSalary(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSalary(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedSalary(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      let updatedData = { ...prev, [name]: value };

      if (name === "payment_type") {
        if (value === "Fixed") {
          updatedData.hours_worked = "";
          updatedData.hourly_total = "";
        } else if (value === "Hourly") {
          updatedData.fixed_salary = "";
        }
      }

      // Auto-calculate values when relevant fields change
      if (
        name === "hours_worked" ||
        name === "fixed_salary" ||
        name === "commission_total" ||
        name === "hourly_rate" ||
        name === "payment_type"
      ) {
        const staff = staffList.find((s) => s.id === parseInt(updatedData.staff_id));
        if (staff) {
          let hourlyTotal = updatedData.hourly_total;
          
          if (name === "hours_worked" || name === "hourly_rate" || name === "payment_type") {
            const hours = parseFloat(updatedData.hours_worked) || 0;
            const rate = parseFloat(updatedData.hourly_rate) || 0;
            hourlyTotal = updatedData.payment_type === "Fixed" ? 0 : hours * rate;
            updatedData.hourly_total = hourlyTotal;
          }

          const fixedSalary = updatedData.payment_type === "Hourly" ? 0 : (parseFloat(updatedData.fixed_salary) || 0);

          let commissionTotal = parseFloat(updatedData.commission_total) || 0;
          if (name === "commission_total") {
            commissionTotal = value === "" ? "" : parseFloat(value) || 0;
          } else if (name !== "commission_total" && value !== "") {
             // Only auto-calc if not manually modified
             commissionTotal = calculateCommissionTotal(
                hourlyTotal,
                fixedSalary,
                updatedData.staff_id
              );
          }

          const netPay = calculateNetPay(
            hourlyTotal,
            fixedSalary,
            parseFloat(commissionTotal) || 0,
            updatedData.bonuses,
            updatedData.deductions
          );

          updatedData.hourly_total = hourlyTotal;
          updatedData.commission_total = commissionTotal;
          updatedData.net_pay = netPay;
        }
      }
      return updatedData;
    });
  };

  // Handle staff selection change
  // Handle staff selection change
  const handleStaffChange = (e) => {
    const staffId = e.target.value;
    const staff = getStaffInfo(staffId);
    
    // Generate new unique salary ID when staff changes
    const newSalaryId = modalType === "add" ? `SAL-${staffId}-${Date.now()}` : formData.salary_id;
    const initialHourlyRate = staff?.hourly_rate || 0;

    setFormData((prev) => ({
      ...prev,
      staff_id: staffId,
      salary_id: newSalaryId,
      hourly_rate: initialHourlyRate,
    }));

    // Auto-calculate hourly total if hours are already entered
    if (formData.hours_worked) {
      const hourlyTotal = (parseFloat(formData.hours_worked) || 0) * initialHourlyRate;
      const commissionTotal = calculateCommissionTotal(
        hourlyTotal,
        parseFloat(formData.fixed_salary) || 0,
        staffId
      );
      const netPay = calculateNetPay(
        hourlyTotal,
        parseFloat(formData.fixed_salary) || 0,
        parseFloat(commissionTotal) || 0,
        formData.bonuses,
        formData.deductions
      );

      setFormData((prev) => ({
        ...prev,
        salary_id: newSalaryId,
        hourly_rate: initialHourlyRate,
        hourly_total: hourlyTotal,
        commission_total: commissionTotal,
        net_pay: netPay,
      }));
    }
  };

  // Handle adding a bonus
  const handleAddBonus = () => {
    if (bonusInput.label && bonusInput.amount) {
      const newBonus = {
        label: bonusInput.label,
        amount: parseFloat(bonusInput.amount),
      };

      const updatedBonuses = [...formData.bonuses, newBonus];

      setFormData((prev) => ({
        ...prev,
        bonuses: updatedBonuses,
      }));

      // Recalculate net pay
      const netPay = calculateNetPay(
        parseFloat(formData.hourly_total) || 0,
        parseFloat(formData.fixed_salary) || 0,
        parseFloat(formData.commission_total) || 0,
        updatedBonuses,
        formData.deductions
      );

      setFormData((prev) => ({
        ...prev,
        net_pay: netPay,
      }));

      // Reset bonus input
      setBonusInput({ label: "", amount: "" });
    }
  };

  // Handle removing a bonus
  const handleRemoveBonus = (index) => {
    const updatedBonuses = formData.bonuses.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      bonuses: updatedBonuses,
    }));

    // Recalculate net pay
    const netPay = calculateNetPay(
      parseFloat(formData.hourly_total) || 0,
      parseFloat(formData.fixed_salary) || 0,
      parseFloat(formData.commission_total) || 0,
      updatedBonuses,
      formData.deductions
    );

    setFormData((prev) => ({
      ...prev,
      net_pay: netPay,
    }));
  };

  // Handle adding a deduction
  const handleAddDeduction = () => {
    if (deductionInput.label && deductionInput.amount) {
      const newDeduction = {
        label: deductionInput.label,
        amount: parseFloat(deductionInput.amount),
      };

      const updatedDeductions = [...formData.deductions, newDeduction];

      setFormData((prev) => ({
        ...prev,
        deductions: updatedDeductions,
      }));

      // Recalculate net pay
      const netPay = calculateNetPay(
        parseFloat(formData.hourly_total) || 0,
        parseFloat(formData.fixed_salary) || 0,
        parseFloat(formData.commission_total) || 0,
        formData.bonuses,
        updatedDeductions
      );

      setFormData((prev) => ({
        ...prev,
        net_pay: netPay,
      }));

      // Reset deduction input
      setDeductionInput({ label: "", amount: "" });
    }
  };

  // Handle removing a deduction
  const handleRemoveDeduction = (index) => {
    const updatedDeductions = formData.deductions.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      deductions: updatedDeductions,
    }));

    // Recalculate net pay
    const netPay = calculateNetPay(
      parseFloat(formData.hourly_total) || 0,
      parseFloat(formData.fixed_salary) || 0,
      parseFloat(formData.commission_total) || 0,
      formData.bonuses,
      updatedDeductions
    );

    setFormData((prev) => ({
      ...prev,
      net_pay: netPay,
    }));
  };

  // Handle adding overtime
  const handleAddOvertime = () => {
    if (overtimeInput.duration && overtimeInput.amount) {
      const newBonus = {
        label: `Overtime (${overtimeInput.duration})`,
        amount: parseFloat(overtimeInput.amount),
      };

      const updatedBonuses = [...formData.bonuses, newBonus];

      setFormData((prev) => ({
        ...prev,
        bonuses: updatedBonuses,
      }));

      // Recalculate net pay
      const netPay = calculateNetPay(
        parseFloat(formData.payment_type === "Fixed" ? 0 : formData.hourly_total) || 0,
        parseFloat(formData.payment_type === "Hourly" ? 0 : formData.fixed_salary) || 0,
        parseFloat(formData.commission_total) || 0,
        updatedBonuses,
        formData.deductions
      );

      setFormData((prev) => ({
        ...prev,
        net_pay: netPay,
      }));

      // Reset overtime input
      setOvertimeInput({ duration: "", amount: "" });
    }
  };

  // Handle form submission with API integration
  const handleSubmit = async () => {
    if (modalType === "add") {
      try {
        setLoading(true);
        setError(null);

        // Get staff information to include role in payload
        const staffInfo = getStaffInfo(formData.staff_id);

        // Prepare payload matching API response format
        const payload = {
          salaryId: formData.salary_id,
          staffId: parseInt(formData.staff_id),
          role: staffInfo.role, // Added role field
          periodStart: formData.period_start,
          periodEnd: formData.period_end,
          hoursWorked: formData.hours_worked
            ? parseFloat(formData.hours_worked)
            : null,
          hourlyRate: formData.hourly_rate
            ? parseFloat(formData.hourly_rate)
            : 0,
          fixedSalary: formData.fixed_salary
            ? parseFloat(formData.fixed_salary)
            : null,
          commissionTotal: formData.commission_total
            ? parseFloat(formData.commission_total)
            : 0,
          bonuses: formData.bonuses,
          deductions: formData.deductions,
          status: formData.status,
        };

        // Call API to create salary
        const response = await axiosInstance.post(
          `/salaries/create`,
          payload
        );

        if (response.data.success) {
          const resData = response.data.data || {};
          // Add new salary to list with response data
          const newSalary = {
            id: resData.id,
            salary_id: resData.salaryId || formData.salary_id,
            staff_id: parseInt(formData.staff_id),
            role: staffInfo.role,
            period_start: formData.period_start,
            period_end: formData.period_end,
            hours_worked: formData.payment_type === "Fixed" ? null : (parseFloat(formData.hours_worked) || null),
            hourly_rate: formData.payment_type === "Fixed" ? 0 : (parseFloat(formData.hourly_rate) || 0),
            hourly_total: formData.hourly_total || 0,
            fixed_salary: formData.payment_type === "Hourly" ? null : (parseFloat(formData.fixed_salary) || null),
            commission_total: parseFloat(formData.commission_total) || 0,
            bonuses: formData.bonuses || [],
            deductions: formData.deductions || [],
            net_pay: formData.net_pay,
            status: formData.status,
            paid_at: null,
            staff_name: staffInfo ? staffInfo.first_name : "Unknown",
            staff_email: staffInfo ? staffInfo.email : null,
            staff_phone: staffInfo ? staffInfo.phone : null,
          };

          setSalaries((prev) => [...prev, newSalary]);
          closeModal();
          alert("Salary record added successfully!");
        } else {
          setError(response.data.message || "Failed to create salary record");
        }
      } catch (err) {
        console.error("Create error:", err);
        setError(
          err.response?.data?.message || "Failed to create salary record"
        );
      } finally {
        setLoading(false);
      }
    } else if (modalType === "edit") {
      try {
        setLoading(true);
        setError(null);

        // Get staff information to include role in payload
        const staffInfo = getStaffInfo(formData.staff_id);

        // Find salary record to get internal ID
        const salaryRecord = salaries.find(
          (s) => s.salary_id === formData.salary_id
        );
        const internalId = salaryRecord
          ? salaryRecord.id
          : formData.salary_id.replace("SAL-", "");

        // Prepare payload matching API response format
        const payload = {
          salaryId: formData.salary_id,
          staffId: parseInt(formData.staff_id),
          role: staffInfo.role, // Added role field
          periodStart: formData.period_start,
          periodEnd: formData.period_end,
          hoursWorked: formData.hours_worked
            ? parseFloat(formData.hours_worked)
            : null,
          hourlyRate: formData.hourly_rate
            ? parseFloat(formData.hourly_rate)
            : 0,
          fixedSalary: formData.fixed_salary
            ? parseFloat(formData.fixed_salary)
            : null,
          commissionTotal: formData.commission_total
            ? parseFloat(formData.commission_total)
            : 0,
          bonuses: formData.bonuses,
          deductions: formData.deductions,
          status: formData.status,
          paidAt: formData.paid_at
            ? new Date(formData.paid_at).toISOString()
            : null,
        };

        // Call API to update salary with internal ID
        const response = await axiosInstance.put(
          `/salaries/${internalId}`, // Use internal ID in URL
          payload
        );

        if (response.data.success) {
          const resData = response.data.data || {};
          // Update salary in list with response data
          const updatedSalary = {
            id: salaryRecord ? salaryRecord.id : internalId,
            salary_id: resData.salaryId || formData.salary_id,
            staff_id: parseInt(formData.staff_id),
            role: staffInfo.role,
            period_start: formData.period_start,
            period_end: formData.period_end,
            hours_worked: formData.payment_type === "Fixed" ? null : (parseFloat(formData.hours_worked) || null),
            hourly_rate: formData.payment_type === "Fixed" ? 0 : (parseFloat(formData.hourly_rate) || 0),
            hourly_total: formData.hourly_total || 0,
            fixed_salary: formData.payment_type === "Hourly" ? null : (parseFloat(formData.fixed_salary) || null),
            commission_total: parseFloat(formData.commission_total) || 0,
            bonuses: formData.bonuses || [],
            deductions: formData.deductions || [],
            net_pay: formData.net_pay,
            status: formData.status,
            paid_at: formData.paid_at || null,
            staff_name: staffInfo ? staffInfo.first_name : "Unknown",
            staff_email: staffInfo ? staffInfo.email : null,
            staff_phone: staffInfo ? staffInfo.phone : null,
          };

          setSalaries((prev) =>
            prev.map((s) =>
              s.salary_id === formData.salary_id ? updatedSalary : s
            )
          );
          closeModal();
          alert("Salary record updated successfully!");
        } else {
          setError(response.data.message || "Failed to update salary record");
        }
      } catch (err) {
        console.error("Update error:", err);
        setError(
          err.response?.data?.message || "Failed to update salary record"
        );
      } finally {
        setLoading(false);
      }
    }
  };
  // Prevent background scroll
  useEffect(() => {
    if (isModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen, isDeleteModalOpen]);

  // ===== UI HELPERS =====
  const getStatusBadge = (status) => {
    const badges = {
      Generated: "bg-warning-subtle text-warning-emphasis",
      Approved: "bg-info-subtle text-info-emphasis",
      Paid: "bg-success-subtle text-success-emphasis",
    };
    return (
      <span
        className={`badge rounded-pill ${
          badges[status] || "bg-secondary"
        } px-2 py-1`}
      >
        {status}
      </span>
    );
  };

  // Helper function to get staff information
  // Helper function to get staff information
  const getStaffInfo = (staffId) => {
    // Convert staffId to number if it's a string
    const id = typeof staffId === "string" ? parseInt(staffId) : staffId;
    return staffList.find((staff) => staff.id === id);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getNextSalaryId = () => {
    const prefix = "SAL";
    const maxId =
      salaries.length > 0
        ? Math.max(
            ...salaries.map(
              (s) => parseInt(s.salary_id.replace(prefix, "")) || 0
            )
          )
        : 0;
    return `${prefix}${String(maxId + 1).padStart(3, "0")}`;
  };

  // Auto-calculate hourly total based on hours and staff's hourly rate
  const calculateHourlyTotal = (hoursWorked, staffId) => {
    // Convert staffId to number if it's a string
    const id = typeof staffId === "string" ? parseInt(staffId) : staffId;
    const staff = staffList.find((s) => s.id === id);
    if (!hoursWorked || !staff?.hourly_rate) return 0;
    return hoursWorked * staff.hourly_rate;
  };

  // Auto-calculate commission total based on fixed/hourly earnings and commission rate
  const calculateCommissionTotal = (hourlyTotal, fixedSalary, staffId) => {
    // Convert staffId to number if it's a string
    const id = typeof staffId === "string" ? parseInt(staffId) : staffId;
    const staff = staffList.find((s) => s.id === id);
    if (!staff?.commission_rate_percent || staff.commission_rate_percent === 0)
      return 0;

    const baseAmount = (hourlyTotal || 0) + (fixedSalary || 0);
    return (baseAmount * staff.commission_rate_percent) / 100;
  };

  // Auto-calculate net pay
  const calculateNetPay = (
    hourlyTotal,
    fixedSalary,
    commissionTotal,
    bonuses,
    deductions
  ) => {
    const bonusSum = (bonuses || []).reduce(
      (sum, b) => sum + (b.amount || 0),
      0
    );
    const deductionSum = (deductions || []).reduce(
      (sum, d) => sum + (d.amount || 0),
      0
    );
    return (
      (hourlyTotal || 0) +
      (fixedSalary || 0) +
      commissionTotal +
      bonusSum -
      deductionSum
    );
  };

  // ===== JSX =====
  return (
    <div className="container-fluid p-2 p-md-4">
      {/* Header */}
      <div className="row mb-3 mb-md-4 align-items-center">
        <div className="col-12 col-lg-8">
          <h2 className="fw-bold fs-4 fs-md-3">Salary Calculator</h2>
          <p className="text-muted mb-0 fs-6">
            Calculate and manage staff salaries based on role (Fixed, Hourly,
            Commission).
          </p>
        </div>
        <div className="col-12 col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button
            className="btn w-100 w-md-auto"
            style={{
              backgroundColor: "#6EB2CC",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "0.9rem",
              fontWeight: "500",
              transition: "all 0.2s ease",
            }}
            onClick={handleAddNew}
          >
            <FaPlus size={14} className="me-2" /> Add Salary
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="row mb-3 mb-md-4 g-2 g-md-3">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="input-group">
            <span className="input-group-text bg-light border">
              <i className="fas fa-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border"
              placeholder="Search by staff name or ID..."
            />
          </div>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <select className="form-select form-select-sm">
            <option>All Status</option>
            <option>Generated</option>
            <option>Approved</option>
            <option>Paid</option>
          </select>
        </div>
        <div className="col-6 col-md-3 col-lg-2">
          <select className="form-select form-select-sm">
            <option>All Roles</option>
            {/* <option>Manager</option> */}
            <option>Trainer</option>
            <option>Receptionist</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="fw-semibold d-none d-md-table-cell">
                  SALARY ID
                </th>
                <th className="fw-semibold">STAFF</th>
                <th className="fw-semibold d-none d-lg-table-cell">ROLE</th>
                <th className="fw-semibold d-none d-md-table-cell">PERIOD</th>
                <th className="fw-semibold text-end">NET PAY</th>
                <th className="fw-semibold text-center d-none d-lg-table-cell">
                  STATUS
                </th>
                <th className="fw-semibold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((salary) => {
                const staff = getStaffInfo(salary.staff_id);
                return (
                  <tr key={salary.salaryId}>
                    <td className="d-none d-md-table-cell">
                      <strong>{salary.salary_id}</strong>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="ms-2">
                          <div className="fw-bold">
                            {staff ? staff.first_name : "Unknown Staff"}
                          </div>
                          <div className="text-muted small d-md-none">
                            {salary.role}
                          </div>
                          <div className="text-muted small d-md-none">
                            {salary.salary_id}
                          </div>
                          <div className="text-muted small d-md-none">
                            {formatDate(salary.period_start)} -{" "}
                            {formatDate(salary.period_end)}
                          </div>
                          <div className="d-lg-none mt-1">
                            {getStatusBadge(salary.status)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="d-none d-lg-table-cell">
                      <span className="badge bg-primary">{salary.role}</span>
                    </td>
                    <td className="d-none d-md-table-cell">
                      {formatDate(salary.period_start)}
                      <br />
                      <small className="text-muted">
                        to {formatDate(salary.period_end)}
                      </small>
                    </td>
                    <td className="text-end fw-bold">
                      {formatCurrency(salary.net_pay)}
                    </td>
                    <td className="text-center d-none d-lg-table-cell">
                      {getStatusBadge(salary.status)}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          title="View"
                          onClick={() => handleView(salary)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          title="Edit"
                          onClick={() => handleEdit(salary)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete"
                          onClick={() => handleDeleteClick(salary)}
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          // onClick={closeModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold fs-5">
                  {modalType === "add"
                    ? "Add New Salary "
                    : modalType === "edit"
                    ? "Edit Salary "
                    : "View Salary "}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body p-3 p-md-4">
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Warning for editing paid salary */}
                {modalType === "edit" && selectedSalary?.status === "Paid" && (
                  <div
                    className="alert alert-warning d-flex align-items-center mb-3"
                    role="alert"
                  >
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <div>
                      <strong>Warning:</strong> You are editing a salary record
                      that has already been marked as "Paid". This may affect
                      financial records and reporting.
                    </div>
                  </div>
                )}

                <form>
                  {/* SECTION 1: Staff & Period */}
                  <h6 className="fw-bold mb-3 fs-6">Staff & Period</h6>
                  <div className="row g-2 g-md-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Salary ID</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.salary_id}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Staff Member <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select form-select-sm"
                        name="staff_id"
                        value={formData.staff_id}
                        onChange={handleStaffChange}
                        disabled={modalType === "view"}
                        required
                      >
                        <option value="">Select Staff</option>
                        {staffList.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.first_name} {staff.last_name} ({staff.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Role</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={
                          formData.staff_id
                            ? getStaffInfo(formData.staff_id)?.role
                            : ""
                        }
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Period Start <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        name="period_start"
                        value={formData.period_start}
                        onChange={handleInputChange}
                        disabled={modalType === "view"}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Period End <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        name="period_end"
                        value={formData.period_end}
                        onChange={handleInputChange}
                        disabled={modalType === "view"}
                        required
                      />
                    </div>
                  </div>

                  {/* SECTION 2: Compensation Details */}
                  <h6 className="fw-bold mb-3 fs-6">Compensation Details</h6>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label small d-block">
                        Payment Type <span className="text-danger">*</span>
                      </label>
                      <div className="form-check form-check-inline mt-1">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment_type"
                          id="payFixed"
                          value="Fixed"
                          checked={formData.payment_type === "Fixed"}
                          onChange={handleInputChange}
                          disabled={modalType === "view"}
                        />
                        <label className="form-check-label small" htmlFor="payFixed">
                          Fixed Salary
                        </label>
                      </div>
                      <div className="form-check form-check-inline mt-1">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="payment_type"
                          id="payHourly"
                          value="Hourly"
                          checked={formData.payment_type === "Hourly"}
                          onChange={handleInputChange}
                          disabled={modalType === "view"}
                        />
                        <label className="form-check-label small" htmlFor="payHourly">
                          Hourly Pay
                        </label>
                      </div>
                    </div>

                    {formData.payment_type === "Fixed" && (
                      <div className="col-md-6">
                        <label className="form-label small">Days in Month</label>
                        <select 
                          className="form-select form-select-sm"
                          value={leaveInput.totalDaysInMonth}
                          onChange={(e) => setLeaveInput({...leaveInput, totalDaysInMonth: e.target.value})}
                          disabled={modalType === "view"}
                        >
                          <option value="30">30 Days</option>
                          <option value="31">31 Days</option>
                          <option value="26">26 Days (Excl. Sundays)</option>
                          <option value="28">28 Days</option>
                          <option value="29">29 Days</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="row g-2 g-md-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Hours Worked</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g., 160"
                        name="hours_worked"
                        value={formData.hours_worked}
                        onChange={handleInputChange}
                        disabled={modalType === "view" || formData.payment_type === "Fixed"}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Hourly Rate
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Hourly Rate"
                        name="hourly_rate"
                        value={formData.hourly_rate}
                        onChange={handleInputChange}
                        disabled={modalType === "view" || formData.payment_type === "Fixed"}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Hourly Total</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Auto-calculated"
                        readOnly
                        value={formData.hourly_total}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Fixed Salary</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g., 5000"
                        name="fixed_salary"
                        value={formData.fixed_salary}
                        onChange={handleInputChange}
                        disabled={modalType === "view" || formData.payment_type === "Hourly"}
                        min="0"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Commission Total
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="e.g., 1200"
                        name="commission_total"
                        value={formData.commission_total}
                        onChange={handleInputChange}
                        disabled={modalType === "view"}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* SECTION 3: Overtime & Bonuses */}
                  <h6 className="fw-bold mb-3 fs-6">Overtime & Extras</h6>
                  <div className="mb-3">
                    <div className="row g-2 mb-2">
                      <div className="col-12 col-md-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Extra Work (e.g. 5 Hrs, 2 Days)"
                          value={overtimeInput.duration}
                          onChange={(e) =>
                            setOvertimeInput({ ...overtimeInput, duration: e.target.value })
                          }
                          disabled={modalType === "view"}
                        />
                      </div>
                      <div className="col-12 col-md-5">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Overtime Amount"
                          value={overtimeInput.amount}
                          onChange={(e) =>
                            setOvertimeInput({ ...overtimeInput, amount: e.target.value })
                          }
                          disabled={modalType === "view"}
                          min="0"
                        />
                      </div>
                      <div className="col-12 col-md-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success w-100"
                          onClick={handleAddOvertime}
                          disabled={
                            modalType === "view" ||
                            !overtimeInput.duration ||
                            !overtimeInput.amount
                          }
                        >
                          <FaPlus /> OT
                        </button>
                      </div>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 fs-6">Bonuses</h6>
                  <div className="mb-3">
                    <div className="row g-2 mb-2">
                      <div className="col-12 col-md-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Bonus label (e.g., Performance Bonus)"
                          value={bonusInput.label}
                          onChange={(e) =>
                            setBonusInput({
                              ...bonusInput,
                              label: e.target.value,
                            })
                          }
                          disabled={modalType === "view"}
                        />
                      </div>
                      <div className="col-12 col-md-5">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Amount"
                          value={bonusInput.amount}
                          onChange={(e) =>
                            setBonusInput({
                              ...bonusInput,
                              amount: e.target.value,
                            })
                          }
                          disabled={modalType === "view"}
                          min="0"
                        />
                      </div>
                      <div className="col-12 col-md-2 d-flex align-items-center">
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm w-100"
                          onClick={handleAddBonus}
                          disabled={
                            modalType === "view" ||
                            !bonusInput.label ||
                            !bonusInput.amount
                          }
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="border rounded p-2 bg-light small">
                      {formData.bonuses?.length > 0 ? (
                        <ul className="mb-0 ps-3">
                          {formData.bonuses.map((bonus, i) => (
                            <li
                              key={i}
                              className="d-flex justify-content-between"
                            >
                              <span>{bonus.label}</span>
                              <div>
                                <span>{formatCurrency(bonus.amount)}</span>
                                {modalType !== "view" && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    onClick={() => handleRemoveBonus(i)}
                                  >
                                    <FaTrashAlt size={10} />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">No bonuses added</span>
                      )}
                    </div>
                  </div>

                  {/* AUTO LEAVE DEDUCTION (ONLY FOR FIXED SALARY) */}
                  {formData.payment_type === "Fixed" && (
                    <div className="mb-4 p-3 border rounded bg-light">
                      <h6 className="fw-bold mb-3 fs-6 text-danger">Auto Leave Deduction</h6>
                      <div className="row g-2 mb-2 align-items-end">
                        <div className="col-12 col-md-5">
                          <label className="form-label small">Absent Days (e.g. 0.5)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="e.g. 1.5"
                            step="0.5"
                            min="0"
                            value={leaveInput.absentDays}
                            onChange={(e) => setLeaveInput({...leaveInput, absentDays: e.target.value})}
                            disabled={modalType === "view"}
                          />
                        </div>
                        <div className="col-12 col-md-4">
                          <label className="form-label small">Calculated Deduction</label>
                          <input
                            type="text"
                            className="form-control form-control-sm text-danger fw-bold"
                            readOnly
                            value={
                              leaveInput.absentDays 
                              ? `₹${((parseFloat(formData.fixed_salary) / parseInt(leaveInput.totalDaysInMonth)) * parseFloat(leaveInput.absentDays)).toFixed(2)}`
                              : "₹0.00"
                            }
                          />
                        </div>
                        <div className="col-12 col-md-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-danger w-100"
                            onClick={() => {
                                if (leaveInput.absentDays) {
                                  const deductionAmount = (parseFloat(formData.fixed_salary) / parseInt(leaveInput.totalDaysInMonth)) * parseFloat(leaveInput.absentDays);
                                  const newDeduction = {
                                    label: `Leave Deduction (${leaveInput.absentDays} days)`,
                                    amount: parseFloat(deductionAmount.toFixed(2))
                                  };
                                  const updatedDeductions = [...formData.deductions, newDeduction];
                                  setFormData(prev => ({ ...prev, deductions: updatedDeductions }));
                                  
                                  const netPay = calculateNetPay(
                                    parseFloat(formData.payment_type === "Fixed" ? 0 : formData.hourly_total) || 0,
                                    parseFloat(formData.payment_type === "Hourly" ? 0 : formData.fixed_salary) || 0,
                                    parseFloat(formData.commission_total) || 0,
                                    formData.bonuses,
                                    updatedDeductions
                                  );
                                  setFormData(prev => ({ ...prev, net_pay: netPay }));
                                  setLeaveInput(prev => ({ ...prev, absentDays: "" }));
                                }
                            }}
                            disabled={modalType === "view" || !leaveInput.absentDays}
                          >
                            Deduct
                          </button>
                        </div>
                      </div>
                      {leaveInput.absentDays && (
                        <small className="text-muted d-block mt-1">
                          Per-day Salary: ₹{(parseFloat(formData.fixed_salary) / parseInt(leaveInput.totalDaysInMonth)).toFixed(0)}
                        </small>
                      )}
                    </div>
                  )}

                  {/* SECTION 4: Deductions */}
                  <h6 className="fw-bold mb-3 fs-6">Deductions</h6>
                  <div className="mb-3">
                    <div className="row g-2 mb-2">
                      <div className="col-12 col-md-5">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Deduction label (e.g., Tax)"
                          value={deductionInput.label}
                          onChange={(e) =>
                            setDeductionInput({
                              ...deductionInput,
                              label: e.target.value,
                            })
                          }
                          disabled={modalType === "view"}
                        />
                      </div>
                      <div className="col-12 col-md-5">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Amount"
                          value={deductionInput.amount}
                          onChange={(e) =>
                            setDeductionInput({
                              ...deductionInput,
                              amount: e.target.value,
                            })
                          }
                          disabled={modalType === "view"}
                          min="0"
                        />
                      </div>
                      <div className="col-12 col-md-2 d-flex align-items-center">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm w-100"
                          onClick={handleAddDeduction}
                          disabled={
                            modalType === "view" ||
                            !deductionInput.label ||
                            !deductionInput.amount
                          }
                        >
                          <FaPlus size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="border rounded p-2 bg-light small">
                      {formData.deductions?.length > 0 ? (
                        <ul className="mb-0 ps-3">
                          {formData.deductions.map((deduction, i) => (
                            <li
                              key={i}
                              className="d-flex justify-content-between"
                            >
                              <span>{deduction.label}</span>
                              <div>
                                <span>{formatCurrency(deduction.amount)}</span>
                                {modalType !== "view" && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-2"
                                    onClick={() => handleRemoveDeduction(i)}
                                  >
                                    <FaTrashAlt size={10} />
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">No deductions added</span>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5: Summary & Status */}
                  <h6 className="fw-bold mb-3 fs-6">Summary</h6>
                  <div className="row g-2 g-md-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small">
                        Net Pay (auto-calculated)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-sm fw-bold"
                        value={formData.net_pay}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small">Status</label>
                      <select
                        className="form-select form-select-sm"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        disabled={modalType === "view"}
                      >
                        <option value="Generated">Generated</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                    {formData.status === "Paid" && (
                      <div className="col-12">
                        <label className="form-label small">Paid At</label>
                        <input
                          type="datetime-local"
                          className="form-control form-control-sm"
                          name="paid_at"
                          value={formData.paid_at}
                          onChange={handleInputChange}
                          disabled={modalType === "view"}
                        />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3 py-2 btn-sm"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    {modalType !== "view" && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          backgroundColor: "#6EB2CC",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 16px",
                          fontWeight: "500",
                        }}
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading
                          ? "Processing..."
                          : modalType === "add"
                          ? "Generate Salary"
                          : "Update Record"}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div
          className="modal fade show"
          tabIndex="-1"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={closeDeleteModal}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold fs-5">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDeleteModal}
                ></button>
              </div>
              <div className="modal-body text-center py-3">
                <div className="display-6 text-danger mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h5 className="fs-6">Are you sure?</h5>
                <p className="text-muted small">
                  This will permanently delete salary record{" "}
                  <strong>{selectedSalary?.salary_id}</strong>.<br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-3">
                <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3 btn-sm"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger px-3 btn-sm"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculator;
