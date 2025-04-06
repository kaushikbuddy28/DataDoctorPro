import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";

interface DataVisualizationsProps {
  data: any[];
}

export default function DataVisualizations({ data }: DataVisualizationsProps) {
  if (!data || data.length === 0) return null;

  // Helper to get chart data for numeric columns
  const getChartData = (columnName: string, chartType: string) => {
    // Get numeric columns
    const numericColumns = Object.keys(data[0]).filter((key) => {
      const sample = data.slice(0, 10).map((row) => row[key]);
      return sample.every(
        (val) => val === null || !isNaN(parseFloat(val))
      );
    });

    if (numericColumns.length === 0) return [];

    // Use first numeric column if columnName not specified
    const column = columnName || numericColumns[0];

    if (chartType === 'bar') {
      // Get categories from another column if possible
      const categoryColumn = Object.keys(data[0]).find(key => 
        key !== column && 
        !numericColumns.includes(key) &&
        data.map(row => row[key]).filter(Boolean).length <= 10
      ) || numericColumns[0];

      // Group by category and calculate stats
      const groupedData = data.reduce((acc, row) => {
        const category = row[categoryColumn]?.toString() || 'Unknown';
        if (!acc[category]) {
          acc[category] = { 
            name: category, 
            value: 0,
            count: 0
          };
        }
        if (row[column] !== null && !isNaN(parseFloat(row[column]))) {
          acc[category].value += parseFloat(row[column]);
          acc[category].count += 1;
        }
        return acc;
      }, {});

      // Convert to array and calculate averages
      return Object.values(groupedData).map((group: any) => ({
        name: group.name,
        value: group.count > 0 ? group.value / group.count : 0
      })).slice(0, 10);
    }

    if (chartType === 'pie') {
      // Find a categorical column
      const categoryColumn = Object.keys(data[0]).find(key => 
        !numericColumns.includes(key) &&
        data.map(row => row[key]).filter(Boolean).length <= 8
      );

      if (!categoryColumn) return [];

      // Count occurrences of each category
      const counts = data.reduce((acc, row) => {
        const category = row[categoryColumn]?.toString() || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Convert to array for pie chart
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .slice(0, 8);
    }

    if (chartType === 'correlation') {
      if (numericColumns.length < 2) return [];
      
      // Get correlation data for two numeric columns
      const xColumn = numericColumns[0];
      const yColumn = numericColumns[1];
      
      return data
        .filter(row => 
          row[xColumn] !== null && !isNaN(parseFloat(row[xColumn])) &&
          row[yColumn] !== null && !isNaN(parseFloat(row[yColumn]))
        )
        .map(row => ({
          x: parseFloat(row[xColumn]),
          y: parseFloat(row[yColumn]),
          z: 10
        })).slice(0, 50);
    }

    return [];
  };

  // Sample distributions for histogram
  const getHistogramData = () => {
    // Find a numeric column
    const numericColumn = Object.keys(data[0]).find((key) => {
      const sample = data.slice(0, 10).map((row) => row[key]);
      return sample.every(
        (val) => val === null || !isNaN(parseFloat(val))
      );
    });

    if (!numericColumn) return [];

    // Extract values and sort
    const values = data
      .map((row) => parseFloat(row[numericColumn]))
      .filter((val) => !isNaN(val))
      .sort((a, b) => a - b);

    if (values.length === 0) return [];

    // Calculate min and max
    const min = values[0];
    const max = values[values.length - 1];
    const range = max - min;

    // Create bins
    const binCount = 10;
    const binSize = range / binCount;
    const bins = Array(binCount)
      .fill(0)
      .map((_, i) => ({
        name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        value: 0,
      }));

    // Count values in each bin
    values.forEach((val) => {
      const binIndex = Math.min(
        Math.floor((val - min) / binSize),
        binCount - 1
      );
      bins[binIndex].value++;
    });

    return bins;
  };

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444", "#06B6D4", "#6366F1"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Visualizations</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Histogram */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Distribution Histogram</h3>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-64 bg-muted rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getHistogramData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Bar Chart */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Category Comparison</h3>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-64 bg-muted rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData('', 'bar')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Pie Chart */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Distribution by Category</h3>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-64 bg-muted rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getChartData('', 'pie')}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getChartData('', 'pie').map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Correlation Scatterplot */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Correlation Plot</h3>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-64 bg-muted rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="x" />
                  <YAxis type="number" dataKey="y" name="y" />
                  <ZAxis type="number" dataKey="z" range={[40, 40]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Values" data={getChartData('', 'correlation')} fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Button>
            Generate More Visualizations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
