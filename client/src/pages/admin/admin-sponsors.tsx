import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { DashboardEmptyState, ConfirmDialog } from "@/components/dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Calendar,
  DollarSign,
  Heart,
  Eye,
  Baby,
  UserCheck,
  Activity,
  Ban,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  UserX,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import type { Child, User, Sponsorship, Payment } from "@shared/schema";
import { format } from "date-fns";

interface SponsorshipWithDetails extends Sponsorship {
  sponsor: User;
  child: Child;
}

export default function AdminSponsors() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sponsors");
  const [selectedSponsor, setSelectedSponsor] = useState<User | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<User | null>(null);
  const [deletingSponsor, setDeletingSponsor] = useState<User | null>(null);
  const [cancellingSponsorship, setCancellingSponsorship] = useState<SponsorshipWithDetails | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", address: "" });

  const { data: sponsors, isLoading: loadingSponsors } = useQuery<User[]>({
    queryKey: ["/api/admin/sponsors"],
  });

  const { data: sponsorships, isLoading: loadingSponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/admin/sponsorships"],
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  // Edit sponsor mutation
  const editSponsorMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<User> }) => {
      const res = await apiRequest("PUT", `/api/admin/sponsors/${data.id}`, data.updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsors"] });
      toast({ title: "Success", description: "Sponsor updated successfully" });
      setEditingSponsor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete sponsor mutation
  const deleteSponsorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/sponsors/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsorships"] });
      toast({ title: "Success", description: "Sponsor deleted successfully" });
      setDeletingSponsor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Cancel sponsorship mutation
  const cancelSponsorshipMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/sponsorships/${id}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsors"] });
      toast({ title: "Success", description: "Sponsorship cancelled successfully" });
      setCancellingSponsorship(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Handle edit sponsor
  const handleEditSponsor = (sponsor: User) => {
    setEditForm({
      firstName: sponsor.firstName,
      lastName: sponsor.lastName,
      email: sponsor.email,
      phone: sponsor.phone || "",
      address: sponsor.address || "",
    });
    setEditingSponsor(sponsor);
  };

  // Filter sponsors based on search
  const filteredSponsors = sponsors?.filter((sponsor) => {
    const matchesSearch =
      searchQuery === "" ||
      `${sponsor.firstName} ${sponsor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sponsor.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Get sponsor stats
  const getSponsorStats = (sponsorId: number) => {
    const sponsorSponsorships = sponsorships?.filter((s) => s.sponsorId === sponsorId) || [];
    const activeSponsorships = sponsorSponsorships.filter((s) => s.status === "active");
    const sponsorPayments = payments?.filter((p) => 
      sponsorSponsorships.some((s) => s.id === p.sponsorshipId)
    ) || [];
    const totalPaid = sponsorPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    return {
      totalChildren: sponsorSponsorships.length,
      activeChildren: activeSponsorships.length,
      totalPaid,
      monthlyAmount: activeSponsorships.reduce((sum, s) => sum + parseFloat(s.monthlyAmount), 0),
    };
  };

  // Get sponsorships for a specific sponsor
  const getSponsorSponsorships = (sponsorId: number) => {
    return sponsorships?.filter((s) => s.sponsorId === sponsorId) || [];
  };

  const activeSponsors = sponsors?.filter((s) => {
    const activeSponsorships = sponsorships?.filter(
      (sp) => sp.sponsorId === s.id && sp.status === "active"
    );
    return activeSponsorships && activeSponsorships.length > 0;
  }).length || 0;

  const totalMonthlyRevenue = sponsorships
    ?.filter((s) => s.status === "active")
    .reduce((sum, s) => sum + parseFloat(s.monthlyAmount), 0) || 0;

  const totalLifetimeRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sponsors & Sponsorships</h1>
          <p className="text-muted-foreground">
            Manage sponsors and their sponsorship relationships
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sponsors</p>
                <p className="text-2xl font-bold">{sponsors?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sponsors</p>
                <p className="text-2xl font-bold text-green-600">{activeSponsors}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-blue-600">${totalMonthlyRevenue.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Lifetime Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${totalLifetimeRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sponsors" className="gap-2">
            <Users className="w-4 h-4" />
            Sponsors
          </TabsTrigger>
          <TabsTrigger value="sponsorships" className="gap-2">
            <Heart className="w-4 h-4" />
            Sponsorships
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sponsors" className="mt-4 space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sponsors by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sponsors Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sponsors</CardTitle>
              <CardDescription>
                {filteredSponsors?.length || 0} sponsors found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSponsors ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))}
                </div>
              ) : filteredSponsors && filteredSponsors.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Sponsor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Children</TableHead>
                        <TableHead>Monthly</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredSponsors.map((sponsor) => {
                          const stats = getSponsorStats(sponsor.id);
                          return (
                            <motion.tr
                              key={sponsor.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={sponsor.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {sponsor.firstName[0]}
                                      {sponsor.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {sponsor.firstName} {sponsor.lastName}
                                    </p>
                                    {stats.activeChildren > 0 && (
                                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                        Active Sponsor
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-muted-foreground" />
                                  <span className="truncate max-w-[200px]">{sponsor.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>{format(new Date(sponsor.createdAt), "MMM d, yyyy")}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Baby className="w-4 h-4 text-muted-foreground" />
                                  <span>{stats.activeChildren}</span>
                                  {stats.totalChildren > stats.activeChildren && (
                                    <span className="text-xs text-muted-foreground">
                                      (of {stats.totalChildren})
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-medium">
                                  ${stats.monthlyAmount}/mo
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-green-600">
                                  ${stats.totalPaid.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSelectedSponsor(sponsor)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditSponsor(sponsor)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Sponsor
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => setDeletingSponsor(sponsor)}
                                      disabled={stats.activeChildren > 0}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Sponsor
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                  icon={Users}
                  title="No sponsors found"
                  description={
                    searchQuery
                      ? "Try adjusting your search"
                      : "Sponsors will appear here when they register"
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsorships" className="mt-4 space-y-4">
          {/* Sponsorships Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Sponsorships</CardTitle>
              <CardDescription>
                {sponsorships?.length || 0} sponsorship relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSponsorships ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <TableRowSkeleton key={i} columns={6} />
                  ))}
                </div>
              ) : sponsorships && sponsorships.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Sponsor</TableHead>
                        <TableHead>Child</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {sponsorships.map((sponsorship) => (
                          <motion.tr
                            key={sponsorship.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sponsorship.sponsor.avatarUrl || undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {sponsorship.sponsor.firstName[0]}
                                    {sponsorship.sponsor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {sponsorship.sponsor.firstName} {sponsorship.sponsor.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={sponsorship.child.photoUrl || undefined} />
                                  <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                    {sponsorship.child.firstName[0]}
                                    {sponsorship.child.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span>
                                  {sponsorship.child.firstName} {sponsorship.child.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{format(new Date(sponsorship.startDate), "MMM d, yyyy")}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-medium">
                                ${sponsorship.monthlyAmount}/mo
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  sponsorship.status === "active"
                                    ? "default"
                                    : sponsorship.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {sponsorship.status === "active" && (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                {sponsorship.status === "cancelled" && (
                                  <Ban className="w-3 h-3 mr-1" />
                                )}
                                {sponsorship.status.charAt(0).toUpperCase() + sponsorship.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedSponsor(sponsorship.sponsor)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Sponsor
                                  </DropdownMenuItem>
                                  {sponsorship.status === "active" && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => setCancellingSponsorship(sponsorship)}
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Cancel Sponsorship
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <DashboardEmptyState
                  icon={Heart}
                  title="No sponsorships yet"
                  description="Sponsorships will appear here when sponsors support children"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sponsor Detail Dialog */}
      <Dialog open={!!selectedSponsor} onOpenChange={(open) => !open && setSelectedSponsor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sponsor Details</DialogTitle>
            <DialogDescription>
              View sponsor information and sponsorship history
            </DialogDescription>
          </DialogHeader>
          {selectedSponsor && (
            <div className="space-y-6">
              {/* Sponsor Info */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedSponsor.avatarUrl || undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {selectedSponsor.firstName[0]}
                    {selectedSponsor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedSponsor.firstName} {selectedSponsor.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedSponsor.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {format(new Date(selectedSponsor.createdAt), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  const stats = getSponsorStats(selectedSponsor.id);
                  return (
                    <>
                      <div className="p-4 rounded-lg bg-primary/5 text-center">
                        <p className="text-2xl font-bold text-primary">{stats.activeChildren}</p>
                        <p className="text-sm text-muted-foreground">Active Sponsorships</p>
                      </div>
                      <div className="p-4 rounded-lg bg-green-500/5 text-center">
                        <p className="text-2xl font-bold text-green-600">${stats.monthlyAmount}</p>
                        <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-500/5 text-center">
                        <p className="text-2xl font-bold text-purple-600">${stats.totalPaid.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total Contributed</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Sponsored Children */}
              <div>
                <h4 className="font-medium mb-3">Sponsored Children</h4>
                <div className="space-y-2">
                  {getSponsorSponsorships(selectedSponsor.id).length > 0 ? (
                    getSponsorSponsorships(selectedSponsor.id).map((sp) => (
                      <div
                        key={sp.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={sp.child.photoUrl || undefined} />
                            <AvatarFallback className="bg-accent/10 text-accent">
                              {sp.child.firstName[0]}
                              {sp.child.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {sp.child.firstName} {sp.child.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sp.child.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={sp.status === "active" ? "default" : "secondary"}
                          >
                            {sp.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            ${sp.monthlyAmount}/mo
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No sponsorships found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sponsor Dialog */}
      <Dialog open={!!editingSponsor} onOpenChange={(open) => !open && setEditingSponsor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
            <DialogDescription>
              Update sponsor information
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingSponsor) {
                editSponsorMutation.mutate({
                  id: editingSponsor.id,
                  updates: editForm,
                });
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingSponsor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editSponsorMutation.isPending}>
                {editSponsorMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Sponsor Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingSponsor}
        onOpenChange={(open) => !open && setDeletingSponsor(null)}
        title="Delete Sponsor"
        description={
          deletingSponsor
            ? `Are you sure you want to delete ${deletingSponsor.firstName} ${deletingSponsor.lastName}? This action cannot be undone and will remove all their payment history.`
            : ""
        }
        confirmLabel="Delete Sponsor"
        destructive={true}
        isPending={deleteSponsorMutation.isPending}
        onConfirm={() => {
          if (deletingSponsor) {
            deleteSponsorMutation.mutate(deletingSponsor.id);
          }
        }}
      />

      {/* Cancel Sponsorship Confirmation Dialog */}
      <ConfirmDialog
        open={!!cancellingSponsorship}
        onOpenChange={(open) => !open && setCancellingSponsorship(null)}
        title="Cancel Sponsorship"
        description={
          cancellingSponsorship
            ? `Are you sure you want to cancel the sponsorship between ${cancellingSponsorship.sponsor.firstName} ${cancellingSponsorship.sponsor.lastName} and ${cancellingSponsorship.child.firstName} ${cancellingSponsorship.child.lastName}? This will stop the subscription and make the child available for new sponsors.`
            : ""
        }
        confirmLabel="Cancel Sponsorship"
        destructive={true}
        isPending={cancelSponsorshipMutation.isPending}
        onConfirm={() => {
          if (cancellingSponsorship) {
            cancelSponsorshipMutation.mutate(cancellingSponsorship.id);
          }
        }}
      />
    </div>
  );
}
