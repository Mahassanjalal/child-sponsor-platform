import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardStatCard, DashboardEmptyState } from "@/components/dashboard";
import {
  Baby,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  BarChart3,
  ChevronRight,
  Heart,
  Clock,
  DollarSign,
  Activity,
} from "lucide-react";
import type { Child, User, Report, Sponsorship, Payment } from "@shared/schema";

interface SponsorshipWithDetails extends Sponsorship {
  sponsor: User;
  child: Child;
}

export default function AdminOverview() {
  const { data: children, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/admin/children"],
  });

  const { data: sponsors, isLoading: loadingSponsors } = useQuery<User[]>({
    queryKey: ["/api/admin/sponsors"],
  });

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/admin/sponsorships"],
  });

  const { data: reports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const totalChildren = children?.length || 0;
  const sponsoredChildren = children?.filter(c => c.isSponsored).length || 0;
  const availableChildren = totalChildren - sponsoredChildren;
  const totalSponsors = sponsors?.length || 0;
  const totalReports = reports?.length || 0;
  const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
  const activeSubscriptions = sponsorships?.filter(s => s.status === "active").length || 0;
  const monthlyRevenue = activeSubscriptions * 35; // Approximate

  const isLoading = loadingChildren || loadingSponsors || loadingSponsorships || loadingReports || loadingPayments;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your platform.</p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="gap-2 bg-green-500/10 text-green-600 border-green-500/20">
            <Activity className="w-3 h-3" />
            {activeSubscriptions} Active Sponsorships
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <DashboardStatCard
              title="Total Children"
              value={totalChildren}
              subtitle={`${sponsoredChildren} sponsored, ${availableChildren} available`}
              icon={Baby}
              trend={{ value: sponsoredChildren > 0 ? Math.round((sponsoredChildren / totalChildren) * 100) : 0, label: "sponsorship rate" }}
            />
            <DashboardStatCard
              title="Active Sponsors"
              value={totalSponsors}
              subtitle={`${activeSubscriptions} active sponsorships`}
              icon={Users}
            />
            <DashboardStatCard
              title="Published Reports"
              value={totalReports}
              subtitle="Progress reports"
              icon={FileText}
            />
            <DashboardStatCard
              title="Total Revenue"
              value={`$${totalRevenue.toLocaleString()}`}
              subtitle={`~$${monthlyRevenue}/month recurring`}
              icon={DollarSign}
            />
          </>
        )}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Sponsorships */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Recent Sponsorships
              </CardTitle>
              <CardDescription>Latest sponsorship activity</CardDescription>
            </div>
            <Link href="/admin/sponsors">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingSponsorships ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : sponsorships && sponsorships.length > 0 ? (
              <div className="space-y-3">
                {sponsorships.slice(0, 5).map((sp) => (
                  <motion.div
                    key={sp.id}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <Avatar>
                      <AvatarImage src={sp.sponsor.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {sp.sponsor.firstName[0]}{sp.sponsor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {sp.sponsor.firstName} {sp.sponsor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        Sponsors {sp.child.firstName} {sp.child.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">${sp.monthlyAmount}/mo</p>
                      <Badge variant={sp.status === "active" ? "default" : "secondary"} className="text-xs">
                        {sp.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <DashboardEmptyState 
                icon={Users} 
                title="No sponsorships yet" 
                description="Sponsorships will appear here when sponsors support children." 
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Platform Stats
            </CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">Conversion Rate</span>
              </div>
              <span className="text-xl font-bold text-primary">
                {totalChildren > 0 ? Math.round((sponsoredChildren / totalChildren) * 100) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <span className="font-medium">Avg Response</span>
              </div>
              <span className="text-xl font-bold text-accent">2.4h</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium">Avg Donation</span>
              </div>
              <span className="text-xl font-bold text-green-600">$35</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports & Available Children */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Recent Reports
              </CardTitle>
              <CardDescription>Latest progress reports</CardDescription>
            </div>
            <Link href="/admin/reports">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 4).map((report) => {
                  const child = children?.find(c => c.id === report.childId);
                  return (
                    <div key={report.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={child?.photoUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {child?.firstName?.[0]}{child?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {child?.firstName} • {format(new Date(report.reportDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DashboardEmptyState 
                icon={FileText} 
                title="No reports yet" 
                description="Reports will appear here once published." 
              />
            )}
          </CardContent>
        </Card>

        {/* Children Awaiting Sponsors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-primary" />
                Awaiting Sponsors
              </CardTitle>
              <CardDescription>Children looking for sponsors</CardDescription>
            </div>
            <Link href="/admin/children">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingChildren ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : children && children.filter(c => !c.isSponsored).length > 0 ? (
              <div className="space-y-3">
                {children.filter(c => !c.isSponsored).slice(0, 4).map((child) => {
                  const age = Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                  return (
                    <div key={child.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={child.photoUrl || undefined} />
                        <AvatarFallback className="text-xs bg-accent/10 text-accent">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{child.firstName} {child.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {age} years • {child.location}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">${child.monthlyAmount}/mo</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <DashboardEmptyState 
                icon={Baby} 
                title="All children sponsored!" 
                description="Great job! All children have sponsors." 
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
