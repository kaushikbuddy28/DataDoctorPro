// Chart Data Types
export interface BarData {
  name: string;
  value: number;
}

export interface PieData {
  name: string;
  value: number;
}

export interface LineData {
  name: string;
  value: number;
}

export interface ScatterData {
  x: number;
  y: number;
  z?: number;
}

export interface DataTypeDistribution {
  name: string;
  value: number;
}

// Dataset Types
export interface DatasetPreview {
  id: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  totalRows: number;
  columns: string[];
  preview: any[];
}

export interface ProcessedDataset extends DatasetPreview {
  isProcessed: boolean;
  stats: DatasetStats;
  rawPreview: any[];
  cleanedPreview: any[] | null;
  createdAt: string;
  savedProjectName?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface DatasetStats {
  totalRows: number;
  totalColumns: number;
  duplicatesRemoved: number;
  nullValuesFixed: number;
  columnsRenamed: { original: string; cleaned: string; type: string }[];
  dataTypeSummary: Record<string, number>;
  outlierCount: number;
}

// Processing Options
export interface ProcessingOptions {
  removeOutliers: boolean;
  fixDataTypes: boolean;
  standardizeColumnNames: boolean;
  missingValueStrategy: 'mean' | 'median' | 'mode' | 'constant';
  constantValue?: string;
}