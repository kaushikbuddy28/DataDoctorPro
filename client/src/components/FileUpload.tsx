import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ProcessingOptions } from '@shared/schema';
import DataTable from './DataTable';

interface FileUploadProps {
  onFileUploaded: (datasetId: number) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    removeOutliers: false,
    fixDataTypes: true,
    standardizeColumnNames: true,
    missingValueStrategy: 'mean',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Check file type
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (!fileType || !['csv', 'xls', 'xlsx'].includes(fileType)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV or Excel file (.csv, .xls, .xlsx)",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(file);
      handleFileUpload(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      setUploadedData(data);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded and is ready for processing.`,
        variant: "default"
      });
      
      if (data.id) {
        onFileUploaded(data.id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOptionsChange = (key: keyof ProcessingOptions, value: any) => {
    setProcessingOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="bg-card" id="file-upload-section">
      <CardHeader>
        <CardTitle>Upload Your Data</CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to get started. We'll automatically clean and process your data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer
            transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-accent/5'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-12 w-12 text-primary mb-4" />
          <p className="text-muted-foreground mb-2">
            {isDragActive
              ? "Drop your file here..."
              : "Drag and drop your file here or click to browse"
            }
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports .CSV, .XLS, and .XLSX files (max 10MB)
          </p>
          <Button disabled={isUploading}>
            {isUploading ? "Uploading..." : "Browse Files"}
          </Button>
          
          {file && (
            <div className="mt-4 flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-foreground">{file.name}</span>
              <span className="text-muted-foreground ml-2">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>
        
        {uploadedData && uploadedData.preview && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Data Preview</h3>
            <DataTable 
              data={uploadedData.preview}
              columns={uploadedData.columns?.map(col => ({ 
                header: col, 
                accessorKey: col 
              })) || []}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Showing {uploadedData.preview.length} of {uploadedData.totalRows} rows
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Advanced Options</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="remove-outliers" 
                checked={processingOptions.removeOutliers}
                onCheckedChange={(checked) => handleOptionsChange('removeOutliers', checked)}
              />
              <Label htmlFor="remove-outliers">Remove outliers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="fix-data-types" 
                checked={processingOptions.fixDataTypes}
                onCheckedChange={(checked) => handleOptionsChange('fixDataTypes', checked)}
              />
              <Label htmlFor="fix-data-types">Fix data types</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="standardize-names" 
                checked={processingOptions.standardizeColumnNames}
                onCheckedChange={(checked) => handleOptionsChange('standardizeColumnNames', checked)}
              />
              <Label htmlFor="standardize-names">Standardize column names</Label>
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="missing-value-strategy" className="block mb-2">
              Missing value strategy
            </Label>
            <Select 
              value={processingOptions.missingValueStrategy}
              onValueChange={(value) => handleOptionsChange('missingValueStrategy', value)}
            >
              <SelectTrigger id="missing-value-strategy" className="w-full sm:w-auto">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Mean replacement</SelectItem>
                <SelectItem value="median">Median replacement</SelectItem>
                <SelectItem value="mode">Mode replacement</SelectItem>
                <SelectItem value="constant">Constant value</SelectItem>
              </SelectContent>
            </Select>
            
            {processingOptions.missingValueStrategy === 'constant' && (
              <div className="mt-2">
                <Label htmlFor="constant-value" className="block mb-1">
                  Constant value
                </Label>
                <input 
                  type="text"
                  id="constant-value"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={processingOptions.constantValue || ''}
                  onChange={(e) => handleOptionsChange('constantValue', e.target.value)}
                  placeholder="Enter value for missing fields"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
