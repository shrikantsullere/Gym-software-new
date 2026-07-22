# Backend Fixes Required

## Critical Backend Security Fixes

Since I only have access to the frontend codebase, these backend fixes must be implemented:

### 1. **QR Code Validation (CRITICAL)**

**Issue:** QR codes are only validated client-side. Backend must validate:
- QR code nonce hasn't been used before (prevent replay attacks)
- QR code hasn't expired
- Member ID matches authenticated user
- QR code structure is valid

**Required Endpoint:**
```
POST /api/memberattendence/checkin
```

**Backend Validation Required:**
```javascript
// Pseudo-code for backend validation
1. Parse QR code JSON from request
2. Check if nonce exists in used_nonces table (prevent replay)
3. Verify expires_at timestamp is in future
4. Verify member_id matches authenticated user
5. Verify purpose === "gym_checkin"
6. Store nonce in used_nonces table with timestamp
7. Create attendance record
8. Return success response
```

**Database Schema Needed:**
```sql
CREATE TABLE used_qr_nonces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nonce VARCHAR(255) UNIQUE NOT NULL,
  member_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_nonce (nonce),
  INDEX idx_member (member_id)
);
```

### 2. **Route Protection Middleware**

**Issue:** Backend must verify JWT tokens and user roles for all protected routes.

**Required Middleware:**
```javascript
// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};
```

**Apply to Routes:**
- All `/admin/*` routes: `authenticateToken, authorizeRole('ADMIN', 'SUPERADMIN')`
- All `/member/*` routes: `authenticateToken, authorizeRole('MEMBER', 'ADMIN')`
- All `/staff/*` routes: `authenticateToken, authorizeRole('ADMIN', 'MANAGER')`

### 3. **Input Validation & Sanitization**

**Issue:** No input validation visible. Backend must validate all inputs.

**Required:**
- Use validation library (e.g., Joi, express-validator)
- Sanitize all user inputs
- Validate email formats, phone numbers, dates
- Prevent SQL injection, XSS attacks

**Example:**
```javascript
const { body, validationResult } = require('express-validator');

const validateCheckIn = [
  body('memberId').isInt().withMessage('Member ID must be an integer'),
  body('branchId').isInt().withMessage('Branch ID must be an integer'),
  body('mode').isIn(['Manual', 'QR Code']).withMessage('Invalid mode'),
  body('notes').optional().isString().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
```

### 4. **Rate Limiting**

**Issue:** No rate limiting on API endpoints.

**Required:**
```javascript
const rateLimit = require('express-rate-limit');

const checkInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many check-in attempts, please try again later'
});

app.post('/api/memberattendence/checkin', checkInLimiter, ...);
```

### 5. **CORS Configuration**

**Issue:** Ensure CORS is properly configured for production.

**Required:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL, // Specific origin in production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 6. **Error Handling**

**Issue:** Standardize error responses.

**Required:**
```javascript
// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### 7. **Logout Endpoint**

**Issue:** Frontend calls `/auth/logout` but endpoint may not exist.

**Required:**
```javascript
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // Optionally blacklist token (if using token blacklisting)
  // Or rely on client-side token removal
  res.json({ success: true, message: 'Logged out successfully' });
});
```

### 8. **Pagination for History Endpoints**

**Issue:** No pagination on attendance history.

**Required:**
```javascript
app.get('/api/memberattendence/:memberId', authenticateToken, async (req, res) => {
  const { memberId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const [attendance, total] = await Promise.all([
    Attendance.findAndCountAll({
      where: { memberId },
      limit,
      offset,
      order: [['checkIn', 'DESC']]
    })
  ]);
  
  res.json({
    success: true,
    attendance: attendance.rows,
    pagination: {
      page,
      limit,
      total: total.count,
      totalPages: Math.ceil(total.count / limit)
    }
  });
});
```

### 9. **Database Indexes**

**Issue:** Ensure proper database indexes for performance.

**Required Indexes:**
```sql
-- Attendance table
CREATE INDEX idx_member_checkin ON member_attendance(memberId, checkIn);
CREATE INDEX idx_branch_checkin ON member_attendance(branchId, checkIn);
CREATE INDEX idx_status ON member_attendance(computedStatus);

-- Users table
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(roleName);

-- QR nonces table (from fix #1)
CREATE INDEX idx_nonce ON used_qr_nonces(nonce);
CREATE INDEX idx_member_nonce ON used_qr_nonces(member_id);
```

### 10. **Environment Variables**

**Issue:** Ensure sensitive data is in environment variables.

**Required:**
```env
# .env file
JWT_SECRET=your-secret-key-here
DATABASE_URL=your-database-url
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
PORT=4000
```

### 11. **API Response Standardization**

**Issue:** Standardize all API responses.

**Required Format:**
```javascript
// Success response
{
  success: true,
  data: { ... },
  message: "Optional success message"
}

// Error response
{
  success: false,
  message: "Error message",
  errors: [] // Optional validation errors
}
```

### 12. **Checkout Endpoint**

**Issue:** Verify checkout endpoint exists and works correctly.

**Required:**
```javascript
app.post('/api/memberattendence/checkout/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { memberId, branchId } = req.body;
  
  // Verify attendance record exists and belongs to member
  const attendance = await Attendance.findOne({
    where: { id, memberId, branchId, checkOut: null }
  });
  
  if (!attendance) {
    return res.status(404).json({ 
      success: false, 
      message: 'Active attendance record not found' 
    });
  }
  
  attendance.checkOut = new Date();
  attendance.computedStatus = 'Completed';
  await attendance.save();
  
  res.json({ success: true, data: attendance });
});
```

---

## Testing Checklist

After implementing these fixes, test:

- [ ] QR code can only be used once
- [ ] Expired QR codes are rejected
- [ ] All routes require authentication
- [ ] Role-based access control works
- [ ] Input validation prevents invalid data
- [ ] Rate limiting prevents abuse
- [ ] Error messages don't leak sensitive info
- [ ] Pagination works on history endpoints
- [ ] Logout endpoint works
- [ ] Checkout endpoint works correctly

---

## Priority Order

1. **CRITICAL (Do First):**
   - QR code nonce validation (#1)
   - Route protection middleware (#2)
   - Input validation (#3)

2. **HIGH PRIORITY:**
   - Rate limiting (#4)
   - Error handling (#5)
   - Logout endpoint (#7)

3. **MEDIUM PRIORITY:**
   - Pagination (#8)
   - Database indexes (#9)
   - Response standardization (#11)

4. **LOW PRIORITY:**
   - CORS configuration (#5)
   - Environment variables (#10)


