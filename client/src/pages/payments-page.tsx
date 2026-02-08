import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardStatCard,
  DashboardEmptyState,
} from "@/components/dashboard";
import {
  CreditCard,
  DollarSign,
  Download,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Receipt,
  Filter,
} from "lucide-react";
import type { Payment } from "@shared/schema";

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/my"],
  });

  // Calculate stats
  const totalPaid = payments?.reduce((sum, p) => 
    p.status === "completed" ? sum + parseFloat(p.amount) : sum, 0
  ) || 0;
  
  const pendingAmount = payments?.reduce((sum, p) => 
    p.status === "pending" ? sum + parseFloat(p.amount) : sum, 0
  ) || 0;

  const completedPayments = payments?.filter(p => p.status === "completed").length || 0;
  
  // Filter payments
  const filteredPayments = payments?.filter((payment) => {
    // Status filter
    if (statusFilter !== "all" && payment.status !== statusFilter) return false;
    
    // Date filter
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      
      if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (paymentDate < monthAgo) return false;
      } else if (dateFilter === "quarter") {
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (paymentDate < quarterAgo) return false;
      } else if (dateFilter === "year") {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (paymentDate < yearAgo) return false;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  const handleExportPayments = () => {
    if (!payments || payments.length === 0) {
      toast({
        title: "No Data",
        description: "No payment history to export.",
        variant: "destructive",
      });
      return;
    }
    const headers = ["Date", "Amount", "Status", "Transaction ID"];
    const rows = payments.map((p) => [
      format(new Date(p.paymentDate), "yyyy-MM-dd"),
      `$${p.amount}`,
      p.status,
      p.stripePaymentId || "N/A",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Paid"
          value={`$${totalPaid.toFixed(2)}`}
          subtitle="Lifetime contributions"
          icon={DollarSign}
        />
        <DashboardStatCard
          title="Pending"
          value={`$${pendingAmount.toFixed(2)}`}
          subtitle="Awaiting processing"
          icon={Clock}
        />
        <DashboardStatCard
          title="Transactions"
          value={completedPayments}
          subtitle="Completed payments"
          icon={Receipt}
        />
        <DashboardStatCard
          title="Monthly Average"
          value={`$${payments && payments.length > 0 ? (totalPaid / Math.max(1, new Set(payments.map(p => format(new Date(p.paymentDate), "yyyy-MM"))).size)).toFixed(0) : 0}`}
          subtitle="Per month"
          icon={TrendingUp}
        />
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment History
              </CardTitle>
              <CardDescription>View and manage your payment transactions</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportPayments} className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredPayments && filteredPayments.length > 0 ? (
            <div className="space-y-3">
              {filteredPayments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div>
                      <p className="font-medium">Monthly Sponsorship</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(payment.paymentDate), "MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-lg">${payment.amount}</p>
                      {payment.stripePaymentId && (
                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {payment.stripePaymentId.slice(-8)}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              icon={CreditCard}
              title="No Payments Found"
              description={
                statusFilter !== "all" || dateFilter !== "all"
                  ? "No payments match your current filters. Try adjusting the filters."
                  : "Your payment history will appear here once you start sponsoring a child."
              }
              action={
                (statusFilter !== "all" || dateFilter !== "all") && (
                  <Button variant="outline" onClick={() => { setStatusFilter("all"); setDateFilter("all"); }}>
                    Clear Filters
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Payment Methods (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Badge variant="outline">Default</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Payment methods are managed securely through Stripe. Contact support to update your payment information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
