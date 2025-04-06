import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Convert dataset to CSV and download
export const downloadCSV = (data: any[], filename: string): void => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('No data to download');
    return;
  }
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

// Convert dataset to Excel and download
export const downloadExcel = (data: any[], filename: string): void => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.error('No data to download');
    return;
  }
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Helper to download a chart as an image
export const downloadChartAsPNG = (chartId: string, filename: string): void => {
  const chartElement = document.getElementById(chartId);
  if (!chartElement) {
    console.error(`Chart element with ID ${chartId} not found`);
    return;
  }
  
  // Convert SVG to canvas and download
  // This is a simplified version; in a real app, you'd use a library like dom-to-image or html2canvas
  console.log('Chart download functionality would be implemented here');
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if a file is valid (correct type and size)
export const isValidFile = (file: File, maxSizeMB = 10): { valid: boolean; message?: string } => {
  // Check file type
  const fileType = file.name.split('.').pop()?.toLowerCase();
  if (!fileType || !['csv', 'xls', 'xlsx'].includes(fileType)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Please upload a CSV or Excel file (.csv, .xls, .xlsx)' 
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      message: `File too large. Maximum size is ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
};
