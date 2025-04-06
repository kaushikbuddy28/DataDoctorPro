import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import DataTable from "@/components/DataTable";
import SummaryReport from "@/components/SummaryReport";
import DataVisualizations from "@/components/DataVisualizations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DownloadCard from "@/components/ui/DownloadCard";
import { downloadReport } from "@/lib/reportGenerator";
import type { ProcessedDataset } from "../types";
import {
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Save,
  Download,
} from "lucide-react";

interface DashboardParams {
  id: string;
}

export default function Dashboard() {
  const { id } = useParams<DashboardParams>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [activeTab, setActiveTab] = useState("raw");
  const [isSaving, setIsSaving] = useState(false);

  // Get dataset
  const { data, isLoading, isError } = useQuery<ProcessedDataset>({
    queryKey: [`/api/datasets/${id}`],
    enabled: !!id,
  });

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiRequest("POST", "/api/save-project", {
        datasetId: parseInt(id),
        projectName: projectName.trim(),
      });

      if (res.ok) {
        toast({
          title: "Project saved",
          description: "Your project has been saved successfully",
        });
      } else {
        throw new Error("Failed to save project");
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (format: "csv" | "xlsx") => {
    try {
      // Trigger file download
      window.location.href = `/api/datasets/${id}/download/${format}`;
    } catch (error) {
      toast({
        title: "Download failed",
        description:
          error instanceof Error ? error.message : "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadReport = async () => {
    try {
      if (!data) {
        throw new Error("Dataset not available");
      }
      
      // Download the report using the client-side report generator
      await downloadReport(data);
      toast({
        title: "Report generated",
        description: "Your report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive mb-2">
          Error Loading Dataset
        </h2>
        <p className="text-muted-foreground mb-4">
          We couldn't load the dataset. It may have been deleted or there was a
          server error.
        </p>
        <Button onClick={() => setLocation("/")}>Return to Home</Button>
      </div>
    );
  }

  // Create column definitions from data
  const createColumns = (data, prefix = "") => {
    if (!data || !data.length) return [];
    
    return Object.keys(data[0]).map(key => ({
      header: key,
      accessorKey: prefix ? `${prefix}.${key}` : key
    }));
  };

  // Setup data for tables
  const rawColumns = createColumns(data.rawPreview);
  const cleanedColumns = createColumns(data.cleanedPreview);

  return (
    <div className="space-y-8">
      {/* Steps Indicator */}
      <StepIndicator
        steps={["Upload Data", "Cleaning", "Analyze", "Download"]}
        currentStep={data.isProcessed ? 3 : 2}
      />

      {/* Data Preview and Comparison */}
      <Card>
        <Tabs
          defaultValue="raw"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <CardHeader className="border-b border-border">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
              <TabsTrigger value="cleaned">Cleaned Data</TabsTrigger>
              <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Data Preview{" "}
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  {data.fileName} ({(data.fileSize / 1024).toFixed(1)} KB)
                </span>
              </h2>
            </div>

            <TabsContent value="raw" className="mt-0">
              <DataTable data={data.rawPreview || []} columns={rawColumns} />
            </TabsContent>

            <TabsContent value="cleaned" className="mt-0">
              {data.cleanedPreview ? (
                <DataTable 
                  data={data.cleanedPreview || []} 
                  columns={cleanedColumns} 
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No cleaned data available yet
                </div>
              )}
            </TabsContent>

            <TabsContent value="comparison" className="mt-0">
              {data.cleanedPreview ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Raw Data</h3>
                    <DataTable 
                      data={data.rawPreview.slice(0, 5) || []} 
                      columns={rawColumns} 
                    />
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Cleaned Data</h3>
                    <DataTable 
                      data={data.cleanedPreview.slice(0, 5) || []} 
                      columns={cleanedColumns} 
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No comparison available yet
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Summary Report */}
      {data.isProcessed && data.stats && (
        <SummaryReport stats={data.stats} />
      )}

      {/* Visualizations */}
      {data.isProcessed && data.cleanedPreview && (
        <DataVisualizations data={data.cleanedPreview} />
      )}

      {/* Download Options */}
      {data.isProcessed && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Download Options</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DownloadCard
                icon={<FileSpreadsheet className="h-10 w-10" />}
                title="Cleaned Dataset"
                description="Download your cleaned dataset ready for analysis"
                actions={
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload("csv")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      CSV
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload("xlsx")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      XLSX
                    </Button>
                  </>
                }
              />
              
              <DownloadCard
                icon={<FileText className="h-10 w-10" />}
                title="Summary Report"
                description="Download a detailed report of all cleaning operations"
                actions={
                  <Button 
                    size="sm" 
                    onClick={handleDownloadReport}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    DOCX
                  </Button>
                }
              />
              
              <DownloadCard
                icon={<ImageIcon className="h-10 w-10" />}
                title="Visualizations"
                description="Download all charts and graphs as image files"
                actions={
                  <Button 
                    size="sm" 
                    onClick={() => {}}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ZIP Archive
                  </Button>
                }
              />
            </div>
            
            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-medium mb-4">Save Project</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-64">
                  <Input
                    type="text"
                    placeholder="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSaveProject}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Project"}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Save your project to access it later or share with team members
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
