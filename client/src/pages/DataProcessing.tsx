import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from "@/components/StepIndicator";
import ProcessingProgress from "@/components/ProcessingProgress";

interface ProcessingParams {
  id: string;
}

export default function DataProcessing() {
  const { id } = useParams<ProcessingParams>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [processingStarted, setProcessingStarted] = useState(false);

  // Get dataset details
  const { data: dataset, isLoading, isError } = useQuery({
    queryKey: [`/api/datasets/${id}`],
    enabled: !!id,
  });

  // Process dataset mutation
  const processMutation = useMutation({
    mutationFn: async (options: any) => {
      return apiRequest('POST', `/api/process/${id}`, options);
    },
    onSuccess: async (res) => {
      const data = await res.json();
      // Invalidate dataset query to refetch with processed data
      queryClient.invalidateQueries({ queryKey: [`/api/datasets/${id}`] });
      
      // Redirect to dashboard on completion
      setTimeout(() => {
        setLocation(`/dashboard/${id}`);
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process data",
        variant: "destructive",
      });
    }
  });

  // Start processing when component loads
  useEffect(() => {
    if (dataset && !processingStarted && !dataset.isProcessed) {
      setProcessingStarted(true);
      // Get processing options from localStorage if available
      const savedOptions = localStorage.getItem("processingOptions");
      const options = savedOptions ? JSON.parse(savedOptions) : {
        removeOutliers: false,
        fixDataTypes: true,
        standardizeColumnNames: true,
        missingValueStrategy: "mean",
      };
      
      // Start processing with a slight delay to show the progress UI
      setTimeout(() => {
        processMutation.mutate(options);
      }, 1000);
    } else if (dataset && dataset.isProcessed) {
      // If dataset is already processed, redirect to dashboard
      setLocation(`/dashboard/${id}`);
    }
  }, [dataset, processingStarted, id]);

  // If dataset is already processed, redirect to dashboard
  if (dataset?.isProcessed) {
    return null;
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-red-500 mb-2">Error Loading Dataset</h2>
        <p className="text-muted-foreground mb-4">
          We couldn't load the dataset. It may have been deleted or there was a server error.
        </p>
        <button 
          onClick={() => setLocation("/")}
          className="text-primary hover:underline"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Steps Indicator */}
      <StepIndicator 
        steps={["Upload Data", "Cleaning", "Analyze", "Download"]} 
        currentStep={1} 
      />

      {/* Processing Progress */}
      <ProcessingProgress 
        fileName={dataset?.fileName || "data file"}
        isProcessing={processMutation.isPending}
        progress={processMutation.isPending ? 42 : 100} // Mock progress value
      />
    </div>
  );
}
