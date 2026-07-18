import React from 'react';

const GeneralTrainerShiftView = () => {
  const shifts = [
    { id: 1, staffId: 1, date: "2023-10-15", startTime: "09:00", endTime: "17:00", type: "Morning", branch: "Main Branch", status: "Approved" },
    { id: 2, staffId: 2, date: "2023-10-15", startTime: "12:00", endTime: "20:00", type: "Evening", branch: "Downtown Branch", status: "Pending" },
    { id: 3, staffId: 3, date: "2023-10-16", startTime: "14:00", endTime: "22:00", type: "Evening", branch: "Main Branch", status: "Approved" },
    { id: 4, staffId: 4, date: "2023-10-16", startTime: "22:00", endTime: "06:00", type: "Night", branch: "West Branch", status: "Approved" },
    { id: 5, staffId: 5, date: "2023-10-17", startTime: "06:00", endTime: "14:00", type: "Morning", branch: "Downtown Branch", status: "Pending" }
  ];

  const currentUserId = 1; // John Doe (General Trainer)

  const getShiftColor = (type) => {
    switch (type) {
      case 'Morning': return 'warning';
      case 'Evening': return 'info';
      case 'Night': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const myShifts = shifts.filter(s => s.staffId === currentUserId);

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Staff Management</h2>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Duty Roster</h3>
      </div>
      <div className="table-responsive mb-4">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Shift Type</th>
              <th>Branch</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myShifts.length > 0 ? (
              myShifts.map(shift => (
                <tr key={shift.id}>
                  <td>{shift.date}</td>
                  <td>{shift.startTime}</td>
                  <td>{shift.endTime}</td>
                  <td><span className={`badge bg-${getShiftColor(shift.type)}`}>{shift.type}</span></td>
                  <td>{shift.branch}</td>
                  <td><span className={`badge bg-${getStatusClass(shift.status)}`}>{shift.status}</span></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center text-muted">No shifts assigned.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralTrainerShiftView;