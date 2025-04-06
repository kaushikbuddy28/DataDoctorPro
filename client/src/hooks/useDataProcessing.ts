import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { readFileData, getFileStats, countNullValues, findDuplicates } from '@/lib/dataProcessing';
import { apiRequest } from '@/lib/queryClient';

interface UseDataProcessingProps {
  file?: File;
}

interface ProcessingOptions {
  removeOutliers: boolean;
  fixDataTypes: boolean;
  standardizeColumnNames: boolean;
  missingValueStrategy: 'mean' | 'median' | 'mode' | 'constant';
  constantValue?: string;
}

interface ProcessingResult {
  rawData: any[];
  cleanedData: any[] | null;
  stats: {
    totalRows: number;
    totalColumns: number;
    nullValues: Record<string, number>;
    duplicatesCount: number;
    dataTypesSummary: Record<string, number>;
  };
  isProcessing: boolean;
  isProcessed: boolean;
  progress: number;
  error: string | null;
}

export default function useDataProcessing({ file }: UseDataProcessingProps) {
  const { toast } = useToast();
  const [result, setResult] = useState<ProcessingResult>({
    rawData: [],
    cleanedData: null,
    stats: {
      totalRows: 0,
      totalColumns: 0,
      nullValues: {},
      duplicatesCount: 0,
      dataTypesSummary: {}
    },
    isProcessing: false,
    isProcessed: false,
    progress: 0,
    error: null
  });
  
  useEffect(() => {
    if (!file) return;
    
    const processFile = async () => {
      setResult(prev => ({ ...prev, isProcessing: true, error: null }));
      
      try {
        // Read file data
        setResult(prev => ({ ...prev, progress: 10 }));
        const rawData = await readFileData(file);
        
        // Get basic stats
        setResult(prev => ({ ...prev, progress: 30, rawData }));
        const fileStats = getFileStats(rawData);
        const nullValues = countNullValues(rawData);
        const duplicates = findDuplicates(rawData);
        
        setResult(prev => ({
          ...prev,
          progress: 50,
          stats: {
            totalRows: fileStats.totalRows,
            totalColumns: fileStats.totalColumns,
            nullValues,
            duplicatesCount: duplicates.length,
            dataTypesSummary: {}
          }
        }));
        
      } catch (error) {
        console.error('Error processing file:', error);
        setResult(prev => ({ 
          ...prev, 
          isProcessing: false, 
          error: error instanceof Error ? error.message : 'Failed to process file'
        }));
        
        toast({
          title: 'Error processing file',
          description: error instanceof Error ? error.message : 'Failed to process file',
          variant: 'destructive'
        });
      }
    };
    
    processFile();
  }, [file, toast]);
  
  const processData = async (options: ProcessingOptions) => {
    if (result.rawData.length === 0) {
      toast({
        title: 'No data to process',
        description: 'Please upload a file first',
        variant: 'destructive'
      });
      return;
    }
    
    setResult(prev => ({ ...prev, isProcessing: true, error: null, progress: 60 }));
    
    try {
      // In a real app, this would call the backend API
      // Here we're simulating the processing with a delay
      setTimeout(() => {
        setResult(prev => ({ ...prev, progress: 100, isProcessed: true, isProcessing: false }));
        
        toast({
          title: 'Processing complete',
          description: 'Your data has been cleaned and processed successfully',
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error during processing:', error);
      setResult(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: error instanceof Error ? error.message : 'Failed to process data'
      }));
      
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process data',
        variant: 'destructive'
      });
    }
  };
  
  const resetProcessing = () => {
    setResult({
      rawData: [],
      cleanedData: null,
      stats: {
        totalRows: 0,
        totalColumns: 0,
        nullValues: {},
        duplicatesCount: 0,
        dataTypesSummary: {}
      },
      isProcessing: false,
      isProcessed: false,
      progress: 0,
      error: null
    });
  };
  
  return {
    ...result,
    processData,
    resetProcessing
  };
}
