import React, { useState, useEffect } from "react";
import axiosInstance from "../../Api/axiosInstance";
import { FaCrown, FaCheck, FaCalendarAlt, FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminMySubscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [billingDuration, setBillingDuration] = useState("Yearly");
  const [amount, setAmount] = useState("");
  
  // Payment Gateway simulation states
  const [paymentStep, setPaymentStep] = useState('confirm'); // 'confirm' | 'gateway' | 'processing' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [user, setUser] = useState(null);
  const [generatedTxnId, setGeneratedTxnId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [requestHistory, setRequestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [automationSettings, setAutomationSettings] = useState({
    trialDurationDays: 7,
    gracePeriodDays: 3,
    quarterlyDiscount: 5,
    yearlyDiscount: 15
  });

  useEffect(() => {
    // Get logged-in user info
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchRequestHistory(parsedUser.email);
    }
    fetchPlans();
    fetchAutomationSettings();
  }, []);

  const fetchAutomationSettings = async () => {
    try {
      const res = await axiosInstance.get("/v1/automation/settings");
      if (res.data.success && res.data.settings) {
        setAutomationSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed to load automation settings:", err);
    }
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

  // Recalculate amount dynamically when selected plan or billing duration changes
  useEffect(() => {
    if (!selectedPlanId || plans.length === 0) return;
    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (selectedPlan) {
      const calculatedAmount = calculateDiscountedPrice(
        selectedPlan.price,
        selectedPlan.duration,
        billingDuration,
        automationSettings.quarterlyDiscount,
        automationSettings.yearlyDiscount
      );
      setAmount(calculatedAmount);
    }
  }, [selectedPlanId, billingDuration, plans, automationSettings]);

  const fetchRequestHistory = async (email) => {
    if (!email) return;
    try {
      setLoadingHistory(true);
      const res = await axiosInstance.get(`/purchases?email=${email}`);
      if (res.data.success && Array.isArray(res.data.data)) {
        setRequestHistory(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load request history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/plans");
      if (res.data.success) {
        // Filter only ACTIVE plans
        const activePlans = res.data.plans.filter(p => p.status === "ACTIVE");
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
          setAmount(activePlans[0].price); // Default to plan price
        }
      }
    } catch (err) {
      console.error("Failed to load plans:", err);
      toast.error("Failed to load available plans.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlanId(plan.id);
    setAmount(plan.price);
  };

  const openConfirmation = () => {
    if (!selectedPlanId) {
      toast.warn("Please select a plan first.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.warn("Please enter a valid amount.");
      return;
    }
    if (!user) {
      toast.error("User information not found. Please log in again.");
      return;
    }
    setShowModal(true);
  };

  const handleSubmitRequest = async (demoPaid = false) => {
    const selectedPlanData = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlanData) return;

    setSubmitting(true);
    try {
      const payload = {
        selectedPlan: selectedPlanData.name,
        companyName: user.fullName || "Gym Owner", // Fallback to fullName since companyName might not exist in token
        email: user.email || "",
        phone: user.phone || "",
        adminName: user.fullName || "",
        branchName: user.branchName || "",
        billingDuration: billingDuration,
        amount: Number(amount),
        startDate: new Date().toISOString(),
        isUpgrade: true,
        isDemoPaid: demoPaid,
        paymentMethod: demoPaid ? (paymentMethod === 'upi' ? 'UPI' : 'Card') : null,
        paymentDetails: demoPaid ? (paymentMethod === 'upi' ? upiId : `Card (**** ${cardNumber.slice(-4)})`) : null
      };

      const response = await axiosInstance.post("/purchases", payload);
      if (response.data && response.data.success) {
        const txnId = response.data.data?.transactionId || `PAY-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${String(response.data.data?.id || 0).padStart(4,'0')}`;
        
        if (demoPaid) {
          setGeneratedTxnId(txnId);
          setPaymentStep('success');
          fetchRequestHistory(user.email); // Refresh history
          window.dispatchEvent(new Event("userUpgrade")); // Refresh layout header countdown banner instantly
          
          // Auto close the modal after 4.5 seconds so user can read the transaction ID
          setTimeout(() => {
            setShowModal(false);
            setPaymentStep('confirm'); // reset state
            setGeneratedTxnId("");
          }, 4500);
        } else {
          toast.success("Plan request submitted successfully!");
          setShowModal(false);
          setPaymentStep('confirm'); // reset state
          fetchRequestHistory(user.email); // Refresh history
        }
      } else {
        toast.error("Failed to submit request.");
        if (demoPaid) setPaymentStep('confirm');
      }
    } catch (error) {
      console.error("Error submitting purchase:", error);
      toast.error(error.response?.data?.message || "Failed to submit plan request.");
      if (demoPaid) setPaymentStep('confirm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: "#2c3e50", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>Gym Software License (My Subscription)</h3>
          <p className="text-muted mb-0" style={{fontSize: 'clamp(12px, 3vw, 14px)'}}>
            Manage your Gym SaaS Software License. These plans are provided by the Super Admin to keep your gym management system active.
          </p>
        </div>
      </div>

      {/* Request History Section */}
      <div className="card shadow-sm border-0 rounded-4 mb-5">
        <div className="card-header bg-white border-bottom-0 pt-4 pb-2 px-4">
          <h5 className="fw-bold text-dark mb-0">My Request History</h5>
        </div>
        <div className="card-body p-0 px-2 pb-3">
          {loadingHistory ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
            </div>
          ) : requestHistory.length === 0 ? (
            <div className="text-center py-4 text-muted small">No past requests found.</div>
          ) : (
            <div className="table-responsive px-2 px-md-3">
              <table className="table table-hover table-borderless align-middle mb-0" style={{ minWidth: '400px' }}>
                <thead className="bg-light rounded-3">
                  <tr>
                    <th className="py-2 px-2 px-md-3 rounded-start text-muted small fw-semibold">Date</th>
                    <th className="py-2 px-2 px-md-3 text-muted small fw-semibold">Plan</th>
                    <th className="py-2 px-2 px-md-3 text-muted small fw-semibold">Amount</th>
                    <th className="py-2 px-2 px-md-3 rounded-end text-muted small fw-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requestHistory.map((req) => (
                    <tr key={req.id} className="border-bottom">
                      <td className="py-3 px-2 px-md-3 text-muted" style={{fontSize: 'clamp(11px, 2.5vw, 13px)'}}>{new Date(req.purchaseDate).toLocaleDateString('en-GB')}</td>
                      <td className="py-3 px-2 px-md-3 fw-semibold" style={{fontSize: 'clamp(12px, 2.5vw, 14px)'}}>{req.selectedPlan} <span className="text-muted fw-normal d-block d-sm-inline" style={{fontSize:"11px"}}>({req.billingDuration})</span></td>
                      <td className="py-3 px-2 px-md-3 fw-bold text-primary" style={{fontSize: 'clamp(12px, 2.5vw, 14px)'}}>₹{req.amount}</td>
                      <td className="py-3 px-2 px-md-3">
                        <span className={`badge rounded-pill px-2 px-md-3 py-1 py-md-2 ${
                          req.status.toLowerCase() === 'approved' ? 'bg-success' : 
                          req.status.toLowerCase() === 'rejected' ? 'bg-danger' : 
                          'bg-warning text-dark'
                        }`} style={{fontSize: 'clamp(10px, 2vw, 12px)'}}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <h5 className="fw-bold text-dark mb-4 px-2">Available Software Licenses <span className="text-muted small fw-normal">(Set by Super Admin)</span></h5>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading available plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="card shadow-sm border-0 rounded-4 text-center py-5">
          <div className="card-body">
            <h5 className="text-muted">No plans available right now.</h5>
            <p className="text-muted small">Please contact the Super Admin.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {/* Plan Selection Area */}
          <div className="col-lg-8 mb-4">
            <div className="row g-4">
              {plans.map((plan) => (
                <div className="col-md-6" key={plan.id}>
                  <div 
                    className={`card h-100 border-2 rounded-4 transition-all shadow-sm ${selectedPlanId === plan.id ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                    style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <div className="card-body p-4 position-relative">
                      {selectedPlanId === plan.id && (
                        <div className="position-absolute top-0 end-0 mt-3 me-3 text-primary">
                          <FaCheck size={20} />
                        </div>
                      )}
                      
                      <div className="mb-3 d-flex align-items-center gap-2">
                        <FaCrown size={24} className={selectedPlanId === plan.id ? 'text-primary' : 'text-warning'} />
                        <h4 className="fw-bold mb-0">{plan.name}</h4>
                      </div>
                      
                      <h2 className="fw-bold mb-1">₹{plan.price}</h2>
                      <p className="text-muted small mb-3">per {plan.duration.toLowerCase()}</p>
                      
                      <span className="badge bg-dark rounded-pill mb-3 px-3 py-2">{plan.category}</span>
                      
                      {plan.description && (
                        <div className="mt-3 pt-3 border-top border-light">
                          <p className="text-muted small mb-0" style={{ whiteSpace: "pre-wrap" }}>{plan.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Request Form Area */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 sticky-top" style={{ top: "90px", zIndex: 10 }}>
              <div className="card-header bg-white border-bottom-0 pt-4 pb-0 px-4">
                <h5 className="fw-bold text-dark mb-0">Request Plan</h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Selected Plan</label>
                  <div className="form-control bg-light fw-bold border-0">
                    {plans.find(p => p.id === selectedPlanId)?.name || "None selected"}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-muted small">Billing Duration</label>
                  <select 
                    className="form-select border-1"
                    value={billingDuration}
                    onChange={(e) => setBillingDuration(e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly (Save {automationSettings.quarterlyDiscount}%)</option>
                    <option value="Yearly">Yearly (Save {automationSettings.yearlyDiscount}%)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-muted small">Plan Amount / Funds (₹)</label>
                  <input 
                    type="number" 
                    className="form-control border-1 fw-bold text-primary" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                  <small className="text-muted" style={{ fontSize: "11px" }}>You can manually adjust the amount if agreed upon with the Super Admin.</small>
                </div>

                <div className="bg-light p-3 rounded-3 mb-4">
                  <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                    <FaCalendarAlt />
                    <span>Starts: Immediately upon approval</span>
                  </div>
                  <p className="small text-muted mb-0">
                    Your request will be sent to the Super Admin for offline payment verification.
                  </p>
                </div>

                <button 
                  className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm"
                  onClick={openConfirmation}
                  disabled={!selectedPlanId}
                >
                  Review Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Mock Payment Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg" style={{ overflow: 'hidden' }}>
              
              {paymentStep === 'confirm' && (
                <>
                  <div className="modal-header border-bottom-0 pb-0">
                    <h5 className="modal-title fw-bold">Confirm Plan Request</h5>
                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-4">Please review your details before submitting the request to the Super Admin.</p>
                    
                    <div className="bg-light rounded-3 p-3 mb-3">
                      <h6 className="fw-bold mb-3 border-bottom pb-2">Admin Details</h6>
                      <div className="row g-2 small">
                        <div className="col-5 text-muted">Admin Name:</div>
                        <div className="col-7 fw-semibold">{user?.fullName || "N/A"}</div>
                        
                        <div className="col-5 text-muted">Phone:</div>
                        <div className="col-7 fw-semibold">{user?.phone || "N/A"}</div>
                        
                        <div className="col-5 text-muted">Email:</div>
                        <div className="col-7 fw-semibold">{user?.email || "N/A"}</div>
                      </div>
                    </div>

                    <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                      <h6 className="fw-bold mb-3 border-bottom border-primary border-opacity-25 pb-2 text-primary">Plan Details</h6>
                      <div className="row g-2 small">
                        <div className="col-5 text-muted">Selected Plan:</div>
                        <div className="col-7 fw-bold">{plans.find(p => p.id === selectedPlanId)?.name}</div>
                        
                        <div className="col-5 text-muted">Duration:</div>
                        <div className="col-7 fw-semibold">{billingDuration}</div>
                        
                        <div className="col-5 text-muted">Payment Amount:</div>
                        <div className="col-7 fw-bold fs-5 text-primary">₹{amount}</div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => setPaymentStep('gateway')}>
                      Proceed to Pay Online
                    </button>
                  </div>
                </>
              )}

              {paymentStep === 'gateway' && (
                <>
                  <div className="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center bg-primary bg-opacity-10 py-3">
                    <div className="ps-2">
                      <h6 className="fw-bold mb-0 text-primary" style={{ letterSpacing: '0.5px' }}>SPEED FITNESS PAYMENTS</h6>
                      <span className="text-muted" style={{ fontSize: '10px' }}>Razorpay Dummy Mode</span>
                    </div>
                    <button type="button" className="btn-close" onClick={() => { setShowModal(false); setPaymentStep('confirm'); }}></button>
                  </div>
                  <div className="modal-body px-4 py-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                      <div>
                        <span className="text-muted small">Subscription for:</span>
                        <h6 className="fw-bold mb-0">{plans.find(p => p.id === selectedPlanId)?.name} Plan</h6>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small">Amount to Pay:</span>
                        <h4 className="fw-bold text-primary mb-0">₹{amount}</h4>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted mb-2">Select Payment Method</label>
                        <div className="d-flex gap-2">
                          <button 
                            type="button" 
                            className={`btn btn-outline-primary flex-fill py-3 fw-bold rounded-3 ${paymentMethod === 'upi' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setPaymentMethod('upi')}
                          >
                            📱 UPI (Paytm/GPay)
                          </button>
                          <button 
                            type="button" 
                            className={`btn btn-outline-primary flex-fill py-3 fw-bold rounded-3 ${paymentMethod === 'card' ? 'active bg-primary text-white' : ''}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            💳 Card (Credit/Debit)
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'upi' ? (
                        <div className="col-12 mt-3">
                          <label className="form-label small fw-semibold text-muted">Enter UPI ID</label>
                          <input 
                            type="text" 
                            className="form-control border-1 p-2 rounded-3" 
                            placeholder="username@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                          <small className="text-muted mt-1 d-block" style={{fontSize: "11px"}}>Demo ID: e.g., guest@gpay</small>
                        </div>
                      ) : (
                        <div className="row g-2 mt-2 px-1">
                          <div className="col-12">
                            <label className="form-label small fw-semibold text-muted">Card Number</label>
                            <input 
                              type="text" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="4111 2222 3333 4444"
                              maxLength="19"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold text-muted">Expiry Date</label>
                            <input 
                              type="text" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="MM/YY"
                              maxLength="5"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small fw-semibold text-muted">CVV</label>
                            <input 
                              type="password" 
                              className="form-control border-1 p-2 rounded-3" 
                              placeholder="123"
                              maxLength="3"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 pt-0 px-4">
                    <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setPaymentStep('confirm')}>Back</button>
                    <button 
                      type="button" 
                      className="btn btn-success rounded-pill px-5 fw-bold" 
                      onClick={() => {
                        if (paymentMethod === 'upi' && !upiId.trim()) {
                          toast.warn("Please enter a UPI ID");
                          return;
                        }
                        if (paymentMethod === 'card' && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
                          toast.warn("Please fill all card fields");
                          return;
                        }
                        
                        setPaymentStep('processing');
                        handleSubmitRequest(true);
                      }}
                    >
                      Pay ₹{amount} (Demo)
                    </button>
                  </div>
                </>
              )}

              {paymentStep === 'processing' && (
                <div className="modal-body text-center py-5">
                  <div className="spinner-border text-primary mb-4" role="status" style={{ width: '4rem', height: '4rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h4 className="fw-bold">Processing Your Payment</h4>
                  <p className="text-muted">Do not close this window. Verifying transaction with Razorpay Demo Servers...</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="modal-body text-center py-5">
                  <div className="mb-4 d-inline-flex justify-content-center align-items-center rounded-circle bg-success text-white" style={{ width: '80px', height: '80px' }}>
                    <FaCheck size={40} />
                  </div>
                  <h3 className="fw-bold text-success">Payment Successful!</h3>
                  <p className="text-muted mb-2">Transaction ID: <span className="fw-bold text-dark">{generatedTxnId}</span></p>
                  <p className="text-muted mb-0">Activating your SaaS license instantly...</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMySubscription;
