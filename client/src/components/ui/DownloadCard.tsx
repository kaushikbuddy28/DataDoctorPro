import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface DownloadCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}

export default function DownloadCard({
  icon,
  title,
  description,
  actions,
}: DownloadCardProps) {
  return (
    <Card className="bg-muted">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="text-primary mb-4">{icon}</div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
        <div className="mt-auto flex gap-2">{actions}</div>
      </CardContent>
    </Card>
  );
}
