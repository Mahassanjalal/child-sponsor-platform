import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DashboardStatCard,
  DashboardEmptyState,
  ConfirmDialog,
  ChildCard,
} from "@/components/dashboard";
import {
  Baby,
  Heart,
  Calendar,
  MapPin,
  Search,
  ChevronRight,
  Sparkles,
  DollarSign,
  FileText,
  Eye,
} from "lucide-react";
import type { Child, Sponsorship, Payment, Report } from "@shared/schema";

interface SponsorshipWithDetails extends Sponsorship {
  child: Child;
  payments: Payment[];
}

export default function MyChildrenPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipWithDetails | null>(null);

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/sponsorships/my"],
  });

  const { data: availableChildren, isLoading: loadingAvailable } = useQuery<Child[]>({
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

  const activeSponsorsships = sponsorships?.filter(s => s.status === "active") || [];
  const totalDonated = sponsorships?.reduce((sum, s) => {
    const payments = s.payments || [];
    return sum + payments.reduce((pSum, p) => pSum + parseFloat(p.amount), 0);
  }, 0) || 0;

  const filteredAvailableChildren = availableChildren?.filter((child) =>
    searchQuery === "" ||
    child.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    child.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardStatCard
          title="Active Sponsorships"
          value={activeSponsorsships.length}
          subtitle="Children you support"
          icon={Baby}
        />
        <DashboardStatCard
          title="Total Contributed"
          value={`$${totalDonated.toFixed(0)}`}
          subtitle="Lifetime giving"
          icon={DollarSign}
        />
        <DashboardStatCard
          title="Monthly Commitment"
          value={`$${activeSponsorsships.reduce((sum, s) => sum + parseFloat(s.monthlyAmount), 0).toFixed(0)}`}
          subtitle="Per month"
          icon={Heart}
        />
      </div>

      {/* My Sponsored Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            My Sponsored Children
          </CardTitle>
          <CardDescription>Children you are currently supporting</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSponsorships ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : activeSponsorsships.length > 0 ? (
            <div className="space-y-4">
              {activeSponsorsships.map((sponsorship, index) => (
                <motion.div
                  key={sponsorship.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-all">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarImage src={sponsorship.child.photoUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-xl font-medium">
                        {sponsorship.child.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg">
                        {sponsorship.child.firstName} {sponsorship.child.lastName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {sponsorship.child.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Since {format(new Date(sponsorship.startDate), "MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-2">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        ${sponsorship.monthlyAmount}/mo
                      </Badge>
                      <div className="flex gap-2">
                        <Link href={`/child/${sponsorship.childId}`}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState
              icon={Heart}
              title="No Active Sponsorships"
              description="Start making a difference in a child's life by sponsoring them today."
            />
          )}
        </CardContent>
      </Card>

      {/* Available Children to Sponsor */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Children Waiting for Sponsors</CardTitle>
              <CardDescription>Choose a child to support their education and well-being</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAvailable ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredAvailableChildren && filteredAvailableChildren.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAvailableChildren.map((child) => (
                <ChildCard key={child.id} child={child} linkPrefix="/child" actionLabel="View" />
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
              description="Thanks to generous sponsors, all children have found support. Check back soon for new children in need."
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel Sponsorship"
        description={`Are you sure you want to cancel your sponsorship of ${selectedSponsorship?.child.firstName} ${selectedSponsorship?.child.lastName}? This action cannot be undone.`}
        onConfirm={() => selectedSponsorship && cancelSponsorshipMutation.mutate(selectedSponsorship.id)}
        isPending={cancelSponsorshipMutation.isPending}
        confirmLabel="Yes, Cancel"
        pendingLabel="Cancelling..."
        cancelLabel="Keep Sponsorship"
        destructive
      />
    </div>
  );
}
