import React from 'react';

/**
 * Component to display multiple plans for a member
 * Shows all assigned plans with their status, dates, and remaining days
 */
const MemberPlansDisplay = ({ plans, compact = false }) => {
  if (!plans || plans.length === 0) {
    return (
      <div className="text-muted">
        <small>No plans assigned</small>
      </div>
    );
  }

  // Compact view - just show plan names
  if (compact) {
    return (
      <div className="d-flex flex-wrap gap-1">
        {plans.map((plan, index) => (
          <span
            key={plan.assignmentId || index}
            className={`badge ${
              plan.computedStatus === 'Active' ? 'bg-success' : 
              plan.computedStatus === 'Expired' ? 'bg-danger' : 
              'bg-secondary'
            }`}
            style={{ fontSize: '0.75rem' }}
          >
            {plan.planName || `Plan ${plan.planId}`}
          </span>
        ))}
      </div>
    );
  }

  // Full view - show detailed plan information
  return (
    <div className="member-plans-list">
      {plans.map((plan, index) => (
        <div
          key={plan.assignmentId || index}
          className="card mb-2"
          style={{
            borderLeft: `4px solid ${
              plan.computedStatus === 'Active' ? '#28a745' :
              plan.computedStatus === 'Expired' ? '#dc3545' :
              '#6c757d'
            }`
          }}
        >
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-0 fw-bold">
                {plan.planName || `Plan ${plan.planId}`}
              </h6>
              <span
                className={`badge ${
                  plan.computedStatus === 'Active' ? 'bg-success' :
                  plan.computedStatus === 'Expired' ? 'bg-danger' :
                  'bg-secondary'
                }`}
              >
                {plan.computedStatus}
              </span>
            </div>

            <div className="row g-2">
              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Type</small>
                <small className="fw-semibold">{plan.planType || 'N/A'}</small>
              </div>

              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Start Date</small>
                <small className="fw-semibold">
                  {plan.membershipFrom
                    ? new Date(plan.membershipFrom).toLocaleDateString()
                    : 'N/A'}
                </small>
              </div>

              <div className="col-6 col-md-3">
                <small className="text-muted d-block">End Date</small>
                <small className="fw-semibold">
                  {plan.membershipTo
                    ? new Date(plan.membershipTo).toLocaleDateString()
                    : 'N/A'}
                </small>
              </div>

              <div className="col-6 col-md-3">
                <small className="text-muted d-block">Remaining</small>
                <small className={`fw-semibold ${
                  plan.remainingDays > 30 ? 'text-success' :
                  plan.remainingDays > 0 ? 'text-warning' :
                  'text-danger'
                }`}>
                  {plan.remainingDays > 0 ? `${plan.remainingDays} days` : 'Expired'}
                </small>
              </div>
            </div>

            {plan.amountPaid && (
              <div className="mt-2 pt-2 border-top">
                <small className="text-muted">
                  Payment: <span className="fw-semibold">₹{plan.amountPaid}</span>
                  {plan.paymentMode && ` (${plan.paymentMode})`}
                </small>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="mt-2">
        <small className="text-muted">
          Total Plans: <strong>{plans.length}</strong> | 
          Active: <strong className="text-success">
            {plans.filter(p => p.computedStatus === 'Active').length}
          </strong> | 
          Expired: <strong className="text-danger">
            {plans.filter(p => p.computedStatus === 'Expired').length}
          </strong>
        </small>
      </div>
    </div>
  );
};

export default MemberPlansDisplay;

