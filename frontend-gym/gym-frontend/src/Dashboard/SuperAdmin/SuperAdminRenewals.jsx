import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../Api/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faBan, faDownload, faFilePdf, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SuperAdminRenewals = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [expired, setExpired] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null); // 'upcoming' | 'expired' | null

  const upcomingDropdownRef = useRef(null);
  const expiredDropdownRef = useRef(null);

  useEffect(() => {
    fetchRenewals();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        upcomingDropdownRef.current && !upcomingDropdownRef.current.contains(e.target) &&
        expiredDropdownRef.current && !expiredDropdownRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRenewals = async () => {
    try {
      const res = await axiosInstance.get('/dashboard/renewals');
      if (res.data.success) {
        setUpcoming(res.data.data.upcomingRenewals);
        setExpired(res.data.data.expiredRenewals);
      }
    } catch (err) {
      console.error('Error fetching renewals:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data, filename) => {
    const formattedData = data.map(item => ({
      "Gym Name": item.gymName || 'N/A',
      "Owner Name": item.fullName,
      "Email": item.email,
      "Phone": item.phone || 'N/A',
      "Plan": item.isTrial ? '7-Day Trial' : (item.subscriptionPlan || 'N/A'),
      "Expiry Date": new Date(item.licenseExpiryDate).toLocaleDateString(),
      "Status": item.isTrial ? 'Trial' : 'Paid'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Auto-fit column widths
    const max_width = formattedData.reduce((w, r) => {
      Object.keys(r).forEach((key, i) => {
        const val = r[key] ? r[key].toString() : '';
        w[i] = Math.max(w[i] || 10, val.length, key.length);
      });
      return w;
    }, []);
    worksheet['!cols'] = max_width.map(w => ({ wch: w + 4 })); // Add padding of 4 characters

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Renewals");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setOpenDropdown(null);
  };

  const exportPDF = (data, title, filename) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 26);

    const rows = data.map(item => [
      item.gymName || 'N/A',
      item.fullName || 'N/A',
      item.email || 'N/A',
      item.phone || 'N/A',
      item.isTrial ? '7-Day Trial' : (item.subscriptionPlan || 'N/A'),
      new Date(item.licenseExpiryDate).toLocaleDateString('en-IN')
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Gym Name', 'Owner', 'Email', 'Phone', 'Plan', 'Expiry Date']],
      body: rows,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      styles: { cellPadding: 4, lineWidth: 0.1 },
      margin: { left: 14, right: 14 }
    });

    doc.save(`${filename}.pdf`);
    setOpenDropdown(null);
  };

  // Reusable Export Dropdown
  const ExportDropdown = ({ dropdownKey, data, filename, title, dropdownRef }) => (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#374151',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; }}
      >
        Export
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: '10px', opacity: 0.6, transform: openDropdown === dropdownKey ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {openDropdown === dropdownKey && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: '170px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          <button
            onClick={() => exportCSV(data, filename)}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#374151',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.1s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <FontAwesomeIcon icon={faDownload} style={{ color: '#16a34a', fontSize: '13px' }} />
            Excel / CSV
          </button>
          <div style={{ height: '1px', background: '#f3f4f6', margin: '0 10px' }} />
          <button
            onClick={() => exportPDF(data, title, filename.replace('_', ' '))}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '13px',
              color: '#374151',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.1s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <FontAwesomeIcon icon={faFilePdf} style={{ color: '#dc2626', fontSize: '13px' }} />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );

  if (loading) return null;

  return (
    <div className="mt-4">
      <div className="row g-4">

        {/* Upcoming Renewals */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-warning">
                <FontAwesomeIcon icon={faClock} className="me-2" />
                Upcoming Renewals (30 Days)
              </h5>
              <ExportDropdown
                dropdownKey="upcoming"
                data={upcoming}
                filename="Upcoming_Renewals"
                title="Upcoming Renewals (30 Days)"
                dropdownRef={upcomingDropdownRef}
              />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light text-muted sticky-top">
                    <tr>
                      <th className="px-4 py-3">Gym</th>
                      <th>Owner</th>
                      <th>Expiry</th>
                      <th>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">No upcoming renewals in next 30 days.</td></tr>
                    ) : upcoming.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 fw-bold text-dark">{u.gymName || 'N/A'}</td>
                        <td>
                          <div>{u.fullName}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{u.phone}</div>
                        </td>
                        <td className="text-warning fw-bold">{new Date(u.licenseExpiryDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${u.isTrial ? 'bg-success bg-opacity-10 text-success' : 'bg-primary bg-opacity-10 text-primary'}`}>
                            {u.isTrial ? '7-Day Trial' : (u.subscriptionPlan || 'N/A')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Expired / Inactive */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-danger">
                <FontAwesomeIcon icon={faBan} className="me-2" />
                Expired / Inactive Subscriptions
              </h5>
              <ExportDropdown
                dropdownKey="expired"
                data={expired}
                filename="Expired_Renewals"
                title="Expired / Inactive Subscriptions"
                dropdownRef={expiredDropdownRef}
              />
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="table table-hover mb-0 align-middle">
                  <thead className="bg-light text-muted sticky-top">
                    <tr>
                      <th className="px-4 py-3">Gym</th>
                      <th>Owner</th>
                      <th>Expired On</th>
                      <th>Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expired.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-4 text-muted">No expired subscriptions.</td></tr>
                    ) : expired.map(e => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 fw-bold text-dark">{e.gymName || 'N/A'}</td>
                        <td>
                          <div>{e.fullName}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>{e.phone}</div>
                        </td>
                        <td className="text-danger fw-bold">{new Date(e.licenseExpiryDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${e.isTrial ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'}`}>
                            {e.isTrial ? '7-Day Trial' : (e.subscriptionPlan || 'N/A')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminRenewals;
