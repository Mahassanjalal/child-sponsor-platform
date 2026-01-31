import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  HoverScale,
  PageTransition,
} from "@/components/animated-container";
import {
  DashboardCardSkeleton,
  ChildCardSkeleton,
  ReportCardSkeleton,
  PaymentHistorySkeleton,
} from "@/components/loading-skeleton";
import {
  Heart,
  Users,
  FileText,
  CreditCard,
  LogOut,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Sparkles,
  Plus,
  Download,
} from "lucide-react";
import type { Child, Report, Payment, Sponsorship } from "@shared/schema";
import { format } from "date-fns";

interface SponsorshipWithDetails extends Sponsorship {
  child: Child;
  payments: Payment[];
}

export default function SponsorDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/sponsorships/my"],
  });

  const { data: reports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports/my"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/my"],
  });

  const { data: availableChildren, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children/available"],
  });

  const totalDonated = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const totalChildren = sponsorships?.length || 0;
  const totalReports = reports?.length || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

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

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AnimatedContainer>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your sponsorship impact
              </p>
            </div>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loadingSponsorships ? (
              <>
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
              </>
            ) : (
              <>
                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Children Sponsored
                        </CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalChildren}</div>
                        <p className="text-xs text-muted-foreground">Active sponsorships</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Donated
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-accent" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">${totalDonated.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Lifetime contribution</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Reports Received
                        </CardTitle>
                        <FileText className="h-4 w-4 text-chart-3" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalReports}</div>
                        <p className="text-xs text-muted-foreground">Progress updates</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Impact Score
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-chart-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-1">
                          <Sparkles className="w-5 h-5 text-chart-4" />
                          {Math.min(100, totalChildren * 20 + totalDonated / 10)}
                        </div>
                        <p className="text-xs text-muted-foreground">Making a difference</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              </>
            )}
          </StaggerContainer>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="children" data-testid="tab-children">My Children</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Sponsored Children</CardTitle>
                        <CardDescription>Children you are currently supporting</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingSponsorships ? (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                                <ChildCardSkeleton />
                              </div>
                            ))}
                          </div>
                        ) : sponsorships && sponsorships.length > 0 ? (
                          <div className="space-y-4">
                            {sponsorships.map((sponsorship) => (
                              <motion.div
                                key={sponsorship.id}
                                className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate cursor-pointer"
                                whileHover={{ x: 4 }}
                              >
                                <Avatar className="h-14 w-14">
                                  <AvatarImage src={sponsorship.child.photoUrl || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                                    {sponsorship.child.firstName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{sponsorship.child.firstName} {sponsorship.child.lastName}</h4>
                                  <p className="text-sm text-muted-foreground">{sponsorship.child.location}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant="secondary">${sponsorship.monthlyAmount}/mo</Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Since {format(new Date(sponsorship.startDate), "MMM yyyy")}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">You haven't sponsored any children yet</p>
                            <Button onClick={() => setActiveTab("children")} data-testid="button-sponsor-first-child">
                              <Plus className="w-4 h-4 mr-2" />
                              Sponsor Your First Child
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          {loadingReports || loadingPayments ? (
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2">
                                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                  <div className="flex-1 space-y-1">
                                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {reports?.slice(0, 3).map((report) => (
                                <motion.div
                                  key={report.id}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                  whileHover={{ x: 2 }}
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{report.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(report.reportDate), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                              {payments?.slice(0, 3).map((payment) => (
                                <motion.div
                                  key={payment.id}
                                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                                  whileHover={{ x: 2 }}
                                >
                                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                    <CreditCard className="w-4 h-4 text-accent" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Payment of ${payment.amount}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                              {(!reports || reports.length === 0) && (!payments || payments.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No recent activity</p>
                                </div>
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="children" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Children to Sponsor</CardTitle>
                      <CardDescription>Choose a child to support their education, healthcare, and well-being</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingChildren ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <ChildCardSkeleton key={i} />
                          ))}
                        </div>
                      ) : availableChildren && availableChildren.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {availableChildren.map((child) => (
                            <HoverScale key={child.id}>
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
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{child.story}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-primary">${child.monthlyAmount}/month</span>
                                    <Button size="sm" data-testid={`button-sponsor-${child.id}`}>
                                      Sponsor
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </HoverScale>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">All children are currently sponsored!</p>
                          <p className="text-sm text-muted-foreground">Check back soon for new children in need.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Progress Reports</CardTitle>
                      <CardDescription>Monthly updates on your sponsored children</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingReports ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[1, 2, 3, 4].map((i) => (
                            <ReportCardSkeleton key={i} />
                          ))}
                        </div>
                      ) : reports && reports.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {reports.map((report) => (
                            <HoverScale key={report.id}>
                              <Card>
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-lg">{report.title}</CardTitle>
                                      <CardDescription>
                                        {format(new Date(report.reportDate), "MMMM d, yyyy")}
                                      </CardDescription>
                                    </div>
                                    <Badge variant="secondary">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Report
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  {report.photoUrl && (
                                    <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                                      <img
                                        src={report.photoUrl}
                                        alt="Report"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <p className="text-sm text-muted-foreground line-clamp-4">{report.content}</p>
                                </CardContent>
                              </Card>
                            </HoverScale>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">No reports yet</p>
                          <p className="text-sm text-muted-foreground">Reports will appear here once you sponsor a child</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>Your contribution history and invoices</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingPayments ? (
                        <PaymentHistorySkeleton />
                      ) : payments && payments.length > 0 ? (
                        <div className="space-y-3">
                          {payments.map((payment) => (
                            <motion.div
                              key={payment.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-card"
                              whileHover={{ x: 4 }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                  <CreditCard className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                  <p className="font-medium">Monthly Sponsorship</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(payment.paymentDate), "MMMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-lg">${payment.amount}</p>
                                <Badge
                                  variant={payment.status === "completed" ? "default" : "secondary"}
                                  className={payment.status === "completed" ? "bg-accent" : ""}
                                >
                                  {payment.status}
                                </Badge>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <CreditCard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">No payments yet</p>
                          <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
}
