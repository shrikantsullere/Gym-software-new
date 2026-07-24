import React, { useState, useEffect } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faChartLine, faHistory, faShoppingCart, faCheckCircle, faEnvelope, faComments } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const NotificationCredits = () => {
  const [balance, setBalance] = useState({ remaining: 0, totalPurchased: 0, totalUsed: 0, plan: 'Basic' });
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMockPayment, setShowMockPayment] = useState(false);
  const [mockPaymentData, setMockPaymentData] = useState(null);
  const [processingMock, setProcessingMock] = useState(false);
  const [mockStep, setMockStep] = useState('selection'); // selection, upi_processing, card_details, card_otp, bank_selection, bank_login
  const [selectedPayMode, setSelectedPayMode] = useState('upi');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [otp, setOtp] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankLogin, setBankLogin] = useState({ customerId: '', password: '' });
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchData();
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, pkgRes, transRes] = await Promise.all([
        axiosInstance.get('/v1/credits/balance'),
        axiosInstance.get('/v1/credits/packages'),
        axiosInstance.get('/v1/credits/transactions')
      ]);
      if (balRes.data.success) setBalance(balRes.data.balance);
      if (pkgRes.data.success) setPackages(pkgRes.data.packages);
      if (transRes.data.success) setTransactions(transRes.data.transactions);
    } catch (err) {
      console.error("Error fetching credits data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg) => {
    try {
      // 1. Initialize Order
      const res = await axiosInstance.post('/v1/credits/purchase', { packageId: pkg.id });
      if (!res.data.success) throw new Error(res.data.message);

      const { order, key_id, isMock } = res.data;

      // 2. Open Razorpay Modal OR Mock it
      if (isMock) {
        setMockPaymentData({
          orderId: order.id,
          packageId: pkg.id,
          amount: order.amount / 100,
          packageName: pkg.packageName
        });
        setMockStep('selection');
        setSelectedPayMode('upi');
        setShowModal(false);
        setShowMockPayment(true);
        return;
      }

      // Real Razorpay Flow
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Gym SaaS",
        description: `Purchase ${pkg.packageName}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await axiosInstance.post('/v1/credits/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              packageId: pkg.id
            });
            if (verifyRes.data.success) {
              alert("✅ Payment Successful! Credits have been added to your account.");
              setShowModal(false);
              fetchData();
            } else {
              alert("Payment verification failed.");
            }
          } catch (vErr) {
            console.error("Verification error:", vErr);
            alert("Error verifying payment.");
          }
        },
        theme: { color: "#6EB2CC" }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error("Purchase error:", err);
      alert("Failed to initialize payment.");
    }
  };

  const handleMockPaymentComplete = async () => {
    setProcessingMock(true);
    try {
      const verifyRes = await axiosInstance.post('/v1/credits/verify', {
        razorpay_order_id: mockPaymentData.orderId,
        razorpay_payment_id: 'pay_mock_' + Date.now(),
        razorpay_signature: 'mock_signature',
        packageId: mockPaymentData.packageId,
        isMock: true
      });
      
      if (verifyRes.data.success) {
        setShowMockPayment(false);
        alert("✅ Payment Successful! Credits have been added to your account.");
        fetchData();
      } else {
        alert("Payment verification failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying payment.");
    } finally {
      setProcessingMock(false);
    }
  };

  const whatsappPackages = packages.filter(p => p.packageType === 'WHATSAPP' || !p.packageType);
  const emailPackages = packages.filter(p => p.packageType === 'EMAIL');

  if (loading) return <div className="text-center p-5">Loading...</div>;

  return (
    <div className="container-fluid p-3 p-md-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h2 className="text-primary fw-bold mb-1" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}><FontAwesomeIcon icon={faCommentDots} className="me-2" /> Messaging & Notification Credits</h2>
          <p className="text-muted mb-0">Manage your WhatsApp message credits, Email credits, and view recharge history.</p>
        </div>
        <button className="btn btn-success fw-bold shadow-sm px-3 py-2 flex-shrink-0" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faShoppingCart} className="me-2" /> Buy Credits / Emails
        </button>
      </div>

      {/* Stats Cards Grid (WhatsApp vs Email) */}
      <h5 className="fw-bold mb-3 text-secondary">
        <FontAwesomeIcon icon={faCommentDots} className="me-2 text-success" /> WhatsApp Messaging Balance
      </h5>
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100 border-start border-success border-4">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faCheckCircle} className="text-success" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>Remaining WhatsApp Credits</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.remaining}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faChartLine} className="text-primary" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>Total WhatsApp Purchased</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.totalPurchased}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faHistory} className="text-warning" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>WhatsApp Credits Used</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.totalUsed}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h5 className="fw-bold mb-3 text-secondary">
        <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" /> Email Delivery Balance
      </h5>
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100 border-start border-primary border-4">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faCheckCircle} className="text-primary" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>Remaining Email Credits</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.emailRemaining || 0}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faChartLine} className="text-info" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>Total Emails Purchased</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.emailTotalPurchased || 0}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-4 bg-white h-100">
            <div className="card-body p-3 d-flex align-items-center">
              <div className="rounded-circle bg-secondary bg-opacity-10 p-2 me-3 flex-shrink-0" style={{width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FontAwesomeIcon icon={faHistory} className="text-secondary" style={{fontSize:'1.1rem'}} />
              </div>
              <div className="overflow-hidden">
                <h6 className="text-muted mb-0 fw-bold" style={{fontSize:'12px'}}>Emails Used</h6>
                <h4 className="mb-0 fw-bold text-dark">{balance.emailTotalUsed || 0}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card shadow-sm border-0 rounded-4 mb-4">
        <div className="card-header bg-white border-bottom p-4">
          <h5 className="mb-0 fw-bold"><FontAwesomeIcon icon={faHistory} className="me-2 text-primary" /> Recharge & Usage History</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Credits Added</th>
                  <th>Credits Used</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">No transactions found.</td></tr>
                ) : transactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
                      {t.transactionType === 'PURCHASE' ? (
                        <span className="badge bg-success">Purchase</span>
                      ) : (
                        <span className="badge bg-warning text-dark">Usage</span>
                      )}
                    </td>
                    <td>{t.description}</td>
                    <td className="text-success fw-bold">{t.creditsAdded > 0 ? ('+' + t.creditsAdded) : '-'}</td>
                    <td className="text-danger fw-bold">{t.creditsUsed > 0 ? ('-' + t.creditsUsed) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="fw-bold fs-4"><FontAwesomeIcon icon={faShoppingCart} className="me-2 text-success" /> Buy Packages</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light pt-2">
          {/* WhatsApp Packages Group */}
          <div className="mb-4">
            <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">
              <FontAwesomeIcon icon={faCommentDots} className="me-2 text-success" /> WhatsApp Packages
            </h5>
            <div className="row g-3">
              {whatsappPackages.length === 0 ? (
                <div className="col-12 text-center text-muted py-3">No WhatsApp packages available.</div>
              ) : whatsappPackages.map(pkg => (
                <div className="col-md-6" key={pkg.id}>
                  <div className="card shadow-sm border-0 rounded-4 h-100">
                    <div className="card-body p-4 text-center">
                      <h5 className="fw-bold text-primary mb-2">{pkg.packageName}</h5>
                      <div className="display-6 fw-bold mb-2">{pkg.credits.toLocaleString()} <span className="fs-6 text-muted fw-normal">Credits</span></div>
                      <h4 className="text-success fw-bold mb-3">₹{pkg.price}</h4>
                      <button className="btn btn-primary w-100 fw-bold rounded-pill" onClick={() => handlePurchase(pkg)}>Buy Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Packages Group */}
          <div>
            <h5 className="fw-bold mb-3 text-secondary border-bottom pb-2">
              <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" /> Email Packages
            </h5>
            <div className="row g-3">
              {emailPackages.length === 0 ? (
                <div className="col-12 text-center text-muted py-3">No Email packages available.</div>
              ) : emailPackages.map(pkg => (
                <div className="col-md-6" key={pkg.id}>
                  <div className="card shadow-sm border-0 rounded-4 h-100">
                    <div className="card-body p-4 text-center">
                      <h5 className="fw-bold text-primary mb-2">{pkg.packageName}</h5>
                      <div className="display-6 fw-bold mb-2">{pkg.credits.toLocaleString()} <span className="fs-6 text-muted fw-normal">Emails</span></div>
                      <h4 className="text-success fw-bold mb-3">₹{pkg.price}</h4>
                      <button className="btn btn-primary w-100 fw-bold rounded-pill" onClick={() => handlePurchase(pkg)}>Buy Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Multi-Step Mock Payment Gateway Modal (Simulating Razorpay) */}
      <Modal show={showMockPayment} onHide={() => !processingMock && setShowMockPayment(false)} centered backdrop="static" size="md">
        <Modal.Header closeButton={!processingMock} className="bg-primary text-white">
          <Modal.Title className="fw-bold fs-5">
            Razorpay Secure Checkout
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 bg-light">
          {mockPaymentData && (
            <div className="d-flex flex-column h-100">
              {/* Common Header */}
              <div className="bg-white p-3 border-bottom text-center shadow-sm">
                <div className="text-muted small mb-1">Payment to Gym SaaS for</div>
                <h6 className="fw-bold text-dark mb-1">{mockPaymentData.packageName}</h6>
                <h3 className="fw-bold text-success mb-0">₹{mockPaymentData.amount}</h3>
              </div>

              <div className="p-4" style={{ minHeight: '350px' }}>
                {/* STEP 1: SELECTION */}
                {mockStep === 'selection' && (
                  <>
                    <h6 className="fw-bold mb-3 text-muted">Select Payment Method</h6>
                    <div className="card shadow-sm border-0 mb-4">
                      <div className="list-group list-group-flush rounded">
                        <label className="list-group-item d-flex align-items-center p-3 cursor-pointer" style={{ cursor: 'pointer' }}>
                          <input className="form-check-input mt-0 me-3" type="radio" name="payMode" checked={selectedPayMode === 'upi'} onChange={() => setSelectedPayMode('upi')} />
                          <div className="flex-grow-1">
                            <span className="fw-bold d-block">Razorpay (UPI)</span>
                            <span className="text-muted small">Pay via Google Pay, PhonePe, Paytm</span>
                          </div>
                          <span className="badge bg-success bg-opacity-10 text-success ms-2">Popular</span>
                        </label>
                        <label className="list-group-item d-flex align-items-center p-3 cursor-pointer" style={{ cursor: 'pointer' }}>
                          <input className="form-check-input mt-0 me-3" type="radio" name="payMode" checked={selectedPayMode === 'card'} onChange={() => setSelectedPayMode('card')} />
                          <div className="flex-grow-1">
                            <span className="fw-bold d-block">Credit / Debit Card</span>
                            <span className="text-muted small">Visa, MasterCard, RuPay</span>
                          </div>
                        </label>
                        <label className="list-group-item d-flex align-items-center p-3 cursor-pointer" style={{ cursor: 'pointer' }}>
                          <input className="form-check-input mt-0 me-3" type="radio" name="payMode" checked={selectedPayMode === 'netbanking'} onChange={() => setSelectedPayMode('netbanking')} />
                          <div className="flex-grow-1">
                            <span className="fw-bold d-block">Net Banking</span>
                            <span className="text-muted small">All Indian banks</span>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary" 
                      className="w-100 fw-bold py-3 fs-6 shadow rounded-3"
                      onClick={() => {
                        if (selectedPayMode === 'upi') setMockStep('upi_processing');
                        if (selectedPayMode === 'card') setMockStep('card_details');
                        if (selectedPayMode === 'netbanking') setMockStep('bank_selection');
                      }}
                    >
                      Proceed to Pay ₹{mockPaymentData.amount}
                    </Button>
                  </>
                )}

                {/* STEP 2A: UPI PROCESSING */}
                {mockStep === 'upi_processing' && (
                  <div className="text-center py-4">
                    <h5 className="fw-bold mb-3">Pay with UPI</h5>
                    <p className="text-muted small mb-4">Enter your UPI ID or scan the QR code to pay.</p>
                    
                    <div className="bg-white p-3 border rounded shadow-sm mb-4 d-inline-block">
                      <div style={{ width: '150px', height: '150px', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span className="text-muted">Dummy QR Code</span>
                      </div>
                    </div>
                    
                    <div className="mb-4 text-start">
                      <label className="form-label fw-bold small">Enter UPI ID</label>
                      <input type="text" className="form-control form-control-lg" placeholder="example@ybl" value={upiId} onChange={e => setUpiId(e.target.value)} />
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="light" className="w-50 fw-bold border" onClick={() => setMockStep('selection')}>Back</Button>
                      <Button variant="success" className="w-50 fw-bold" disabled={processingMock || !upiId} onClick={handleMockPaymentComplete}>
                        {processingMock ? 'Verifying...' : 'Verify & Pay'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2B: CARD DETAILS */}
                {mockStep === 'card_details' && (
                  <div>
                    <h5 className="fw-bold mb-3">Enter Card Details</h5>
                    <div className="mb-3">
                      <label className="form-label fw-bold small">Card Number</label>
                      <input type="text" className="form-control" placeholder="XXXX XXXX XXXX XXXX" value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} maxLength="16" />
                    </div>
                    <div className="row mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold small">Expiry Date</label>
                        <input type="text" className="form-control" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})} maxLength="5" />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold small">CVV</label>
                        <input type="password" className="form-control" placeholder="XXX" value={cardDetails.cvv} onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})} maxLength="3" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold small">Name on Card</label>
                      <input type="text" className="form-control" placeholder="John Doe" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} />
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="light" className="w-50 fw-bold border" onClick={() => setMockStep('selection')}>Back</Button>
                      <Button variant="success" className="w-50 fw-bold" onClick={() => setMockStep('card_otp')}>
                        Proceed to Pay
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3B: CARD OTP */}
                {mockStep === 'card_otp' && (
                  <div className="text-center py-4">
                    <h5 className="fw-bold mb-2">3D Secure Verification</h5>
                    <p className="text-muted small mb-4">An OTP has been sent to your registered mobile number.</p>
                    
                    <div className="mb-4">
                      <input type="text" className="form-control form-control-lg text-center" placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} maxLength="6" style={{ letterSpacing: '5px', fontSize: '24px' }} />
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="light" className="w-50 fw-bold border" onClick={() => setMockStep('card_details')}>Cancel</Button>
                      <Button variant="success" className="w-50 fw-bold" disabled={processingMock || !otp} onClick={handleMockPaymentComplete}>
                        {processingMock ? 'Processing...' : 'Submit OTP'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2C: BANK SELECTION */}
                {mockStep === 'bank_selection' && (
                  <div>
                    <h5 className="fw-bold mb-3">Select your Bank</h5>
                    <div className="row g-2 mb-4">
                      {['HDFC', 'SBI', 'ICICI', 'Axis'].map(bank => (
                        <div className="col-6" key={bank}>
                          <div 
                            className={`border rounded p-3 text-center cursor-pointer ${selectedBank === bank ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedBank(bank)}
                          >
                            <span className="fw-bold">{bank}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-4">
                      <label className="form-label fw-bold small">Other Banks</label>
                      <select className="form-select" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                        <option value="">Select from list...</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="BOB">Bank of Baroda</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                      </select>
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="light" className="w-50 fw-bold border" onClick={() => setMockStep('selection')}>Back</Button>
                      <Button variant="success" className="w-50 fw-bold" disabled={!selectedBank} onClick={() => setMockStep('bank_login')}>
                        Proceed to Login
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3C: BANK LOGIN */}
                {mockStep === 'bank_login' && (
                  <div>
                    <div className="bg-white p-3 border rounded shadow-sm mb-4">
                      <h5 className="fw-bold text-primary mb-3">Welcome to {selectedBank} NetBanking</h5>
                      
                      <div className="mb-3">
                        <label className="form-label fw-bold small">Customer ID / User ID</label>
                        <input type="text" className="form-control" value={bankLogin.customerId} onChange={e => setBankLogin({...bankLogin, customerId: e.target.value})} />
                      </div>
                      
                      <div className="mb-4">
                        <label className="form-label fw-bold small">Password / IPIN</label>
                        <input type="password" className="form-control" value={bankLogin.password} onChange={e => setBankLogin({...bankLogin, password: e.target.value})} />
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="light" className="w-50 fw-bold border" onClick={() => setMockStep('bank_selection')}>Cancel</Button>
                      <Button variant="success" className="w-50 fw-bold" disabled={processingMock || !bankLogin.customerId || !bankLogin.password} onClick={handleMockPaymentComplete}>
                        {processingMock ? 'Authorizing...' : 'Login & Pay'}
                      </Button>
                    </div>
                  </div>
                )}

              </div>
              
              {/* Footer */}
              <div className="bg-light p-3 border-top text-center">
                <div className="text-muted small">
                  <FontAwesomeIcon icon={faCheckCircle} className="me-1 text-success" /> Secured by Razorpay Simulator
                  <br/><span style={{fontSize: '10px'}}>Testing Environment</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

    </div>
  );
};

export default NotificationCredits;
