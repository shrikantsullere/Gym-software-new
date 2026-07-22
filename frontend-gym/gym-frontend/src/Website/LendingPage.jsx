import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from "react-router-dom";
import {
  FaDumbbell, FaUsers, FaChartLine, FaCalendarAlt, FaCreditCard, FaMobileAlt,
  FaStar, FaQuoteLeft, FaQuoteRight, FaFacebook, FaTwitter, FaInstagram, FaYoutube,
  FaArrowRight, FaPlay, FaMedal, FaTrophy, FaFire, FaHeartbeat, FaRunning, FaCrown, FaCheck
} from 'react-icons/fa';
import { FiChevronDown, FiCheck as FiCheckIcon, FiArrowRight as FiArrowRightIcon } from 'react-icons/fi';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import './LendingPage.css';
import BaseUrl from '../Api/BaseUrl';
import Logo from "../assets/Logo/Logo1.png";
import Snowfall from "react-snowfall";
import testimonialRahul from "../assets/testimonials/rahul.png";
import testimonialPriya from "../assets/testimonials/priya.png";
import testimonialVikram from "../assets/testimonials/vikram.png";

const LendingPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Professional');
  const heroRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [plans, setPlans] = useState([]);
  const [lastPurchase, setLastPurchase] = useState(null);
  const [automationSettings, setAutomationSettings] = useState({
    trialDurationDays: 7,
    gracePeriodDays: 3,
    quarterlyDiscount: 5,
    yearlyDiscount: 15
  });

  // SaaS Demo Lead capture modal state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoLeadSource, setDemoLeadSource] = useState('Schedule Demo');
  const [demoLeadPlan, setDemoLeadPlan] = useState('');
  const [demoForm, setDemoForm] = useState({ fullName: '', phone: '', email: '', gymName: '', city: '' });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  useEffect(() => {
    // Fetch plans from API 
    const fetchPlans = async () => {
      try {
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
        const response = await fetch(`${cleanUrl}/plans`);
        const data = await response.json();
        setPlans(data.plans || []);
      }
      catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    const fetchAutomationSettings = async () => {
      try {
        const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
        const response = await fetch(`${cleanUrl}/v1/automation/settings`);
        const data = await response.json();
        if (data.success && data.settings) {
          setAutomationSettings(data.settings);
        }
      } catch (error) {
        console.error("Error fetching automation settings:", error);
      }
    };

    fetchPlans();
    fetchAutomationSettings();
  }, []);
  const navigate = useNavigate();

  // Purchase modal form state
  const [purchaseFormData, setPurchaseFormData] = useState({
    selectedPlan: '7-Day Free Trial',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    billingDuration: 'Yearly',
    startDate: new Date().toISOString().split('T')[0],
    gstNumber: '',
    city: ''
  });

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);

  // Payment simulator states
  const [purchaseStep, setPurchaseStep] = useState('register'); // 'register' | 'payment' | 'processing' | 'success'
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('upi'); // 'upi' | 'card'
  const [purchaseUpiId, setPurchaseUpiId] = useState('');
  const [purchaseCardNumber, setPurchaseCardNumber] = useState('');
  const [purchaseCardExpiry, setPurchaseCardExpiry] = useState('');
  const [purchaseCardCvv, setPurchaseCardCvv] = useState('');
  const [purchaseTxnId, setPurchaseTxnId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handlePurchaseClick = (planName) => {
    setSelectedPlan(planName);
    setPurchaseFormData({
      ...purchaseFormData,
      selectedPlan: planName
    });
    setShowPurchaseModal(true);
  };

  // Open demo lead modal
  const handleScheduleDemoClick = () => {
    setDemoLeadSource('Schedule Demo');
    setDemoLeadPlan('');
    setDemoForm({ fullName: '', phone: '', email: '', gymName: '', city: '' });
    setDemoSuccess(false);
    setShowDemoModal(true);
  };

  // Submit demo lead to backend
  const handleDemoLeadSubmit = async (e) => {
    e.preventDefault();
    if (!demoForm.fullName.trim() || !demoForm.phone.trim()) {
      alert('Name and Phone are required.');
      return;
    }
    setDemoSubmitting(true);
    try {
      const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
      await fetch(`${cleanUrl}/leads/public/saas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...demoForm, source: demoLeadSource, interestedPlan: demoLeadPlan || undefined })
      });
      setDemoSuccess(true);
      // Also open WhatsApp
      window.open(`https://wa.me/918810638184?text=Hi%2C%20I%20want%20to%20schedule%20a%20demo.%20My%20name%20is%20${encodeURIComponent(demoForm.fullName)}.`, '_blank');
      setTimeout(() => { setShowDemoModal(false); setDemoSuccess(false); }, 2500);
    } catch (err) {
      alert('Something went wrong. Please try again.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handlePurchaseFormChange = (e) => {
    const { name, value } = e.target;
    setPurchaseFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlanSelectChange = (e) => {
    const selectedName = e.target.value;

    // Find plan details to retrieve duration
    const allPlans = plans.length > 0 ? plans : [
      { id: 'gold', name: 'Gold', duration: 'Yearly', price: 4998 },
      { id: 'basic', name: 'Basic', duration: 'Monthly', price: 8999 },
      { id: 'pro', name: 'Pro', duration: 'Yearly', price: 11999 }
    ];

    const selectedPlanObj = allPlans.find(p => p.name === selectedName);

    setPurchaseFormData(prev => ({
      ...prev,
      selectedPlan: selectedName,
      billingDuration: selectedPlanObj ? selectedPlanObj.duration : 'Monthly'
    }));
  };

  const calculateDiscountedPrice = (basePrice, planDuration, targetDuration, quarterlyDiscount = 5, yearlyDiscount = 15) => {
    let monthlyPrice = basePrice;
    if (planDuration === 'Yearly') {
      monthlyPrice = basePrice / 12;
    } else if (planDuration === 'Quarterly') {
      monthlyPrice = basePrice / 3;
    }

    if (targetDuration === 'Monthly') {
      return Math.round(monthlyPrice);
    } else if (targetDuration === 'Quarterly') {
      const total = monthlyPrice * 3;
      const discount = (total * quarterlyDiscount) / 100;
      return Math.round(total - discount);
    } else if (targetDuration === 'Yearly') {
      const total = monthlyPrice * 12;
      const discount = (total * yearlyDiscount) / 100;
      return Math.round(total - discount);
    }
    return Math.round(basePrice);
  };

  const getSelectedPlanPrice = () => {
    if (purchaseFormData.selectedPlan.toLowerCase().includes('trial')) {
      return 0;
    }
    const allPlans = plans.length > 0 ? plans : [
      { id: 'gold', name: 'Gold', duration: 'Yearly', price: 4998 },
      { id: 'basic', name: 'Basic', duration: 'Monthly', price: 8999 },
      { id: 'pro', name: 'Pro', duration: 'Yearly', price: 11999 }
    ];
    const matched = allPlans.find(p => p.name.toLowerCase() === purchaseFormData.selectedPlan.toLowerCase());
    if (!matched) return 0;

    return calculateDiscountedPrice(
      matched.price,
      matched.duration,
      purchaseFormData.billingDuration,
      automationSettings.quarterlyDiscount,
      automationSettings.yearlyDiscount
    );
  };

  // Simplified purchase handler with simulated payment gateway support
  const handlePurchaseSubmit = async (demoPaid = false, method = null, details = null) => {
    // 表单验证
    if (!purchaseFormData.companyName.trim() || !purchaseFormData.email.trim() || !purchaseFormData.phone.trim() || !purchaseFormData.password.trim() || !purchaseFormData.startDate || !purchaseFormData.city.trim()) {
      alert("Please fill all required fields, including City.");
      return;
    }

    // Set processing step if it is a paid demo payment
    if (demoPaid) {
      setPurchaseStep('processing');
    }

    try {
      // Create FormData to support profile image upload
      const formData = new FormData();
      formData.append("selectedPlan", purchaseFormData.selectedPlan);
      formData.append("companyName", purchaseFormData.companyName);
      formData.append("email", purchaseFormData.email);
      formData.append("phone", purchaseFormData.phone);
      formData.append("password", purchaseFormData.password);
      formData.append("billingDuration", purchaseFormData.billingDuration);
      formData.append("startDate", purchaseFormData.startDate);
      formData.append("gstNumber", purchaseFormData.gstNumber || "");
      formData.append("city", purchaseFormData.city);
      formData.append("amount", getSelectedPlanPrice());

      if (demoPaid) {
        formData.append("isDemoPaid", "true");
        formData.append("paymentMethod", method || "UPI");
        formData.append("paymentDetails", details || "");
      }

      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      // 发送API请求
      const cleanUrl = BaseUrl.endsWith('/') ? BaseUrl.slice(0, -1) : BaseUrl;
      const response = await fetch(`${cleanUrl}/purchases`, {
        method: 'POST',
        // Do NOT set Content-Type header so the browser sets it automatically with the boundary!
        body: formData
      });

      // 检查响应状态
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process purchase');
      }

      // 解析成功响应
      const resData = await response.json();

      // Submit lead details to SaaS Leads database as well
      try {
        await fetch(`${cleanUrl}/leads/public/saas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: purchaseFormData.companyName + ' Owner',
            phone: purchaseFormData.phone,
            email: purchaseFormData.email,
            gymName: purchaseFormData.companyName,
            city: purchaseFormData.city,
            source: demoPaid ? 'Complete Purchase' : 'Start Free Trial',
            interestedPlan: purchaseFormData.selectedPlan,
            notes: `GST Number: ${purchaseFormData.gstNumber || 'N/A'}`
          })
        });
      } catch (leadError) {
        console.error('Failed to log lead:', leadError);
      }

      // Capture generated transaction ID
      const finalTxnId = resData.data?.transactionId || `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(resData.data?.id || 0).padStart(4, '0')}`;
      setPurchaseTxnId(finalTxnId);

      // Transition to success screen
      setPurchaseStep('success');

      // Setup auto-close timer (4.5s)
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseStep('register');
        setPurchaseTxnId('');
        setPurchaseUpiId('');
        setPurchaseCardNumber('');
        setPurchaseCardExpiry('');
        setPurchaseCardCvv('');
      }, 4500);

      // 保存最后一次提交的数据，防止重置后模态框显示为空
      setLastPurchase({ ...purchaseFormData });

      // 重置表单数据
      setPurchaseFormData({
        selectedPlan: '7-Day Free Trial',
        companyName: '',
        email: '',
        phone: '',
        password: '',
        billingDuration: 'Yearly',
        startDate: new Date().toISOString().split('T')[0],
        gstNumber: '',
        city: ''
      });
      setProfileImageFile(null);
      setProfilePreview(null);

      // 可选：记录成功响应
      console.log('Purchase successful:', resData);

    } catch (error) {
      // 处理错误
      console.error('Purchase error:', error);
      alert(`Error: ${error.message}`);
      setPurchaseStep(demoPaid ? 'payment' : 'register');
    }
  };

  const features = [
    {
      icon: <FaUsers className="feature-icon" />,
      title: "Member Management",
      description: "Effortlessly manage member profiles, attendance, and membership plans.",
      color: "#FF6B6B",
      bg: "rgba(255, 107, 107, 0.1)"
    },
    {
      icon: <FaCalendarAlt className="feature-icon" />,
      title: "Class Scheduling",
      description: "Create and manage class schedules with easy booking and reminders.",
      color: "#4ECDC4",
      bg: "rgba(78, 205, 196, 0.1)"
    },
    {
      icon: <FaCreditCard className="feature-icon" />,
      title: "Payment Processing",
      description: "Secure payment processing with automated billing and invoicing.",
      color: "#FFD166",
      bg: "rgba(255, 209, 102, 0.1)"
    },
    {
      icon: <FaChartLine className="feature-icon" />,
      title: "Progress Tracking",
      description: "Track member progress with detailed analytics and reports.",
      color: "#6A0572",
      bg: "rgba(106, 5, 114, 0.1)"
    },
    {
      icon: <FaMobileAlt className="feature-icon" />,
      title: "Mobile App",
      description: "Full-featured mobile app for members and trainers on the go.",
      color: "#1A535C",
      bg: "rgba(26, 83, 92, 0.1)"
    },
    // {
    //   icon: <FaDumbbell className="feature-icon" />,
    //   title: "Equipment Management",
    //   description: "Monitor equipment usage, maintenance schedules, and availability.",
    //   color: "#FF9F1C",
    //   bg: "rgba(255, 159, 28, 0.1)"
    // }
  ];

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Gym Owner",
      content: "This system has transformed how we run our gym. Member retention has increased by 40% since implementation.",
      rating: 5,
      avatar: testimonialRahul
    },
    {
      name: "Priya Patel",
      role: "Fitness Manager",
      content: "The scheduling and reporting features save us hours each week. Our trainers love the mobile app!",
      rating: 5,
      avatar: testimonialPriya
    },
    {
      name: "Vikram Singh",
      role: "Gym Member",
      content: "Booking classes and tracking my progress has never been easier. The app is intuitive and powerful.",
      rating: 4,
      avatar: testimonialVikram
    }
  ];

  const benefits = [
    "Increase member retention by up to 40%",
    "Save 15+ hours per week on administrative tasks",
    "Improve staff efficiency and communication",
    "Boost revenue with automated billing and upselling",
    "Enhance member experience with self-service options",
    "Make data-driven decisions with detailed analytics"
  ];

  const stats = [
    { value: "500+", label: "Happy Gyms", icon: <FaCrown /> },
    { value: "50K+", label: "Active Members", icon: <FaUsers /> },
    { value: "99.9%", label: "Uptime", icon: <FaChartLine /> },
    { value: "24/7", label: "Support", icon: <FaHeartbeat /> }
  ];

  // Convert plan duration to readable period
  const getPeriodText = (durationDays) => {
    if (!durationDays) return "per plan";
    const days = parseInt(durationDays);
    if (days === 365) return "per year";
    if (days === 30) return "per month";
    if (days === 7) return "per week";
    return `per ${days} days`;
  };

  // Render pricing cards
  const renderPricingCards = () => {
    // Mark middle plan as popular
    const midIndex = Math.floor(plans.length / 2);

    return plans.map((plan, index) => {
      const isPopular = index === midIndex;
      const period = getPeriodText(plan.duration);

      return (
        <motion.div
          className={`pricing-card ${isPopular ? 'popular' : ''}`}
          key={plan.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.2 }}
          whileHover={{ y: -15 }}
        >
          {isPopular && <div className="popular-badge">Most Popular</div>}
          <div className="pricing-header">
            <h3>{plan.name}</h3>
            <div className="pricing-price">
              <span className="price">₹{plan.price.toLocaleString()}</span>
              <span className="period">{period}</span>
            </div>
          </div>
          <div className="pricing-features">
            <ul>
              <li>
                <FiCheckIcon className="check-icon" />
                {plan.description || "Full gym management access"}
              </li>
              <li>
                <FiCheckIcon className="check-icon" />
                Duration: {plan.duration} days
              </li>
            </ul>
          </div>
          <Button
            variant={isPopular ? "primary" : "outline-primary"}
            className="pricing-btn"
            onClick={() => handlePurchaseClick(plan.name)}
          >
            Get Started
          </Button>
        </motion.div>
      );
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3, delayChildren: 0.2 }
    }
  };

  const heroItemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const dashboardData = {
    members: {
      title: "Member Overview",
      stats: [
        { label: "Total Members", value: "245", change: "+12%" },
        { label: "Active Today", value: "68", change: "+5%" },
        { label: "New This Month", value: "24", change: "+8%" }
      ],
      chart: [65, 59, 80, 81, 56, 55, 70]
    },
    revenue: {
      title: "Revenue Analytics",
      stats: [
        { label: "Monthly Revenue", value: "₹2.4L", change: "+18%" },
        { label: "Avg. Revenue/Member", value: "₹980", change: "+3%" },
        { label: "Pending Payments", value: "₹24K", change: "-5%" }
      ],
      chart: [28, 48, 40, 59, 66, 77, 80]
    },
    classes: {
      title: "Class Performance",
      stats: [
        { label: "Classes Today", value: "18", change: "+2" },
        { label: "Avg. Attendance", value: "85%", change: "+4%" },
        { label: "Popular Class", value: "HIIT", change: "N/A" }
      ],
      chart: [45, 52, 38, 65, 59, 70, 75]
    }
  };

  return (
    <div className="landing-page">
      <Snowfall
        style={{ position: "absolute", width: "100%", height: "100%" }}
        radius={[1, 4]}
        speed={[1, 2]}
      />
      {/* Animated Background Elements */}
      <div className="bg-elements">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-element"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 150 + 50}px`,
              height: `${Math.random() * 150 + 50}px`,
              background: `rgba(110, 178, 204, ${Math.random() * 0.15 + 0.05})`,
              borderRadius: `${Math.random() > 0.5 ? '50%' : '10%'}`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              rotate: [0, Math.random() * 20 - 10],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">

          {/* LEFT — LOGO */}
          <div className=" nav-left">
            <motion.a
              className="navbar-brand"
              href="#"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={Logo}
                alt="Logo"
                className="nav-logo"
              />
            </motion.a>
          </div>

          {/* MOBILE TOGGLER */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={toggleMobileMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* CENTER — MENU */}
          {/* CENTER — MENU */}
          <div className={`collapse navbar-collapse ${mobileMenuOpen ? "show" : ""} nav-center`}>
            <ul className="navbar-nav mx-auto">
              {['Home', 'Features', 'Benefits', 'Testimonials', 'Pricing', 'Contact'].map((item) => (
                <motion.li
                  className="nav-item"
                  key={item}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <a className="nav-link" href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}>
                    {item}
                    <motion.div className="nav-underline" layoutId="navUnderline" />
                  </a>
                </motion.li>
              ))}

              {/* 🔥 MOBILE LOGIN BUTTON HERE */}
              <li className="nav-item d-lg-none mt-3">
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/login");
                  }}
                >
                  Login
                  <FiArrowRightIcon className="btn-icon" />
                </Button>
              </li>
            </ul>
          </div>


          {/* RIGHT — LOGIN BUTTON */}
          <div className=" d-none d-lg-block">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                variant="primary"
                className=" demo-btn"
                onClick={() => navigate("/login")}
              >
                Login
                <FiArrowRightIcon className="btn-icon" />
              </Button>
            </motion.div>
          </div>

        </div>
      </nav>



      {/* Hero Section */}
      <section id="home" className="hero-section" ref={heroRef}>
        <Container className="">
          <Row className="align-items-center ">
            <Col lg={6} className="mb-5 mb-lg-0">
              <div className="align-item-center px-4">
                <div className="hero-badge ">
                  <FaFire className="badge-icon me-2 " /> #1 Gym Management Software
                </div>
                <h1 className="hero-title px-4">
                  Transform Your <span className="highlight">Gym Business</span>
                </h1>
                <p className="hero-subtitle px-3">
                  The all-in-one solution for modern gyms and fitness centers. Streamline operations,
                  boost member engagement, and grow your business with our powerful management system.
                </p>
                <div className=" row row-cols-4 cols-sm-4 g-3">
                  {stats.map((stat, index) => (
                    <Col key={index}>
                      <div className="hero-stat text-center">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    </Col>
                  ))}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className=" h-100 d-flex align-items-center justify-content-center">
                <div className="hero-image-wrapper position-relative overflow-hidden rounded-4 shadow-lg">
                  <img
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
                    alt="Modern Gym"
                    className="hero-image img-fluid w-100"
                  />
                  <div className="hero-image-overlay position-absolute top-0 start-0 w-100 h-100"></div>
                </div>
              </div>
            </Col>
          </Row>
          <div className="scroll-indicator position-absolute bottom-0 start-50 translate-middle-x">
            <FiChevronDown className="fs-3" />
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section mt-0">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge">
              <FaMedal className="badge-icon" /> Powerful Features
            </div>
            <h2>Everything You Need to <span className="highlight">Manage Your Gym</span></h2>
            <p>Comprehensive tools designed specifically for fitness centers and gyms</p>
          </motion.div>
          <motion.div
            className="features-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                className="feature-card"
                key={index}
                variants={itemVariants}
                whileHover={{ y: -15 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <Card className="h-100">
                  <Card.Body className="d-flex flex-column">
                    <motion.div
                      className="feature-icon-container"
                      style={{
                        background: hoveredFeature === index ? feature.color : feature.bg,
                        color: hoveredFeature === index ? 'white' : feature.color
                      }}
                      animate={{ rotate: hoveredFeature === index ? 10 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <Card.Title>{feature.title}</Card.Title>
                    <Card.Text className="mt-auto">{feature.description}</Card.Text>
                    <motion.div
                      className="feature-arrow"
                      animate={{ x: hoveredFeature === index ? 5 : 0 }}
                    >
                      <FiArrowRightIcon />
                    </motion.div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="section-badge">
                  <FaTrophy className="badge-icon" /> Why Choose Us
                </div>
                <h2>Why <span className="highlight">FitManager Pro</span> Stands Out</h2>
                <p>Our gym management system is designed to help you save time, increase revenue, and provide an exceptional experience for your members.</p>
                <div className="benefits-list">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      className="benefit-item"
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ x: 10 }}
                    >
                      <FiCheckIcon className="check-icon" />
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>
                <Button className="mt-4 demo-btn" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  See All Benefits
                  <FiArrowRightIcon className="btn-icon" />
                </Button>
              </motion.div>
            </Col>
            <Col lg={6}>
              <motion.div
                className="benefits-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="stats-container">
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -10, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="stat-icon">
                      <FaTrophy />
                    </div>
                    <div className="stat-number">40%</div>
                    <div className="stat-label">Member Retention Increase</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -10, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="stat-icon">
                      <FaFire />
                    </div>
                    <div className="stat-number">15+</div>
                    <div className="stat-label">Hours Saved Weekly</div>
                  </motion.div>
                  <motion.div
                    className="stat-card"
                    whileHover={{ y: -10, scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="stat-icon">
                      <FaChartLine />
                    </div>
                    <div className="stat-number">99.9%</div>
                    <div className="stat-label">System Uptime</div>
                  </motion.div>
                </div>
                <motion.div
                  className="testimonial-preview"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="quote-icon">
                    <FaQuoteLeft />
                  </div>
                  <p>"This system has transformed how we run our gym. Member retention has increased by 40% since implementation."</p>
                  <div className="author">
                    <img src={testimonialRahul} alt="Author" className="author-avatar" />
                    <div className="author-info">
                      <div className="author-name">Rahul Sharma</div>
                      <div className="author-role">Gym Owner</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge">
              <FaStar className="badge-icon" /> Client Testimonials
            </div>
            <h2>What Our <span className="highlight">Clients Say</span></h2>
            <p>Join thousands of satisfied gym owners and managers</p>
          </motion.div>
          <div className="testimonials-container">
            {testimonials.map((testimonial, index) => (
              <motion.div
                className="testimonial-card"
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
              >
                <div className="testimonial-header">
                  <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar" />
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
                <div className="quote-icon">
                  <FaQuoteLeft />
                </div>
                <p className="testimonial-content">{testimonial.content}</p>
                <div className="rating">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={i < testimonial.rating ? "star filled" : "star"}
                    />
                  ))}
                </div>
                <div className="quote-icon right">
                  <FaQuoteRight />
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <Container>
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="section-badge">
              <FaCreditCard className="badge-icon" /> Simple Pricing
            </div>
            <h2>Choose Your <span className="highlight">Perfect Plan</span></h2>
            <p>Flexible pricing options for gyms of all sizes</p>
          </motion.div>
          <div className="pricing-container">
            {renderPricingCards()}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="cta-badge">Ready to get started?</div>
            <h2>Transform Your Gym <span className="highlight">Today</span></h2>
            <p>Join thousands of gym owners who have already streamlined their operations with FitManager Pro.</p>
            <div className="cta-buttons">
              <Button variant="light" size="lg" className="mr-3" onClick={() => handlePurchaseClick('7-Day Free Trial')}>
                Start Free Trial
                <FiArrowRightIcon className="btn-icon" />
              </Button>
              <Button variant="outline-light" size="lg" onClick={handleScheduleDemoClick}>
                Schedule a Demo
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <Container>
          <Row>
            <Col lg={4} md={6}>
              <div className="footer-brand">
                <div className="brand-container">
                  <div className="brand-icon-wrapper">
                    <FaDumbbell className="brand-icon" />
                  </div>
                  <span>FitManager Pro</span>
                </div>
                <p>The all-in-one gym management solution for modern fitness centers.</p>
                <div className="social-icons">
                  <a href="#"><FaFacebook /></a>
                  <a href="#"><FaTwitter /></a>
                  <a href="#"><FaInstagram /></a>
                  <a href="#"><FaYoutube /></a>
                </div>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h5>Product</h5>
                <ul>
                  <li><a href="#">Features</a></li>
                  <li><a href="#">Pricing</a></li>
                  <li><a href="#">Integrations</a></li>
                  <li><a href="#">Updates</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h5>Company</h5>
                <ul>
                  <li><a href="#">About Us</a></li>
                  <li><a href="#">Careers</a></li>
                  <li><a href="#">Blog</a></li>
                  <li><a href="#">Contact</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h5>Support</h5>
                <ul>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">Community</a></li>
                  <li><a href="#">Status</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h5>Legal</h5>
                <ul>
                  <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                  <li><Link to="/terms-of-service">Terms of Service</Link></li>
                  <li><a href="#">Cookie Policy</a></li>
                  <li><a href="#">Security</a></li>
                </ul>
              </div>
            </Col>
          </Row>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} FitManager Pro. All rights reserved.</p>
          </div>
        </Container>
      </footer>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none', overflow: 'hidden' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h2 className="modal-title fw-bold" style={{ color: '#1a202c', fontSize: '1.75rem' }}>
                  {purchaseStep === 'register' ? 'Complete Your Purchase' :
                    purchaseStep === 'payment' ? 'Speed Fitness Checkout' :
                      purchaseStep === 'processing' ? 'Processing Payment' : 'Payment Success!'}
                </h2>
                {purchaseStep !== 'processing' && purchaseStep !== 'success' && (
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowPurchaseModal(false);
                      setPurchaseStep('register');
                    }}
                    style={{ fontSize: '0.9rem' }}
                  ></button>
                )}
              </div>
              <div className="modal-body px-4 py-4">
                {purchaseStep === 'register' && (
                  <>
                    {/* Profile Image Section */}
                    <div className="d-flex flex-column align-items-center mb-4">
                      <div
                        style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '50%',
                          border: '2px dashed #cbd5e1',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f8fafc',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => document.getElementById('purchaseProfileInput').click()}
                      >
                        {profilePreview ? (
                          <img src={profilePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div className="text-center text-muted" style={{ fontSize: '11px' }}>
                            <div style={{ fontSize: '24px' }}>📷</div>
                            Upload Photo
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        id="purchaseProfileInput"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setProfileImageFile(file);
                            setProfilePreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <small className="text-muted mt-2">Upload Profile Photo (Optional)</small>
                    </div>

                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Selected Plan
                        </label>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value={purchaseFormData.selectedPlan}
                        readOnly
                        disabled
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          backgroundColor: '#f8fafc',
                          color: '#2d3748',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Gym Name
                        </label>
                      </div>
                      <input
                        type="text"
                        name="companyName"
                        className="form-control"
                        placeholder="Enter your gym name"
                        value={purchaseFormData.companyName}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Email Address
                        </label>
                      </div>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="your@email.com"
                        value={purchaseFormData.email}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Mobile Number
                        </label>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="Enter mobile number"
                        value={purchaseFormData.phone}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          City *
                        </label>
                      </div>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        placeholder="Enter your city"
                        value={purchaseFormData.city}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Choose Password
                        </label>
                      </div>
                      <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Choose a strong password"
                        value={purchaseFormData.password}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          GST Number (Optional)
                        </label>
                      </div>
                      <input
                        type="text"
                        name="gstNumber"
                        className="form-control"
                        placeholder="Enter your Gym's GST Number"
                        value={purchaseFormData.gstNumber}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          GST Rate (%)
                        </label>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value="18% (Fixed)"
                        readOnly
                        disabled
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          backgroundColor: '#f8fafc',
                          color: '#64748b',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label d-block mb-2" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                        Billing Duration
                      </label>
                      <div className="d-flex gap-4 flex-wrap">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="billingDuration"
                            id="monthly"
                            value="Monthly"
                            checked={purchaseFormData.billingDuration === 'Monthly'}
                            onChange={handlePurchaseFormChange}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              marginTop: '2px'
                            }}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="monthly"
                            style={{
                              fontSize: '0.95rem',
                              color: '#2d3748',
                              cursor: 'pointer',
                              fontWeight: '400'
                            }}
                          >
                            Monthly
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="billingDuration"
                            id="quarterly"
                            value="Quarterly"
                            checked={purchaseFormData.billingDuration === 'Quarterly'}
                            onChange={handlePurchaseFormChange}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              marginTop: '2px'
                            }}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="quarterly"
                            style={{
                              fontSize: '0.95rem',
                              color: '#2d3748',
                              cursor: 'pointer',
                              fontWeight: '400'
                            }}
                          >
                            Quarterly <span className="badge bg-primary text-white small ms-1" style={{ fontSize: '10px' }}>Save {automationSettings.quarterlyDiscount}%</span>
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="billingDuration"
                            id="yearly"
                            value="Yearly"
                            checked={purchaseFormData.billingDuration === 'Yearly'}
                            onChange={handlePurchaseFormChange}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              marginTop: '2px'
                            }}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor="yearly"
                            style={{
                              fontSize: '0.95rem',
                              color: '#2d3748',
                              cursor: 'pointer',
                              fontWeight: '400'
                            }}
                          >
                            Yearly <span className="badge bg-success text-white small ms-1" style={{ fontSize: '10px' }}>Save {automationSettings.yearlyDiscount}%</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <label className="form-label mb-0" style={{ color: '#2d3748', fontSize: '0.9rem', fontWeight: '600' }}>
                          Start Date
                        </label>
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        className="form-control"
                        value={purchaseFormData.startDate}
                        onChange={handlePurchaseFormChange}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.border = '1px solid #667eea';
                          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.border = '1px solid #e2e8f0',
                            e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Form Validation
                        if (!purchaseFormData.companyName.trim() || !purchaseFormData.email.trim() || !purchaseFormData.phone.trim() || !purchaseFormData.password.trim() || !purchaseFormData.startDate || !purchaseFormData.city.trim()) {
                          alert("Please fill all required fields, including City.");
                          return;
                        }

                        const isTrial = purchaseFormData.selectedPlan.toLowerCase().includes('trial');
                        if (isTrial) {
                          handlePurchaseSubmit(false); // Direct signup for trials
                        } else {
                          setPurchaseStep('payment'); // Open payment step for paid plans
                        }
                      }}
                      className="btn w-100 py-3 fw-semibold mt-2"
                      style={{
                        backgroundColor: '#60a5fa',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(96, 165, 250, 0.25)'
                      }}
                    >
                      {purchaseFormData.selectedPlan.toLowerCase().includes('trial') ? 'Activate Free Trial' : 'Proceed to Payment'}
                    </button>
                  </>
                )}

                {/* Simulated Payment Step */}
                {purchaseStep === 'payment' && (
                  <div className="px-1">
                    <div className="bg-light rounded-3 p-3 mb-4 border" style={{ fontSize: '0.9rem' }}>
                      <h6 className="fw-bold text-dark mb-2">Order Summary</h6>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Plan Selected:</span>
                        <span className="fw-semibold text-dark">{purchaseFormData.selectedPlan}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Billing Cycle:</span>
                        <span className="fw-semibold text-dark">{purchaseFormData.billingDuration}</span>
                      </div>
                      <div className="d-flex justify-content-between border-top pt-2 mt-2" style={{ fontSize: '1.05rem' }}>
                        <span className="fw-bold text-dark">Amount to Pay:</span>
                        <span className="fw-bold text-primary">
                          ₹{(() => {
                            const matched = plans.find(p => p.name === purchaseFormData.selectedPlan);
                            if (matched) return matched.price.toLocaleString('en-IN');
                            if (purchaseFormData.selectedPlan.toLowerCase().includes('gold')) return '4,998';
                            if (purchaseFormData.selectedPlan.toLowerCase().includes('basic')) return '8,999';
                            if (purchaseFormData.selectedPlan.toLowerCase().includes('pro')) return '11,999';
                            return '0';
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label small fw-semibold text-muted mb-2 d-block">Choose Payment Option</label>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className={`btn flex-fill py-3 fw-bold rounded-3 ${purchasePaymentMethod === 'upi' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                          onClick={() => setPurchasePaymentMethod('upi')}
                          style={{ fontSize: '0.9rem' }}
                        >
                          📱 UPI (Paytm/GPay)
                        </button>
                        <button
                          type="button"
                          className={`btn flex-fill py-3 fw-bold rounded-3 ${purchasePaymentMethod === 'card' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                          onClick={() => setPurchasePaymentMethod('card')}
                          style={{ fontSize: '0.9rem' }}
                        >
                          💳 Card (Credit/Debit)
                        </button>
                      </div>
                    </div>

                    {purchasePaymentMethod === 'upi' ? (
                      <div className="mb-4">
                        <label className="form-label small fw-semibold text-muted">Enter UPI ID</label>
                        <input
                          type="text"
                          className="form-control border-1 p-2 rounded-3"
                          placeholder="username@upi"
                          value={purchaseUpiId}
                          onChange={(e) => setPurchaseUpiId(e.target.value)}
                          style={{ fontSize: '0.95rem' }}
                        />
                        <small className="text-muted mt-1 d-block" style={{ fontSize: '11px' }}>Example: gymowner@gpay</small>
                      </div>
                    ) : (
                      <div className="row g-2 mb-4">
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted mb-1">Card Number</label>
                          <input
                            type="text"
                            className="form-control border-1 p-2 rounded-3"
                            placeholder="4111 2222 3333 4444"
                            maxLength="19"
                            value={purchaseCardNumber}
                            onChange={(e) => setPurchaseCardNumber(e.target.value)}
                            style={{ fontSize: '0.95rem' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted mb-1">Expiry Date</label>
                          <input
                            type="text"
                            className="form-control border-1 p-2 rounded-3"
                            placeholder="MM/YY"
                            maxLength="5"
                            value={purchaseCardExpiry}
                            onChange={(e) => setPurchaseCardExpiry(e.target.value)}
                            style={{ fontSize: '0.95rem' }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold text-muted mb-1">CVV</label>
                          <input
                            type="password"
                            className="form-control border-1 p-2 rounded-3"
                            placeholder="123"
                            maxLength="3"
                            value={purchaseCardCvv}
                            onChange={(e) => setPurchaseCardCvv(e.target.value)}
                            style={{ fontSize: '0.95rem' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                      <button
                        type="button"
                        className="btn btn-light rounded-pill px-4"
                        onClick={() => setPurchaseStep('register')}
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        className="btn btn-success rounded-pill px-5 fw-bold"
                        onClick={() => {
                          if (purchasePaymentMethod === 'upi') {
                            if (!purchaseUpiId.trim()) {
                              alert("Please enter a valid UPI ID");
                              return;
                            }
                            handlePurchaseSubmit(true, 'UPI', purchaseUpiId);
                          } else {
                            if (!purchaseCardNumber.trim() || !purchaseCardExpiry.trim() || !purchaseCardCvv.trim()) {
                              alert("Please fill all card details");
                              return;
                            }
                            const maskedCard = `Card (**** ${purchaseCardNumber.slice(-4)})`;
                            handlePurchaseSubmit(true, 'Card', maskedCard);
                          }
                        }}
                      >
                        Pay & Activate License
                      </button>
                    </div>
                  </div>
                )}

                {/* Simulated Processing Step */}
                {purchaseStep === 'processing' && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <h4 className="fw-bold">Processing Your Payment</h4>
                    <p className="text-muted">Do not close this window. Verifying transaction with Razorpay Demo Servers...</p>
                  </div>
                )}

                {/* Simulated Success Step */}
                {purchaseStep === 'success' && (
                  <div className="text-center py-5">
                    <div className="mb-4 d-inline-flex justify-content-center align-items-center rounded-circle bg-success text-white" style={{ width: '80px', height: '80px' }}>
                      <FaCheck size={40} />
                    </div>
                    <h3 className="fw-bold text-success">Payment Successful!</h3>
                    <p className="text-muted mb-2">Transaction ID: <span className="fw-bold text-dark">{purchaseTxnId}</span></p>
                    <p className="text-muted mb-0">Activating your gym software license instantly...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <motion.div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-4 p-5 text-center"
            style={{
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
              >
                <FaCheck size={40} />
              </div>
            </div>
            <h2 className="mb-3" style={{ color: '#1a202c', fontWeight: 'bold' }}>
              Request Sent Successfully!
            </h2>
            <p className="mb-4" style={{ color: '#4a5568', fontSize: '1.1rem' }}>
              Thank you for your purchase request. We've received your information and will contact you shortly to complete the setup process.
            </p>
            <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: '#f7fafc' }}>
              <h5 className="mb-2" style={{ color: '#2d3748' }}>Order Details:</h5>
              <div className="text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Plan:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.selectedPlan || purchaseFormData.selectedPlan}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Gym Name:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.companyName || purchaseFormData.companyName}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Email:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.email || purchaseFormData.email}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span style={{ color: '#718096' }}>Billing:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.billingDuration || purchaseFormData.billingDuration}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span style={{ color: '#718096' }}>Start Date:</span>
                  <span style={{ color: '#2d3748', fontWeight: '500' }}>{lastPurchase?.startDate || purchaseFormData.startDate}</span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              className="px-4 py-2"
              style={{
                backgroundColor: '#60a5fa',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500'
              }}
              onClick={() => setShowSuccessNotification(false)}
            >
              Got it
            </Button>
          </motion.div>
        </motion.div>
      )}

      {/* SaaS Demo Lead Capture Modal */}
      {showDemoModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content" style={{ borderRadius: '18px', border: 'none', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '24px 28px 20px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 style={{ color: '#fff', fontWeight: '700', margin: 0, fontSize: '1.3rem' }}>📅 Schedule a Free Demo</h4>
                    <p style={{ color: 'rgba(255,255,255,0.85)', margin: '4px 0 0', fontSize: '13px' }}>We'll call you within 24 hours</p>
                  </div>
                  <button className="btn-close btn-close-white" onClick={() => setShowDemoModal(false)} />
                </div>
              </div>

              {/* Body */}
              <div className="modal-body" style={{ padding: '24px 28px' }}>
                {demoSuccess ? (
                  <div className="text-center py-3">
                    <div style={{ fontSize: '52px' }}>✅</div>
                    <h5 style={{ color: '#22c55e', fontWeight: '700', marginTop: '12px' }}>Request Received!</h5>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Opening WhatsApp... Our team will contact you soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleDemoLeadSubmit}>
                    <div className="row g-3">
                      <div className="col-12">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
                          Full Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text" className="form-control" placeholder="Your full name"
                          value={demoForm.fullName}
                          onChange={e => setDemoForm(p => ({ ...p, fullName: e.target.value }))}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>
                          Phone <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="tel" className="form-control" placeholder="Mobile number"
                          value={demoForm.phone}
                          onChange={e => setDemoForm(p => ({ ...p, phone: e.target.value }))}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Email</label>
                        <input
                          type="email" className="form-control" placeholder="Email address"
                          value={demoForm.email}
                          onChange={e => setDemoForm(p => ({ ...p, email: e.target.value }))}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Gym Name</label>
                        <input
                          type="text" className="form-control" placeholder="Your gym name"
                          value={demoForm.gymName}
                          onChange={e => setDemoForm(p => ({ ...p, gymName: e.target.value }))}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>City</label>
                        <input
                          type="text" className="form-control" placeholder="Your city"
                          value={demoForm.city}
                          onChange={e => setDemoForm(p => ({ ...p, city: e.target.value }))}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                        />
                      </div>
                      <div className="col-12">
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', display: 'block' }}>Interested Plan</label>
                        <select
                          className="form-select"
                          value={demoLeadPlan}
                          onChange={e => setDemoLeadPlan(e.target.value)}
                          style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', padding: '10px 14px', fontSize: '14px' }}
                        >
                          <option value="">-- Select a plan (optional) --</option>
                          {plans.length > 0
                            ? plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)
                            : ['Basic', 'Growth', 'Premium', '7-Day Free Trial'].map(p => <option key={p} value={p}>{p}</option>)
                          }
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={demoSubmitting}
                      style={{
                        marginTop: '20px', width: '100%', padding: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff', border: 'none', borderRadius: '12px',
                        fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                        opacity: demoSubmitting ? 0.7 : 1
                      }}
                    >
                      {demoSubmitting ? '⏳ Submitting...' : '📅 Book My Demo + Open WhatsApp'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '10px', marginBottom: 0 }}>
                      We'll also send a WhatsApp message confirmation
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LendingPage;