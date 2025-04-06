import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { 
  insertDatasetSchema, 
  processingOptionsSchema,
  updateDatasetSchema, 
  saveProjectSchema 
} from "@shared/schema";
import * as z from "zod";
import { fromZodError } from "zod-validation-error";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      
      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  fileFilter: function (req, file, cb) {
    const allowedExtensions = [".csv", ".xls", ".xlsx"];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .csv, .xls, and .xlsx files are allowed"));
      return;
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Helper function to read different file types
async function readFileData(filePath: string, fileType: string) {
  try {
    if (fileType === "csv") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      });
    } else {
      // For Excel files
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet);
    }
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
}

// Helper function to clean data
function cleanData(rawData: any[], options: z.infer<typeof processingOptionsSchema>) {
  if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
    throw new Error("Invalid data format");
  }

  const stats = {
    totalRows: rawData.length,
    totalColumns: Object.keys(rawData[0]).length,
    duplicatesRemoved: 0,
    nullValuesFixed: 0,
    columnsRenamed: [] as { original: string, cleaned: string, type: string }[],
    dataTypeSummary: {} as Record<string, number>,
    outlierCount: 0,
  };

  // Step 1: Standardize column names if enabled
  let data = [...rawData];
  let columnMapping = {};

  if (options.standardizeColumnNames) {
    const originalColumns = Object.keys(data[0]);
    
    columnMapping = originalColumns.reduce((acc, col) => {
      // Convert to lowercase, replace spaces with underscores, remove special chars
      const cleanedCol = col.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, "");
      
      // Infer data type
      const sampleValues = data.slice(0, 100).map(row => row[col]);
      let dataType = "string";
      
      // Check if can be converted to number
      if (sampleValues.every(val => val === null || val === undefined || val === "" || !isNaN(Number(val)))) {
        dataType = sampleValues.some(val => val && val.includes(".")) ? "float" : "integer";
      } 
      // Check if it's a date
      else if (sampleValues.every(val => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)))) {
        dataType = "date";
      }
      
      stats.columnsRenamed.push({
        original: col,
        cleaned: cleanedCol,
        type: dataType
      });
      
      // Track data type counts
      stats.dataTypeSummary[dataType] = (stats.dataTypeSummary[dataType] || 0) + 1;
      
      return { ...acc, [col]: cleanedCol };
    }, {});
    
    // Rename columns in data
    data = data.map(row => {
      const newRow = {};
      for (const [originalCol, cleanedCol] of Object.entries(columnMapping)) {
        newRow[cleanedCol] = row[originalCol];
      }
      return newRow;
    });
  }
  
  // Step 2: Remove duplicates
  const uniqueRows = new Set();
  const dedupedData = data.filter(row => {
    const rowStr = JSON.stringify(row);
    if (uniqueRows.has(rowStr)) {
      stats.duplicatesRemoved++;
      return false;
    }
    uniqueRows.add(rowStr);
    return true;
  });
  
  stats.duplicatesRemoved = data.length - dedupedData.length;
  data = dedupedData;
  
  // Step 3: Fix missing values if enabled
  if (options.missingValueStrategy !== "constant" || options.constantValue !== undefined) {
    const columns = Object.keys(data[0]);
    
    columns.forEach(col => {
      // Get all non-null values for the column
      const values = data
        .map(row => row[col])
        .filter(val => val !== null && val !== undefined && val !== "");
      
      // Skip if no missing values
      const missingCount = data.filter(row => 
        row[col] === null || row[col] === undefined || row[col] === ""
      ).length;
      
      if (missingCount === 0) return;
      
      // Calculate replacement value based on strategy
      let replacementValue;
      
      if (options.missingValueStrategy === "constant") {
        replacementValue = options.constantValue || "";
      } else {
        // For numeric columns
        const numericValues = values
          .map(v => parseFloat(v))
          .filter(v => !isNaN(v));
        
        if (numericValues.length > 0) {
          if (options.missingValueStrategy === "mean") {
            replacementValue = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
          } else if (options.missingValueStrategy === "median") {
            const sorted = [...numericValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            replacementValue = sorted.length % 2 === 0 
              ? (sorted[mid - 1] + sorted[mid]) / 2 
              : sorted[mid];
          } else if (options.missingValueStrategy === "mode") {
            // Find most common value
            const counts = numericValues.reduce((acc, val) => {
              acc[val] = (acc[val] || 0) + 1;
              return acc;
            }, {});
            replacementValue = Object.entries(counts)
              .sort((a, b) => b[1] - a[1])[0][0];
          }
        } else {
          // For non-numeric columns, use mode
          const counts = values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          }, {});
          replacementValue = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0][0];
        }
      }
      
      // Replace missing values
      data = data.map(row => {
        if (row[col] === null || row[col] === undefined || row[col] === "") {
          stats.nullValuesFixed++;
          return { ...row, [col]: replacementValue };
        }
        return row;
      });
    });
  }
  
  // Step 4: Handle outliers if enabled
  if (options.removeOutliers) {
    const columns = Object.keys(data[0]);
    
    // Only process numeric columns
    columns.forEach(col => {
      const numericValues = data
        .map(row => parseFloat(row[col]))
        .filter(v => !isNaN(v));
      
      if (numericValues.length === 0) return;
      
      // Calculate quartiles for IQR method
      const sorted = [...numericValues].sort((a, b) => a - b);
      const q1Idx = Math.floor(sorted.length * 0.25);
      const q3Idx = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Idx];
      const q3 = sorted[q3Idx];
      const iqr = q3 - q1;
      
      // Define outlier bounds
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      // Filter outliers
      const filteredData = data.filter(row => {
        const val = parseFloat(row[col]);
        if (isNaN(val)) return true;
        
        if (val < lowerBound || val > upperBound) {
          stats.outlierCount++;
          return false;
        }
        return true;
      });
      
      if (filteredData.length < data.length) {
        data = filteredData;
      }
    });
  }
  
  // Step 5: Fix data types if enabled
  if (options.fixDataTypes) {
    const columns = Object.keys(data[0]);
    
    data = data.map(row => {
      const newRow = { ...row };
      
      columns.forEach(col => {
        const columnInfo = stats.columnsRenamed.find(c => c.cleaned === col);
        if (!columnInfo) return;
        
        const value = row[col];
        if (value === null || value === undefined || value === "") return;
        
        // Convert to appropriate type
        if (columnInfo.type === "integer") {
          newRow[col] = parseInt(value);
        } else if (columnInfo.type === "float") {
          newRow[col] = parseFloat(value);
        } else if (columnInfo.type === "date") {
          try {
            newRow[col] = new Date(value).toISOString().split('T')[0];
          } catch (e) {
            // Keep as is if date conversion fails
          }
        }
      });
      
      return newRow;
    });
  }
  
  // Return cleaned data and stats
  return {
    cleanedData: data,
    stats
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API to upload a file
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const file = req.file;
      const fileType = path.extname(file.originalname).toLowerCase().substring(1);
      
      // Read file data
      const rawData = await readFileData(file.path, fileType);
      
      // Create dataset record
      const datasetData = {
        userId: 1, // Hardcoded for now, would come from auth in a real app
        fileName: file.filename,
        originalFileName: file.originalname,
        fileSizeBytes: file.size,
        fileType,
        createdAt: new Date().toISOString(),
        rawData: rawData,
      };
      
      // Validate dataset data
      const validatedData = insertDatasetSchema.parse(datasetData);
      
      // Store in database
      const dataset = await storage.createDataset(validatedData);
      
      res.status(201).json({
        id: dataset.id,
        fileName: dataset.originalFileName,
        fileSize: dataset.fileSizeBytes,
        fileType: dataset.fileType,
        preview: Array.isArray(rawData) ? rawData.slice(0, 5) : [],
        columns: Array.isArray(rawData) && rawData.length > 0 ? Object.keys(rawData[0]) : [],
        totalRows: Array.isArray(rawData) ? rawData.length : 0
      });
      
      // Delete the file after processing
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data format", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  // API to process a dataset
  app.post('/api/process/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const datasetId = parseInt(id);
      
      // Validate processing options
      const options = processingOptionsSchema.parse(req.body);
      
      // Get dataset
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      // Process data
      const { cleanedData, stats } = cleanData(dataset.rawData, options);
      
      // Update dataset
      const updatedDataset = await storage.updateDataset(datasetId, {
        cleanedData,
        cleaningStats: stats,
        isProcessed: true
      });
      
      res.json({
        id: datasetId,
        stats,
        preview: cleanedData.slice(0, 5),
        isProcessed: true
      });
    } catch (error) {
      console.error("Processing error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid options", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to process dataset" });
    }
  });

  // API to get a dataset
  app.get('/api/datasets/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const datasetId = parseInt(id);
      
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      res.json({
        id: dataset.id,
        fileName: dataset.originalFileName,
        fileSize: dataset.fileSizeBytes,
        fileType: dataset.fileType,
        createdAt: dataset.createdAt,
        isProcessed: dataset.isProcessed,
        savedProjectName: dataset.savedProjectName,
        rawPreview: dataset.rawData.slice(0, 100),
        cleanedPreview: dataset.cleanedData ? dataset.cleanedData.slice(0, 100) : null,
        stats: dataset.cleaningStats
      });
    } catch (error) {
      console.error("Error fetching dataset:", error);
      res.status(500).json({ message: "Failed to retrieve dataset" });
    }
  });

  // API to list datasets
  app.get('/api/datasets', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Hardcoded for now
      
      const datasets = await storage.getDatasetsByUserId(userId);
      
      res.json(datasets.map(d => ({
        id: d.id,
        fileName: d.originalFileName,
        fileSize: d.fileSizeBytes,
        fileType: d.fileType,
        createdAt: d.createdAt,
        isProcessed: d.isProcessed,
        savedProjectName: d.savedProjectName
      })));
    } catch (error) {
      console.error("Error listing datasets:", error);
      res.status(500).json({ message: "Failed to list datasets" });
    }
  });

  // API to save project name
  app.post('/api/save-project', async (req: Request, res: Response) => {
    try {
      const { datasetId, projectName } = saveProjectSchema.parse(req.body);
      
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      const updatedDataset = await storage.updateDataset(datasetId, {
        savedProjectName: projectName
      });
      
      res.json({
        id: datasetId,
        savedProjectName: projectName
      });
    } catch (error) {
      console.error("Error saving project:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: fromZodError(error).message });
      }
      
      res.status(500).json({ message: "Failed to save project" });
    }
  });

  // API to download cleaned data
  app.get('/api/datasets/:id/download/:format', async (req: Request, res: Response) => {
    try {
      const { id, format } = req.params;
      const datasetId = parseInt(id);
      
      if (!['csv', 'xlsx'].includes(format)) {
        return res.status(400).json({ message: "Invalid format. Use 'csv' or 'xlsx'" });
      }
      
      // Get dataset
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      if (!dataset.isProcessed || !dataset.cleanedData) {
        return res.status(400).json({ message: "Dataset has not been processed yet" });
      }
      
      // Format output filename
      const filename = `${dataset.originalFileName.split('.')[0]}_cleaned.${format}`;
      
      if (format === 'csv') {
        const csv = Papa.unparse(dataset.cleanedData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csv);
      } else {
        // Excel format
        const worksheet = XLSX.utils.json_to_sheet(dataset.cleanedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Data");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(Buffer.from(excelBuffer));
      }
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download dataset" });
    }
  });

  // API to generate summary report PDF
  app.get('/api/datasets/:id/report', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const datasetId = parseInt(id);
      
      // Get dataset
      const dataset = await storage.getDataset(datasetId);
      if (!dataset) {
        return res.status(404).json({ message: "Dataset not found" });
      }
      
      if (!dataset.isProcessed || !dataset.cleaningStats) {
        return res.status(400).json({ message: "Dataset has not been processed yet" });
      }
      
      // In a real app, we would generate a PDF here
      // For now, just return the stats as JSON
      res.json({
        fileName: dataset.originalFileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSizeBytes,
        createdAt: dataset.createdAt,
        stats: dataset.cleaningStats
      });
    } catch (error) {
      console.error("Report error:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  return httpServer;
}
