import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverScale,
} from "@/components/animated-container";
import { Input } from "@/components/ui/input";
import {
  DashboardStatCard,
  QuickActionCard,
  DashboardEmptyState,
  ConfirmDialog,
  ChildCard,
} from "@/components/dashboard";
import { ProfessionalReportCard } from "@/components/report-viewer";
import {
  Heart,
  FileText,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  Download,
  Search,
  ArrowRight,
  Calendar,
  MapPin,
  Eye,
  Baby,
  Gift,
  Star,
  ChevronRight,
} from "lucide-react";
import type { Child, Report, Payment, Sponsorship, User as UserType } from "@shared/schema";
import { format } from "date-fns";

interface SponsorshipWithDetails extends Sponsorship {
  child: Child;
  payments: Payment[];
}

interface ReportWithDetails extends Report {
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
}

export default function SponsorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipWithDetails | null>(null);

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/sponsorships/my"],
  });

  const { data: reports, isLoading: loadingReports } = useQuery<ReportWithDetails[]>({
    queryKey: ["/api/reports/my/detailed"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments/my"],
  });

  const { data: availableChildren, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/children/available"],
  });

  const cancelSponsorshipMutation = useMutation({
    mutationFn: async (sponsorshipId: number) => {
      await apiRequest("POST", `/api/sponsorships/${sponsorshipId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsorships/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      toast({
        title: "Sponsorship Cancelled",
        description: "Your sponsorship has been cancelled successfully.",
      });
      setCancelDialogOpen(false);
      setSelectedSponsorship(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel sponsorship",
        variant: "destructive",
      });
    },
  });

  const handleCancelSponsorship = (sponsorship: SponsorshipWithDetails) => {
    setSelectedSponsorship(sponsorship);
    setCancelDialogOpen(true);
  };

  const totalDonated = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const activeSponsorsships = sponsorships?.filter(s => s.status === "active") || [];
  const totalChildren = activeSponsorsships.length;
  const totalReports = reports?.length || 0;
  const impactScore = Math.min(100, totalChildren * 20 + totalDonated / 10);

  const filteredChildren = availableChildren?.filter((child) =>
    searchQuery === "" ||
    child.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportPayments = () => {
    if (!payments || payments.length === 0) {
      toast({
        title: "No Data",
        description: "No payment history to export.",
        variant: "destructive",
      });
      return;
    }
    const headers = ["Date", "Amount", "Status"];
    const rows = payments.map((p) => [
      format(new Date(p.paymentDate), "yyyy-MM-dd"),
      `$${p.amount}`,
      p.status,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Your payment history has been downloaded.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold">Welcome back, {user?.firstName}!</h2>
        <p className="text-muted-foreground">Here's an overview of your sponsorship impact</p>
      </div>
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loadingSponsorships ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </>
        ) : (
          <>
            <DashboardStatCard
              title="Children Sponsored"
              value={totalChildren}
              subtitle="Active sponsorships"
              icon={Baby}
            />
            <DashboardStatCard
              title="Total Donated"
              value={`$${totalDonated.toFixed(0)}`}
              subtitle="Lifetime contribution"
              icon={DollarSign}
              trend={{ value: 12, label: "vs last month" }}
            />
            <DashboardStatCard
              title="Reports Received"
              value={totalReports}
              subtitle="Progress updates"
              icon={FileText}
            />
            <DashboardStatCard
              title="Impact Score"
              value={impactScore.toFixed(0)}
              subtitle="Making a difference"
              icon={Star}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      {totalChildren === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <QuickActionCard
            title="Sponsor a Child"
            description="Make a difference in a child's life today"
            icon={Heart}
            href="/dashboard?tab=children"
            color="primary"
          />
          <QuickActionCard
            title="Learn More"
            description="Discover how your support helps children"
            icon={Gift}
            href="/contact"
            color="accent"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background gap-2" data-testid="tab-overview">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="children" className="data-[state=active]:bg-background gap-2" data-testid="tab-children">
            <Baby className="w-4 h-4" />
            Sponsor a Child
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-background gap-2" data-testid="tab-reports">
            <FileText className="w-4 h-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-background gap-2" data-testid="tab-payments">
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sponsored Children */}
                <Card className="lg:col-span-2 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg font-semibold">My Sponsored Children</CardTitle>
                      <CardDescription>Children you are currently supporting</CardDescription>
                    </div>
                    {activeSponsorsships.length > 0 && (
                      <Badge variant="secondary">{activeSponsorsships.length} Active</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {loadingSponsorships ? (
                      <div className="space-y-4">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : activeSponsorsships.length > 0 ? (
                      <div className="space-y-3">
                        {activeSponsorsships.slice(0, 3).map((sponsorship) => (
                          <motion.div
                            key={sponsorship.id}
                            whileHover={{ x: 4 }}
                            className="group"
                          >
                            <Link href={`/child/${sponsorship.childId}`}>
                              <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all cursor-pointer">
                                <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                                  <AvatarImage src={sponsorship.child.photoUrl || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-lg font-medium">
                                    {sponsorship.child.firstName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">
                                    {sponsorship.child.firstName} {sponsorship.child.lastName}
                                  </h4>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {sponsorship.child.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Since {format(new Date(sponsorship.startDate), "MMM yyyy")}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                    ${sponsorship.monthlyAmount}/mo
                                  </Badge>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                        {activeSponsorsships.length > 3 && (
                          <Button variant="ghost" className="w-full" onClick={() => setActiveTab("children")}>
                            View all {activeSponsorsships.length} children
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <DashboardEmptyState
                        icon={Heart}
                        title="Start Your Sponsorship Journey"
                        description="Make a lasting impact on a child's life by becoming a sponsor today."
                        action={
                          <Button onClick={() => setActiveTab("children")} className="gap-2" data-testid="button-sponsor-first-child">
                            <Plus className="w-4 h-4" />
                            Sponsor Your First Child
                          </Button>
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Activity Feed */}
                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                    <CardDescription>Latest updates and transactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[320px] pr-4">
                      {loadingReports || loadingPayments ? (
                        <div className="space-y-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reports?.slice(0, 3).map((report) => (
                            <motion.div
                              key={`report-${report.id}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{report.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(report.reportDate), "MMM d, yyyy")}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                          {payments?.slice(0, 3).map((payment) => (
                            <motion.div
                              key={`payment-${payment.id}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">Payment of ${payment.amount}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-green-600 shrink-0">
                                {payment.status}
                              </Badge>
                            </motion.div>
                          ))}
                          {(!reports || reports.length === 0) && (!payments || payments.length === 0) && (
                            <div className="text-center py-8">
                              <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground">No recent activity</p>
                            </div>
                          )}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Impact Summary */}
              {totalChildren > 0 && (
                <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-semibold mb-2">Your Impact Journey</h3>
                        <p className="text-muted-foreground">
                          You're making a real difference! Your support helps provide education, healthcare, and hope to children in need.
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-primary">{totalChildren}</div>
                          <div className="text-xs text-muted-foreground">Children Helped</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-accent">${totalDonated.toFixed(0)}</div>
                          <div className="text-xs text-muted-foreground">Total Donated</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{totalReports}</div>
                          <div className="text-xs text-muted-foreground">Updates Received</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Children Tab */}
            <TabsContent value="children" className="space-y-6 mt-0">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Children Waiting for Sponsors</CardTitle>
                      <CardDescription>Choose a child to support their education, healthcare, and well-being</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                        data-testid="input-search-children"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingChildren ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : filteredChildren && filteredChildren.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredChildren.map((child) => (
                        <ChildCard key={child.id} child={child} linkPrefix="/sponsor/child" actionLabel="Sponsor" />
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <DashboardEmptyState
                      icon={Search}
                      title={`No children found matching "${searchQuery}"`}
                      description="Try a different search term or clear the filter."
                      action={
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      }
                    />
                  ) : (
                    <DashboardEmptyState
                      icon={Sparkles}
                      title="All Children are Currently Sponsored!"
                      description="Thanks to generous sponsors like you, all children have found support. Check back soon for new children in need."
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6 mt-0">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Progress Reports</CardTitle>
                    <CardDescription>Monthly updates on your sponsored children - View full details and download PDF</CardDescription>
                  </div>
                  {reports && reports.length > 0 && (
                    <Link href="/reports">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View All
                      </Button>
                    </Link>
                  )}
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {reports.slice(0, 4).map((report) => (
                        <HoverScale key={report.id}>
                          <ProfessionalReportCard
                            report={report}
                            child={report.child}
                            sponsor={report.sponsor}
                          />
                        </HoverScale>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      icon={FileText}
                      title="No Reports Yet"
                      description="Reports will appear here once you sponsor a child. You'll receive monthly progress updates with photos and detailed information."
                      action={
                        <Button onClick={() => setActiveTab("children")} className="gap-2">
                          <Heart className="w-4 h-4" />
                          Sponsor a Child
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6 mt-0">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Your contribution history and invoices</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportPayments} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingPayments ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : payments && payments.length > 0 ? (
                    <div className="space-y-3">
                      {payments.map((payment, index) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                              <CreditCard className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Monthly Sponsorship</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(payment.paymentDate), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="font-semibold text-lg">${payment.amount}</p>
                            </div>
                            <Badge
                              variant={payment.status === "completed" ? "default" : "secondary"}
                              className={payment.status === "completed" ? "bg-green-500 hover:bg-green-600" : ""}
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <DashboardEmptyState
                      icon={CreditCard}
                      title="No Payment History"
                      description="Your payment history will appear here once you start sponsoring a child."
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Sponsorship"
        description={`Are you sure you want to cancel your sponsorship of ${selectedSponsorship?.child.firstName} ${selectedSponsorship?.child.lastName}? This action cannot be undone and your recurring payments will be stopped.`}
        onConfirm={() => selectedSponsorship && cancelSponsorshipMutation.mutate(selectedSponsorship.id)}
        isPending={cancelSponsorshipMutation.isPending}
        confirmLabel="Yes, Cancel"
        pendingLabel="Cancelling..."
        cancelLabel="Keep Sponsorship"
        destructive
        cancelTestId="button-cancel-dialog-close"
        confirmTestId="button-confirm-cancel"
      />
    </div>
  );
}
