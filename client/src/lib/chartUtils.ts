import { 
  BarData,
  PieData,
  LineData,
  ScatterData,
  DataTypeDistribution
} from '../types';

// Helper to identify numeric columns
export const getNumericColumns = (data: any[]): string[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return Object.keys(data[0]).filter(key => {
    const sampleValues = data.slice(0, 10).map(row => row[key]);
    return sampleValues.every(val => val === null || val === undefined || val === '' || !isNaN(parseFloat(val)));
  });
};

// Helper to identify categorical columns
export const getCategoricalColumns = (data: any[], maxCategories = 10): string[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const numericColumns = getNumericColumns(data);
  
  return Object.keys(data[0]).filter(key => {
    if (numericColumns.includes(key)) return false;
    
    // Count unique values
    const uniqueValues = new Set(data.map(row => row[key]));
    return uniqueValues.size <= maxCategories;
  });
};

// Prepare histogram data
export const prepareHistogramData = (data: any[], column: string, bins = 10): BarData[] => {
  if (!data || !Array.isArray(data) || data.length === 0 || !column) {
    return [];
  }
  
  // Extract values and filter out non-numbers
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val))
    .sort((a, b) => a - b);
  
  if (values.length === 0) return [];
  
  // Calculate min and max
  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min;
  
  // Create bins
  const binSize = range / bins;
  const histogramData = Array(bins).fill(0).map((_, i) => ({
    name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
    value: 0
  }));
  
  // Count values in each bin
  values.forEach(val => {
    const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
    histogramData[binIndex].value++;
  });
  
  return histogramData;
};

// Prepare bar chart data
export const prepareBarChartData = (data: any[], valueColumn: string, categoryColumn?: string): BarData[] => {
  if (!data || !Array.isArray(data) || data.length === 0 || !valueColumn) {
    return [];
  }
  
  // If no category column provided, try to find one
  const actualCategoryColumn = categoryColumn || getCategoricalColumns(data, 10)[0];
  
  if (!actualCategoryColumn) {
    // If no suitable category column, create a simple value frequency chart
    return getNumericColumns(data).includes(valueColumn)
      ? prepareHistogramData(data, valueColumn)
      : [];
  }
  
  // Group by category
  const groupedData: Record<string, { total: number, count: number }> = {};
  
  data.forEach(row => {
    const category = String(row[actualCategoryColumn] || 'Unknown');
    const value = parseFloat(row[valueColumn]);
    
    if (isNaN(value)) return;
    
    if (!groupedData[category]) {
      groupedData[category] = { total: 0, count: 0 };
    }
    
    groupedData[category].total += value;
    groupedData[category].count++;
  });
  
  // Convert to array and calculate averages
  return Object.entries(groupedData)
    .map(([name, { total, count }]) => ({
      name,
      value: count > 0 ? total / count : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
};

// Prepare pie chart data
export const preparePieChartData = (data: any[], categoryColumn: string): PieData[] => {
  if (!data || !Array.isArray(data) || data.length === 0 || !categoryColumn) {
    return [];
  }
  
  // Count occurrences of each category
  const counts: Record<string, number> = {};
  
  data.forEach(row => {
    const category = String(row[categoryColumn] || 'Unknown');
    counts[category] = (counts[category] || 0) + 1;
  });
  
  // Convert to array and sort by frequency
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

// Prepare correlation scatterplot data
export const prepareScatterData = (data: any[], xColumn: string, yColumn: string): ScatterData[] => {
  if (!data || !Array.isArray(data) || data.length === 0 || !xColumn || !yColumn) {
    return [];
  }
  
  return data
    .filter(row => 
      row[xColumn] !== null && !isNaN(parseFloat(row[xColumn])) &&
      row[yColumn] !== null && !isNaN(parseFloat(row[yColumn]))
    )
    .map(row => ({
      x: parseFloat(row[xColumn]),
      y: parseFloat(row[yColumn]),
      z: 10
    }))
    .slice(0, 50);
};

// Prepare data type distribution for pie chart
export const prepareDataTypeDistribution = (data: any[]): DataTypeDistribution[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  const columns = Object.keys(data[0]);
  const typeCount: Record<string, number> = {};
  
  columns.forEach(col => {
    const sampleValues = data.slice(0, 100).map(row => row[col]);
    let dataType = 'string';
    
    // Check if can be converted to number
    if (sampleValues.every(val => val === null || val === undefined || val === '' || !isNaN(Number(val)))) {
      dataType = sampleValues.some(val => val && val.includes('.')) ? 'numeric' : 'numeric';
    } 
    // Check if it's a date
    else if (sampleValues.every(val => val === null || val === undefined || val === '' || !isNaN(Date.parse(val)))) {
      dataType = 'date';
    }
    // Check if it's boolean
    else if (sampleValues.every(val => val === null || val === undefined || val === '' || ['true', 'false', '0', '1', 'yes', 'no'].includes(String(val).toLowerCase()))) {
      dataType = 'boolean';
    }
    
    typeCount[dataType] = (typeCount[dataType] || 0) + 1;
  });
  
  return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
};
