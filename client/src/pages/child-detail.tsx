import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import {
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  PageTransition,
} from "@/components/animated-container";
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
import type { Child, Report, Sponsorship } from "@shared/schema";
import { format } from "date-fns";

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

  const { data: sponsorships } = useQuery<Sponsorship[]>({
    queryKey: ["/api/sponsorships/my"],
    enabled: !!user,
  });

  const isSponsoring = sponsorships?.some(
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
      <PageTransition>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    HopeConnect
                  </span>
                </div>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-64 w-full rounded-xl mb-6" />
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

  if (!child) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
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
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/">
              <motion.div
                className="flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  HopeConnect
                </span>
              </motion.div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/dashboard">
                <Button variant="ghost" data-testid="button-back-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <AnimatedContainer>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="md:col-span-1">
                  <div className="sticky top-24">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
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
                    {isSponsoring ? (
                      <Badge className="w-full justify-center py-2 bg-accent text-white">
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
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {child.firstName} {child.lastName}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{age} years old</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{child.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="capitalize">{child.gender}</span>
                      </div>
                    </div>
                  </div>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5 text-primary" />
                        {child.firstName}'s Story
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {child.story}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-accent" />
                        Needs & Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {child.needs}
                      </p>
                      <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Monthly sponsorship amount:
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ${child.monthlyAmount}/month
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {isSponsoring && reports && reports.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Progress Reports
                        </CardTitle>
                        <CardDescription>
                          Updates on {child.firstName}'s progress
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <StaggerContainer className="space-y-4">
                          {reports.map((report) => (
                            <StaggerItem key={report.id}>
                              <div className="p-4 border rounded-lg">
                                <div className="flex items-start gap-4">
                                  {report.photoUrl && (
                                    <img
                                      src={report.photoUrl}
                                      alt={report.title}
                                      className="w-20 h-20 rounded-lg object-cover"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{report.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {format(new Date(report.reportDate), "MMMM d, yyyy")}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                      {report.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </StaggerItem>
                          ))}
                        </StaggerContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
