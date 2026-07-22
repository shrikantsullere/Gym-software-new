import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosInstance from "../Api/axiosInstance";
import { Container, Row, Col, Button, Card, Modal, Form, Table, Spinner, Alert } from 'react-bootstrap';
import html2canvas from "html2canvas";
import GymLogo from "../assets/Logo/Logo1.png";

const DynamicPage = () => {
  const { slug, adminId } = useParams();
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ✅ Updated: include fullName, phone, email, and gender
  const [paymentDetails, setPaymentDetails] = useState({
    upi: '',
    fullName: '',
    phone: '',
    email: '',
    gender: '' // 👈 new field
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [branchId, setBranchId] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const settingsRes = await axiosInstance.get(
          `/adminSettings/app-settings/admin/${adminId}`
        );

        const appSettings = settingsRes.data?.data;
        if (!appSettings) {
          setLoading(false);
          return;
        }

        const apiSlug = appSettings.url;

        if (!slug || slug !== apiSlug) {
          navigate(`/${apiSlug}/${adminId}`, { replace: true });
          return;
        }

        setSettings(appSettings);

        if (appSettings.branchId) {
          setBranchId(appSettings.branchId);
        }

        const plansRes = await axiosInstance.get(
          `/MemberPlan?adminId=${adminId}`
        );

        setPlans(plansRes.data?.plans || []);
      } catch (err) {
        console.error("Dynamic page error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, [slug, adminId, navigate]);

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    setBookingMessage('');
    setBookingStatus(null);
  };

  // Function to generate and download receipt as image using html2canvas
  const generateBookingReceipt = async (paymentDetails, selectedPlan, bookingResponse) => {
    try {
      // Get plan details
      const planName = selectedPlan?.name || "Membership Plan";
      const planPrice = selectedPlan?.price 
        ? parseFloat(selectedPlan.price.toString().replace("₹", "").replace(/,/g, "")) 
        : 0;
      const planValidity = selectedPlan?.validityDays || "N/A";
      const planSessions = selectedPlan?.sessions || "N/A";
      
      // Payment details
      const totalAmount = planPrice || 0;
      const paymentMode = "UPI";
      const cashPaid = planPrice || 0;
      const change = 0;
      const invoiceNo = bookingResponse?.bookingId 
        ? `INV-${bookingResponse.bookingId}` 
        : `INV-${Date.now()}`;
      const paymentDate = new Date().toLocaleDateString();

      // Member details from payment form
      const memberName = paymentDetails?.fullName || "N/A";
      const memberPhone = paymentDetails?.phone || "N/A";
      const memberEmail = paymentDetails?.email || "N/A";
      const memberGender = paymentDetails?.gender || "N/A";
      const memberAddress = "N/A"; // Not available in booking form
      const memberDOB = "N/A"; // Not available in booking form
      const membershipFrom = new Date().toLocaleDateString();
      const membershipTo = selectedPlan?.validityDays 
        ? new Date(Date.now() + selectedPlan.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString()
        : "N/A";
      const memberStatus = "Pending"; // Booking is pending admin approval

      // Convert logo to data URL for html2canvas
      let logoDataUrl = "";
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
              resolve(GymLogo); // Fallback to original path
            }
          };
          img.onerror = () => resolve(GymLogo); // Fallback to original path
          img.src = GymLogo;
        });
      } catch (err) {
        logoDataUrl = GymLogo; // Use original path if conversion fails
      }

      // Create receipt HTML with all details matching the image format
      const receiptHTML = `
        <div id="receipt-container" style="
          width: 400px;
          background: white;
          padding: 30px 20px;
          font-family: 'Courier New', monospace;
          color: black;
          margin: 0 auto;
          box-sizing: border-box;
        ">
          <div style="border-top: 2px dashed #000; margin-bottom: 15px;"></div>
          <h1 style="text-align: center; font-weight: bold; font-size: 28px; margin: 15px 0; text-transform: uppercase; letter-spacing: 2px;">RECEIPT</h1>
          <div style="border-top: 2px dashed #000; margin: 15px 0 25px 0;"></div>
          
          <!-- Invoice and Date -->
          <div style="margin-bottom: 15px; font-size: 11px;">
            <div style="margin-bottom: 5px;"><strong>Invoice No:</strong> ${invoiceNo}</div>
            <div><strong>Date:</strong> ${paymentDate}</div>
          </div>
          
          <div style="border-top: 1px dashed #000; margin: 15px 0;"></div>
          
          <!-- Member Details Section -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px;">Member Details:</div>
            <div style="font-size: 11px; line-height: 1.6;">
              <div><strong>Name:</strong> ${memberName}</div>
              <div><strong>Phone:</strong> ${memberPhone}</div>
              <div><strong>Email:</strong> ${memberEmail}</div>
              <div><strong>Address:</strong> ${memberAddress}</div>
              <div><strong>Gender:</strong> ${memberGender}</div>
              <div><strong>Date of Birth:</strong> ${memberDOB}</div>
            </div>
          </div>
          
          <div style="border-top: 1px dashed #000; margin: 15px 0;"></div>
          
          <!-- Membership Details Section -->
          <div style="margin-bottom: 15px;">
            <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px;">Membership Details:</div>
            <div style="font-size: 11px; line-height: 1.6;">
              <div><strong>Plan:</strong> ${planName}</div>
              <div><strong>Validity:</strong> ${planValidity} days</div>
              <div><strong>Sessions:</strong> ${planSessions}</div>
              <div><strong>From:</strong> ${membershipFrom}</div>
              <div><strong>To:</strong> ${membershipTo}</div>
              <div><strong>Status:</strong> ${memberStatus}</div>
            </div>
          </div>
          
          <div style="border-top: 2px dashed #000; margin: 20px 0;"></div>
          
          <!-- Payment Items -->
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
              <span style="text-align: left;">1x ${planName}</span>
              <span style="text-align: right; margin-left: 20px;">₹ ${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="border-top: 2px dashed #000; margin: 20px 0;"></div>
          
          <!-- Payment Summary -->
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
              <span style="font-weight: bold; text-align: left;">TOTAL AMOUNT</span>
              <span style="font-weight: bold; text-align: right;">₹ ${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="border-top: 2px dashed #000; margin: 20px 0;"></div>
          
          <!-- Payment Details -->
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
              <span style="font-weight: bold; text-align: left;">${paymentMode.toUpperCase()}</span>
              <span style="font-weight: bold; text-align: right;">₹ ${cashPaid.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px;">
              <span style="font-weight: bold; text-align: left;">CHANGE</span>
              <span style="font-weight: bold; text-align: right;">₹ ${change.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="border-top: 2px dashed #000; margin: 20px 0;"></div>
          
          <!-- Thank You -->
          <h2 style="text-align: center; font-weight: bold; font-size: 22px; margin: 20px 0; text-transform: uppercase; letter-spacing: 1px;">THANK YOU</h2>
          <div style="border-top: 2px dashed #000; margin: 15px 0 20px 0;"></div>
          
          <!-- Gym Logo in Blank Rectangle Box -->
          <div style="margin-top: 25px; text-align: center;">
            <div style="
              border: 1px solid #000;
              margin: 15px auto;
              width: 320px;
              min-height: 100px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              box-sizing: border-box;
            ">
              <img src="${logoDataUrl}" alt="Gym Logo" style="max-width: 100%; max-height: 100px; height: auto; object-fit: contain; display: block;" />
            </div>
          </div>
        
          
          <!-- Watermark -->
          <div style="margin-top: 15px; text-align: left; font-size: 10px; color: #999; opacity: 0.5;">
            modif.ai
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

      // Wait for images to load before converting to canvas
      const images = receiptElement.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails
              }
            })
        )
      );

      // Convert to canvas and download
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Create download link
      const link = document.createElement("a");
      link.download = `Receipt_${memberName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error("Error generating receipt:", error);
      // Don't show alert, just log the error to avoid interrupting the booking flow
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    const { upi, fullName, phone, email, gender } = paymentDetails;

    if (!fullName.trim()) {
      setBookingMessage('Please enter your full name.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone.trim())) {
      setBookingMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setBookingMessage('Please enter a valid email address.');
      return;
    }

    if (!gender) {
      setBookingMessage('Please select your gender.');
      return;
    }

    if (!upi.trim()) {
      setBookingMessage('Please enter a valid UPI ID.');
      return;
    }

    const price =
      selectedPlan.numericPrice ??
      (typeof selectedPlan.price === 'string'
        ? selectedPlan.price.replace(/[^\d.]/g, '')
        : selectedPlan.price);

    if (!adminId || !selectedPlan) {
      setBookingMessage('Missing plan or admin details.');
      return;
    }

    setBookingStatus('pending');
    setBookingMessage('');

    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender: gender, // ✅ Included in payload
        planId: Number(selectedPlan.id),
        price: Number(price),
        adminId: Number(adminId),
        upiId: upi.trim(),
      };

      console.log('Sending booking payload:', payload);

      const response = await axiosInstance.post('booking/create', payload);

      if (response.data.success || response.status === 200) {
        setBookingStatus('success');
        setBookingMessage(response.data.message || 'Booking request sent to admin.');
        
        // Generate receipt after successful booking
        await generateBookingReceipt(paymentDetails, selectedPlan, response.data);
        
        setTimeout(() => {
          setShowPaymentModal(false);
          setPaymentDetails({ upi: '', fullName: '', phone: '', email: '', gender: '' });
          setSelectedPlan(null);
        }, 2000);
      } else {
        setBookingMessage(response.data.message || 'Booking failed. Please try again.');
        setBookingStatus('error');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingStatus('error');
      setBookingMessage(
        err.response?.data?.message ||
        err.message ||
        'Failed to create booking. Please try again.'
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <h4>Loading page...</h4>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center mt-5">
        {/* <h3>Page Not Found</h3> */}
      </div>
    );
  }

  return (
    <div style={{ background: "#f8f9fa" }}>
      {/* HERO SECTION */}
      <div
        style={{
          background: "linear-gradient(135deg, #002d4d, #004b80)",
          color: "#fff",
          padding: "90px 20px",
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-5 mb-md-0">
              <h1 style={{ fontWeight: "800", letterSpacing: "1px" }}>
                {slug?.toUpperCase()}
              </h1>
              <p
                style={{
                  maxWidth: "520px",
                  marginTop: "18px",
                  lineHeight: "1.8",
                  opacity: 0.95,
                }}
              >
                {settings.description}
              </p>
            </div>
            <div className="col-md-6 text-center">
              {settings.logo && (
                <div
                  style={{
                    background: "#ffffff",
                    padding: "35px",
                    borderRadius: "22px",
                    display: "inline-block",
                    boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
                  }}
                >
                  <img
                    src={settings.logo}
                    alt="logo"
                    style={{
                      width: "260px",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PLANS SECTION */}
      <div className="container py-5">
        <h2 className="text-center mb-4 fw-bold">Membership Plans</h2>
        {plans.length === 0 ? (
          <p className="text-center text-muted">No plans available</p>
        ) : (
          <div className="row">
            {plans.map((plan) => (
              <div className="col-md-4 mb-4" key={plan.id}>
                <div
                  className="card h-100 shadow-sm"
                  style={{ borderRadius: "14px" }}
                >
                  <div className="card-body text-center">
                    <h4 className="fw-bold">{plan.name}</h4>
                    <span
                      className="badge mb-3"
                      style={{
                        background: "#002d4d",
                        color: "#fff",
                        padding: "6px 14px",
                      }}
                    >
                      {plan.type}
                    </span>
                    <h2 className="my-3">
                      ₹{plan.price}
                      <small className="text-muted fs-6"> / plan</small>
                    </h2>
                    <ul className="list-unstyled text-muted mb-4">
                      <li>📅 Validity: {plan.validityDays} days</li>
                      <li>🏋️ Sessions: {plan.sessions}</li>
                    </ul>
                    <button
                      className="btn w-100"
                      style={{
                        background: "#002d4d",
                        color: "#fff",
                        borderRadius: "8px",
                      }}
                      onClick={() => handleChoosePlan(plan)}
                    >
                      Choose Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      <Modal
        show={showPaymentModal}
        onHide={() => {
          setShowPaymentModal(false);
          setBookingMessage('');
          setBookingStatus(null);
        }}
        centered
        size="md"
      >
        <Modal.Header
          closeButton
          style={{ backgroundColor: '#f8f9fa', borderBottom: '3px solid #2f6a87' }}
        >
          <Modal.Title style={{ color: '#333', fontWeight: '600', fontSize: '1.2rem' }}>
            Complete Payment
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {bookingStatus === 'pending' ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3 fw-bold" style={{ color: '#333', fontSize: '1.1rem' }}>
                Processing your booking...
              </p>
            </div>
          ) : (
            <Form onSubmit={handlePaymentSubmit}>
              <div
                className="text-center mb-3 p-3 rounded"
                style={{
                  backgroundColor: '#f0f7fa',
                  border: '2px dashed #2f6a87',
                  borderRadius: '12px'
                }}
              >
                <h5 className="mb-2" style={{ color: '#333', fontSize: '1.1rem' }}>
                  Booking Details
                </h5>
                <p className="mb-1" style={{ fontSize: '0.95rem' }}>
                  <strong>Plan:</strong> {selectedPlan?.name} ({selectedPlan?.type})
                </p>
                <p className="mb-1" style={{ fontSize: '0.95rem' }}>
                  <strong>Validity:</strong> {selectedPlan?.validityDays} days
                </p>
                <p className="mb-0">
                  <strong>Amount:</strong>
                  <span className="fw-bold" style={{ fontSize: '1.2rem', color: '#2f6a87' }}>
                    ₹{selectedPlan?.price}
                  </span>
                </p>
              </div>

              {bookingMessage && (
                <Alert
                  variant={
                    bookingStatus === 'error' ? 'danger' :
                      bookingStatus === 'success' ? 'success' : 'info'
                  }
                  className="mb-3"
                >
                  {bookingMessage}
                </Alert>
              )}

              {/* Full Name */}
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>
                  Full Name
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your full name"
                  value={paymentDetails.fullName}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                  disabled={bookingStatus === 'success'}
                />
              </Form.Group>

              {/* Phone */}
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>
                  Phone Number
                </Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={paymentDetails.phone}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  disabled={bookingStatus === 'success'}
                />
                <Form.Text className="text-muted">
                  Indian mobile number (e.g., 9876543210)
                </Form.Text>
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>
                  Email Address
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="yourname@example.com"
                  value={paymentDetails.email}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={bookingStatus === 'success'}
                />
              </Form.Group>

              {/* Gender */}
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>
                  Gender
                </Form.Label>
                <Form.Select
                  value={paymentDetails.gender}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, gender: e.target.value }))}
                  required
                  disabled={bookingStatus === 'success'}
                >
                  <option value="">Select your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>

              {/* UPI */}
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#333', fontWeight: '600', fontSize: '1rem' }}>
                  UPI ID
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="yourname@upi"
                  value={paymentDetails.upi}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, upi: e.target.value }))}
                  required
                  disabled={bookingStatus === 'success'}
                />
                <Form.Text className="text-muted">
                  e.g., yourname@upi, yournumber@ybl
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-center">
                <Button
                  type="submit"
                  className="w-100 py-2 fw-bold rounded-pill"
                  disabled={bookingStatus === 'pending' || bookingStatus === 'success'}
                  style={{
                    backgroundColor: bookingStatus === 'success' ? '#28a745' : '#2f6a87',
                    borderColor: bookingStatus === 'success' ? '#28a745' : '#2f6a87',
                    fontSize: '1.1rem',
                    transition: 'background-color 0.3s ease',
                    padding: '10px 20px',
                    maxWidth: '400px'
                  }}
                >
                  {bookingStatus === 'pending' ? 'Processing...' :
                    bookingStatus === 'success' ? 'Booking Successful!' :
                      'Confirm Booking'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DynamicPage;