import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
} from "@/components/animated-container";
import { ProfessionalReportCard } from "@/components/report-viewer";
import { DashboardEmptyState } from "@/components/dashboard";
import {
  Heart,
  MapPin,
  Calendar,
  User,
  FileText,
  ArrowLeft,
  GraduationCap,
  Users,
} from "lucide-react";
import type { Child, Report, Sponsorship, User as UserType } from "@shared/schema";

interface ReportWithDetails extends Report {
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
}

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const childId = parseInt(params.id || "0");
  const { user } = useAuth();

  const { data: child, isLoading: loadingChild } = useQuery<Child>({
    queryKey: ["/api/children", childId],
  });

  const { data: reports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports/child", childId],
    enabled: !!childId,
  });

  const { data: sponsorship } = useQuery<Sponsorship[]>({
    queryKey: ["/api/sponsorships/my"],
    enabled: !!user,
  });

  const isSponsoring = sponsorship?.some(
    (s) => s.childId === childId && s.status === "active"
  );

  const age = child
    ? Math.floor(
        (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : 0;

  if (loadingChild) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Child Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The child profile you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/dashboard">
            <Button data-testid="button-back-dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/my-children">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{child.firstName} {child.lastName}</h1>
          <p className="text-muted-foreground">Child Profile Details</p>
        </div>
      </div>

      <AnimatedContainer>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Photo & Quick Actions */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-[3/4] bg-gradient-to-br from-primary/20 to-accent/20">
                {child.photoUrl ? (
                  <img
                    src={child.photoUrl}
                    alt={`${child.firstName} ${child.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                {isSponsoring ? (
                  <Badge className="w-full justify-center py-2 bg-accent text-white">
                    <Heart className="w-4 h-4 mr-2" />
                    You are sponsoring {child.firstName}
                  </Badge>
                ) : !child.isSponsored ? (
                  <Link href={`/sponsor/child/${child.id}`}>
                    <Button className="w-full" size="lg" data-testid="button-sponsor-child">
                      <Heart className="w-4 h-4 mr-2" />
                      Sponsor {child.firstName}
                    </Button>
                  </Link>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Already Sponsored
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">{age} years old</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{child.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{child.gender}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <GraduationCap className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Support</p>
                    <p className="font-medium text-accent">${child.monthlyAmount}/month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Story & Reports */}
          <div className="md:col-span-2 space-y-6">
            {/* Story */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  {child.firstName}'s Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{child.story}</p>
              </CardContent>
            </Card>

            {/* Needs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" />
                  Needs & Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{child.needs}</p>
              </CardContent>
            </Card>

            {/* Progress Reports - Only for sponsors */}
            {isSponsoring && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Progress Reports
                      </CardTitle>
                      <CardDescription>Updates on {child.firstName}'s development</CardDescription>
                    </div>
                    {reports && reports.length > 0 && (
                      <Badge variant="outline" className="text-primary">
                        {reports.length} Report{reports.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                      ))}
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <StaggerContainer className="space-y-4">
                      {reports.map((report) => (
                        <StaggerItem key={report.id}>
                          <ProfessionalReportCard
                            report={report}
                            child={child}
                            sponsor={user ? {
                              id: user.id,
                              email: user.email,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              role: user.role,
                              avatarUrl: user.avatarUrl,
                              phone: user.phone,
                              address: user.address,
                              stripeCustomerId: user.stripeCustomerId,
                              createdAt: user.createdAt
                            } : undefined}
                          />
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  ) : (
                    <DashboardEmptyState
                      icon={FileText}
                      title="No Reports Yet"
                      description="Progress reports will appear here once available."
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AnimatedContainer>
    </div>
  );
}
