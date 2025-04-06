import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Function to read different file types
export const readFileData = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'csv') {
      // Handle CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      // Handle Excel
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

// Function to get basic file stats
export const getFileStats = (data: any[]): any => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      totalRows: 0,
      totalColumns: 0,
      columnNames: [],
      dataTypes: {}
    };
  }

  const columnNames = Object.keys(data[0]);
  
  // Determine likely data types
  const dataTypes = columnNames.reduce((acc, colName) => {
    const sampleValues = data.slice(0, 100).map(row => row[colName]);
    let dataType = 'string';
    
    // Check if can be converted to number
    if (sampleValues.every(val => val === null || val === undefined || val === '' || !isNaN(Number(val)))) {
      dataType = sampleValues.some(val => val && val.includes('.')) ? 'float' : 'integer';
    } 
    // Check if it's a date
    else if (sampleValues.every(val => val === null || val === undefined || val === '' || !isNaN(Date.parse(val)))) {
      dataType = 'date';
    }
    
    acc[colName] = dataType;
    return acc;
  }, {});

  return {
    totalRows: data.length,
    totalColumns: columnNames.length,
    columnNames,
    dataTypes
  };
};

// Count null values in dataset
export const countNullValues = (data: any[]): Record<string, number> => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {};
  }

  const columnNames = Object.keys(data[0]);
  
  return columnNames.reduce((acc, colName) => {
    const nullCount = data.filter(row => 
      row[colName] === null || row[colName] === undefined || row[colName] === ''
    ).length;
    
    acc[colName] = nullCount;
    return acc;
  }, {});
};

// Function to check for duplicate rows
export const findDuplicates = (data: any[]): any[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const uniqueRows = new Set();
  const duplicates = [];
  
  for (const row of data) {
    const rowStr = JSON.stringify(row);
    if (uniqueRows.has(rowStr)) {
      duplicates.push(row);
    } else {
      uniqueRows.add(rowStr);
    }
  }
  
  return duplicates;
};
