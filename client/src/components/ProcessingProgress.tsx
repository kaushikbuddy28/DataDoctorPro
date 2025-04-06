import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface ProcessingProgressProps {
  fileName: string;
  isProcessing: boolean;
  progress: number;
}

export default function ProcessingProgress({
  fileName,
  isProcessing,
  progress
}: ProcessingProgressProps) {
  // Define processing steps
  const steps = [
    { name: "Removing duplicates", status: progress >= 100 ? "completed" : progress >= 20 ? "completed" : "waiting" },
    { name: "Fixing missing values", status: progress >= 100 ? "completed" : progress >= 40 ? "in-progress" : "waiting" },
    { name: "Standardizing column names", status: progress >= 100 ? "completed" : progress >= 60 ? "in-progress" : "waiting" },
    { name: "Correcting data types", status: progress >= 100 ? "completed" : progress >= 80 ? "in-progress" : "waiting" },
    { name: "Removing outliers", status: progress >= 100 ? "completed" : progress >= 90 ? "in-progress" : "waiting" }
  ];

  return (
    <Card className="bg-card">
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold mb-6">Cleaning Your Data</h2>
        
        <div className="flex flex-col items-center text-center">
          {isProcessing ? (
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full border-8 border-muted animate-spin border-t-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-primary">
                {progress}%
              </div>
            </div>
          ) : (
            <div className="mb-8 text-primary">
              <CheckCircle2 className="w-32 h-32 mx-auto" />
            </div>
          )}
          
          <p className="text-foreground mb-2">
            {isProcessing ? "Processing your data file..." : "Processing complete!"}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {isProcessing 
              ? "This may take a few moments depending on file size" 
              : "Your data has been cleaned and is ready for analysis"
            }
          </p>
          
          <div className="w-full max-w-md">
            {steps.map((step, index) => (
              <div className="mb-4" key={index}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">{step.name}</span>
                  <span className={
                    step.status === "completed" 
                      ? "text-green-500 dark:text-green-400" 
                      : step.status === "in-progress" 
                        ? "text-primary" 
                        : "text-muted-foreground"
                  }>
                    {step.status === "completed" 
                      ? "Completed" 
                      : step.status === "in-progress" 
                        ? "In progress" 
                        : "Waiting"
                    }
                  </span>
                </div>
                <Progress 
                  value={
                    step.status === "completed" 
                      ? 100 
                      : step.status === "in-progress" 
                        ? 50 
                        : 0
                  } 
                  className={
                    step.status === "completed" 
                      ? "bg-green-500 dark:bg-green-400" 
                      : ""
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
