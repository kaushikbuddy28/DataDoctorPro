import { useState } from "react";
import { useLocation } from "wouter";
import FileUpload from "@/components/FileUpload";
import StepIndicator from "@/components/StepIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Database, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const [uploadedDatasetId, setUploadedDatasetId] = useState<number | null>(null);

  const handleFileUploaded = (datasetId: number) => {
    setUploadedDatasetId(datasetId);
    // Wait a bit before redirecting to allow the user to see the success message
    setTimeout(() => {
      setLocation(`/process/${datasetId}`);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Steps Indicator */}
      <StepIndicator 
        steps={["Upload Data", "Cleaning", "Analyze", "Download"]} 
        currentStep={0} 
      />

      {/* Main Content */}
      <div className="space-y-8">
        {/* File Upload Component */}
        <FileUpload onFileUploaded={handleFileUploaded} />

        {/* Intro Card */}
        <Card className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Clean, Analyze, Visualize</h2>
                <p className="mb-4 text-primary-foreground/90">
                  Upload your data file to get started. Our system will automatically clean, process, and visualize your dataset.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle2 className="text-secondary mr-2 h-5 w-5" />
                    <span>Automatic data cleaning and processing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="text-secondary mr-2 h-5 w-5" />
                    <span>Smart visualization generation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="text-secondary mr-2 h-5 w-5" />
                    <span>Detailed before/after comparisons</span>
                  </li>
                </ul>
              </div>
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-secondary-foreground font-semibold shadow-md"
                onClick={() => {
                  const fileUploadSection = document.getElementById("file-upload-section");
                  if (fileUploadSection) {
                    fileUploadSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Upload Your Data <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 text-primary">
                <Database className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Automatic Data Cleaning</h3>
              <p className="text-muted-foreground">
                Our system automatically handles duplicates, missing values, and standardizes column names for consistency.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 text-primary">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 18L12 22L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 9L7 5L11 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 9L17 5L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                View comprehensive statistics about your data including row counts, null values, and data type distributions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-4 text-primary">
                <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 15L8 9L12 11L16 6L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Visualizations</h3>
              <p className="text-muted-foreground">
                Automatic chart generation based on your data types, including histograms, bar charts, and correlation heatmaps.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
