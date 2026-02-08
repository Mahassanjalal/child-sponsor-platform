import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaggerItem, HoverScale } from "@/components/animated-container";

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName = "text-primary",
}: StatCardProps) {
  return (
    <StaggerItem>
      <HoverScale>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className={`h-4 w-4 ${iconClassName}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </CardContent>
        </Card>
      </HoverScale>
    </StaggerItem>
  );
}
