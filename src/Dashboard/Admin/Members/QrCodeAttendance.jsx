import React, { useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import QRAttendanceSystem from '../../../Components/QRAttendanceSystem';
import AttendanceHistory from '../../../Components/AttendanceHistory';

const QRCodeAttendance = () => {
  const [key, setKey] = useState('scanner');

  return (
    <div className="container-fluid p-3">
      <h2 className="mb-4 text-primary fw-bold">Attendance Management</h2>
      <Tabs
        id="attendance-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-4"
        variant="pills"
      >
        <Tab eventKey="scanner" title="QR Scanner & Today">
          <QRAttendanceSystem />
        </Tab>
        <Tab eventKey="history" title="Attendance History & Export">
          <AttendanceHistory />
        </Tab>
      </Tabs>
    </div>
  );
};

export default QRCodeAttendance;