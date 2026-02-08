import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { DashboardEmptyState } from "@/components/dashboard";
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Child, User, Sponsorship, Payment } from "@shared/schema";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface SponsorshipWithDetails extends Sponsorship {
  sponsor: User;
  child: Child;
}

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "succeeded" | "pending" | "failed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/admin/sponsorships"],
  });

  // Get sponsorship details for a payment
  const getSponsorshipDetails = (sponsorshipId: number) => {
    return sponsorships?.find((s) => s.id === sponsorshipId);
  };

  // Filter payments based on search, status, and date
  const filteredPayments = payments?.filter((payment) => {
    const sponsorship = getSponsorshipDetails(payment.sponsorshipId);
    
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      sponsorship?.sponsor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsorship?.sponsor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsorship?.child.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsorship?.child.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.stripePaymentId?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    // Date filter
    let matchesDate = true;
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    
    if (dateFilter === "today") {
      matchesDate = paymentDate.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      matchesDate = paymentDate >= subDays(now, 7);
    } else if (dateFilter === "month") {
      matchesDate = isWithinInterval(paymentDate, {
        start: startOfMonth(now),
        end: endOfMonth(now),
      });
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate stats
  const now = new Date();
  const thisMonth = payments?.filter((p) => {
    const paymentDate = new Date(p.paymentDate);
    return isWithinInterval(paymentDate, {
      start: startOfMonth(now),
      end: endOfMonth(now),
    });
  }) || [];

  const lastMonth = payments?.filter((p) => {
    const paymentDate = new Date(p.paymentDate);
    const lastMonthStart = startOfMonth(subDays(startOfMonth(now), 1));
    const lastMonthEnd = endOfMonth(subDays(startOfMonth(now), 1));
    return isWithinInterval(paymentDate, { start: lastMonthStart, end: lastMonthEnd });
  }) || [];

  const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const thisMonthRevenue = thisMonth
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const lastMonthRevenue = lastMonth
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const revenueChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  const successfulPayments = payments?.filter((p) => p.status === "succeeded").length || 0;
  const failedPayments = payments?.filter((p) => p.status === "failed").length || 0;
  const pendingPayments = payments?.filter((p) => p.status === "pending").length || 0;

  const successRate = payments?.length
    ? Math.round((successfulPayments / payments.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case "pending":
        return <Clock className="w-3 h-3 mr-1" />;
      case "failed":
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            View and track all sponsorship payments
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600">${thisMonthRevenue.toLocaleString()}</p>
                {revenueChange !== 0 && (
                  <div className={`flex items-center text-xs ${revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange > 0 ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>{Math.abs(revenueChange).toFixed(1)}% vs last month</span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
                <p className="text-xs text-muted-foreground">{successfulPayments} successful payments</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-purple-600">{payments?.length || 0}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {pendingPayments > 0 && <span>{pendingPayments} pending</span>}
                  {failedPayments > 0 && <span className="text-red-500">{failedPayments} failed</span>}
                </div>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by sponsor, child, or payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>{filteredPayments?.length || 0} transactions found</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayments || loadingSponsorships ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredPayments.map((payment) => {
                      const sponsorship = getSponsorshipDetails(payment.sponsorshipId);
                      return (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {format(new Date(payment.paymentDate), "MMM d, yyyy")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payment.paymentDate), "h:mm a")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {sponsorship ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sponsorship.sponsor.avatarUrl || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {sponsorship.sponsor.firstName[0]}
                                    {sponsorship.sponsor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[120px]">
                                  {sponsorship.sponsor.firstName} {sponsorship.sponsor.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sponsorship ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sponsorship.child.photoUrl || undefined} />
                                  <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                    {sponsorship.child.firstName[0]}
                                    {sponsorship.child.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[120px]">
                                  {sponsorship.child.firstName} {sponsorship.child.lastName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-lg">${payment.amount}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(payment.status)}>
                              {getStatusIcon(payment.status)}
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.stripePaymentId?.substring(0, 20) || "—"}...
                            </code>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <DashboardEmptyState
              icon={CreditCard}
              title="No payments found"
              description={
                searchQuery || statusFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Payments will appear here when sponsors make contributions"
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
