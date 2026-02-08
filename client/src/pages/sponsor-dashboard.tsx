import { useState } from "react";
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
  StaggerContainer,
  HoverScale,
} from "@/components/animated-container";
import {
  DashboardCardSkeleton,
  ChildCardSkeleton,
  ReportCardSkeleton,
  PaymentHistorySkeleton,
} from "@/components/loading-skeleton";
import { Input } from "@/components/ui/input";
import {
  DashboardLayout,
  StatCard,
  EmptyState,
  ConfirmDialog,
  ChildCard,
} from "@/components/dashboard";
import {
  Heart,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  DollarSign,
  Clock,
  Sparkles,
  Plus,
  Download,
  Search,
} from "lucide-react";
import type { Child, Report, Payment, Sponsorship } from "@shared/schema";
import { format } from "date-fns";

interface SponsorshipWithDetails extends Sponsorship {
  child: Child;
  payments: Payment[];
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

  const { data: reports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports/my"],
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
  const totalChildren = sponsorships?.length || 0;
  const totalReports = reports?.length || 0;

  const filteredChildren = availableChildren?.filter((child) =>
    searchQuery === "" ||
    child.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.firstName}!`}
      subtitle="Here's an overview of your sponsorship impact"
      logoutTestId="button-logout"
    >
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
            <StatCard
              title="Children Sponsored"
              value={totalChildren}
              subtitle="Active sponsorships"
              icon={Users}
              iconClassName="text-primary"
            />
            <StatCard
              title="Total Donated"
              value={`$${totalDonated.toFixed(2)}`}
              subtitle="Lifetime contribution"
              icon={DollarSign}
              iconClassName="text-accent"
            />
            <StatCard
              title="Reports Received"
              value={totalReports}
              subtitle="Progress updates"
              icon={FileText}
              iconClassName="text-chart-3"
            />
            <StatCard
              title="Impact Score"
              value={
                <span className="flex items-center gap-1">
                  <Sparkles className="w-5 h-5 text-chart-4" />
                  {Math.min(100, totalChildren * 20 + totalDonated / 10)}
                </span>
              }
              subtitle="Making a difference"
              icon={TrendingUp}
              iconClassName="text-chart-2"
            />
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
                        {sponsorships.filter(s => s.status === "active").map((sponsorship) => (
                          <motion.div
                            key={sponsorship.id}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-card hover-elevate"
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
                            <div className="text-right mr-2">
                              <Badge variant="secondary">${sponsorship.monthlyAmount}/mo</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Since {format(new Date(sponsorship.startDate), "MMM yyyy")}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelSponsorship(sponsorship);
                              }}
                              data-testid={`button-cancel-sponsorship-${sponsorship.id}`}
                            >
                              Cancel
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="You haven't sponsored any children yet"
                        action={
                          <Button onClick={() => setActiveTab("children")} data-testid="button-sponsor-first-child">
                            <Plus className="w-4 h-4 mr-2" />
                            Sponsor Your First Child
                          </Button>
                        }
                      />
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Available Children to Sponsor</CardTitle>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <ChildCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : filteredChildren && filteredChildren.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredChildren.map((child) => (
                        <ChildCard key={child.id} child={child} linkPrefix="/sponsor/child" actionLabel="Sponsor" />
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <EmptyState
                      icon={Search}
                      title={`No children found matching "${searchQuery}"`}
                      description="Try a different search term or clear the filter."
                    />
                  ) : (
                    <EmptyState
                      icon={Heart}
                      title="All children are currently sponsored!"
                      description="Check back soon for new children in need."
                    />
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
                    <EmptyState
                      icon={FileText}
                      title="No reports yet"
                      description="Reports will appear here once you sponsor a child"
                    />
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
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
                    }}
                  >
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
                    <EmptyState
                      icon={CreditCard}
                      title="No payments yet"
                      description="Your payment history will appear here"
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
    </DashboardLayout>
  );
}
