import { Card } from "@/components/ui/card";
import { Database, Table, AlertCircle, Copy } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  percentage?: string;
  icon: "table" | "database" | "alert-circle" | "copy";
  iconColor: "blue" | "emerald" | "amber" | "violet";
}

export default function StatsCard({
  title,
  value,
  change,
  percentage,
  icon,
  iconColor,
}: StatsCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "table":
        return <Table className={`h-5 w-5 text-blue-500`} />;
      case "database":
        return <Database className={`h-5 w-5 text-emerald-500`} />;
      case "alert-circle":
        return <AlertCircle className={`h-5 w-5 text-amber-500`} />;
      case "copy":
        return <Copy className={`h-5 w-5 text-violet-500`} />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-muted p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {getIcon()}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold">{value}</span>
        {change && (
          <span className="ml-2 text-sm text-red-500">{change}</span>
        )}
        {percentage && (
          <span className="ml-2 text-sm text-muted-foreground">
            {percentage}% of data
          </span>
        )}
      </div>
    </Card>
  );
}
