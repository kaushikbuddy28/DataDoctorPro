import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import StatsCard from "@/components/ui/StatsCard";
import { 
  PieChart, 
  Pie, 
  ResponsiveContainer, 
  Cell, 
  Legend, 
  Tooltip 
} from "recharts";

interface SummaryReportProps {
  stats: any;
}

export default function SummaryReport({ stats }: SummaryReportProps) {
  if (!stats) return null;

  // Prepare data for the pie chart
  const dataTypeData = Object.entries(stats.dataTypeSummary || {}).map(
    ([name, value]: [string, any]) => ({
      name,
      value,
    })
  );

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary Report</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Rows"
            value={stats.totalRows}
            change={stats.duplicatesRemoved ? `-${stats.duplicatesRemoved} removed` : undefined}
            icon="table"
            iconColor="blue"
          />
          
          <StatsCard
            title="Total Columns"
            value={stats.totalColumns}
            icon="database"
            iconColor="emerald"
          />
          
          <StatsCard
            title="Null Values Fixed"
            value={stats.nullValuesFixed || 0}
            icon="alert-circle"
            iconColor="amber"
          />
          
          <StatsCard
            title="Duplicates Removed"
            value={stats.duplicatesRemoved || 0}
            percentage={stats.totalRows ? ((stats.duplicatesRemoved || 0) / (stats.totalRows + (stats.duplicatesRemoved || 0)) * 100).toFixed(1) : "0"}
            icon="copy"
            iconColor="violet"
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column Changes */}
          <div>
            <h3 className="text-lg font-medium mb-4">Column Name Changes</h3>
            <div className="bg-muted rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Original</TableHead>
                    <TableHead>Cleaned</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.columnsRenamed && stats.columnsRenamed.map((col: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{col.original}</TableCell>
                      <TableCell>{col.cleaned}</TableCell>
                      <TableCell className="text-muted-foreground">{col.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Data Type Analysis */}
          <div>
            <h3 className="text-lg font-medium mb-4">Data Type Summary</h3>
            <div className="bg-muted rounded-lg p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {dataTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} columns`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <Button variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
            <Download className="mr-2 h-4 w-4" /> 
            Download Report as PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
