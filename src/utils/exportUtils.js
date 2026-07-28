import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Reusable utility to export an array of data objects to an Excel file.
 * Preserves the exact same behavior as the previous inline implementations.
 * 
 * @param {Array} data - Array of objects to export
 * @param {string} sheetName - Name of the worksheet
 * @param {string} filename - Desired filename without extension
 */
export const exportToExcel = (data, sheetName = "Sheet1", filename = "Export") => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Reusable utility to export an array of data objects to a PDF file.
 * 
 * @param {Array} data - Array of arrays for table rows (or objects, if mapping is provided)
 * @param {Array} columns - Array of string headers
 * @param {string} title - Title to display at the top of the PDF
 * @param {string} filename - Desired filename without extension
 */
export const exportToPDF = (data, columns, title = "Report", filename = "Export") => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }
  
  const doc = new jsPDF();
  doc.text(title, 14, 15);
  
  autoTable(doc, {
    startY: 20,
    head: [columns],
    body: data,
  });
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};
