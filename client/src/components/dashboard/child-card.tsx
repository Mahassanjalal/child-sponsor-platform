import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverScale } from "@/components/animated-container";
import { Users } from "lucide-react";
import type { Child } from "@shared/schema";

interface ChildCardProps {
  child: Child;
  linkPrefix?: string;
  actionLabel?: string;
}

export function ChildCard({
  child,
  linkPrefix = "/sponsor/child",
  actionLabel = "Sponsor",
}: ChildCardProps) {
  return (
    <HoverScale>
      <Card className="overflow-hidden group">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {child.photoUrl ? (
            <img
              src={child.photoUrl}
              alt={child.firstName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-16 h-16 text-muted-foreground/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-1">{child.firstName}</h3>
          <p className="text-sm text-muted-foreground mb-2">{child.location}</p>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {child.story}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">
              ${child.monthlyAmount}/month
            </span>
            <Link href={`${linkPrefix}/${child.id}`}>
              <Button size="sm" data-testid={`button-sponsor-${child.id}`}>
                {actionLabel}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </HoverScale>
  );
}
