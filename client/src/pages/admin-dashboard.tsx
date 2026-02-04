import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  HoverScale,
  PageTransition,
} from "@/components/animated-container";
import { DashboardCardSkeleton, TableRowSkeleton } from "@/components/loading-skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  Users,
  FileText,
  CreditCard,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  BarChart3,
  Loader2,
  Calendar,
} from "lucide-react";
import type { Child, User, Report, Sponsorship, InsertChild, InsertReport } from "@shared/schema";
import { format } from "date-fns";

const childSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  location: z.string().min(1, "Location is required"),
  story: z.string().min(10, "Story must be at least 10 characters"),
  needs: z.string().min(10, "Needs must be at least 10 characters"),
  photoUrl: z.string().optional(),
  monthlyAmount: z.string().default("35.00"),
});

const reportSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  photoUrl: z.string().optional(),
});

type ChildFormData = z.infer<typeof childSchema>;
type ReportFormData = z.infer<typeof reportSchema>;

interface SponsorshipWithDetails extends Sponsorship {
  sponsor: User;
  child: Child;
}

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [deleteChildId, setDeleteChildId] = useState<number | null>(null);
  const [deleteReportId, setDeleteReportId] = useState<number | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

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

  const childForm = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      location: "",
      story: "",
      needs: "",
      photoUrl: "",
      monthlyAmount: "35.00",
    },
  });

  const reportForm = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      childId: "",
      title: "",
      content: "",
      photoUrl: "",
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: ChildFormData) => {
      const res = await apiRequest("POST", "/api/admin/children", {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setIsChildDialogOpen(false);
      childForm.reset();
      toast({
        title: "Child Added",
        description: "The child profile has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const res = await apiRequest("POST", "/api/admin/reports", {
        ...data,
        childId: parseInt(data.childId),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setIsReportDialogOpen(false);
      reportForm.reset();
      toast({
        title: "Report Published",
        description: "The progress report has been published successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/children/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setDeleteChildId(null);
      toast({
        title: "Child Deleted",
        description: "The child profile has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete child",
        variant: "destructive",
      });
      setDeleteChildId(null);
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setDeleteReportId(null);
      toast({
        title: "Report Deleted",
        description: "The report has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
      setDeleteReportId(null);
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ChildFormData }) => {
      const res = await apiRequest("PUT", `/api/admin/children/${id}`, {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setEditingChild(null);
      childForm.reset();
      toast({
        title: "Child Updated",
        description: "The child profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ReportFormData> }) => {
      const res = await apiRequest("PUT", `/api/admin/reports/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      setEditingReport(null);
      reportForm.reset();
      toast({
        title: "Report Updated",
        description: "The report has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    childForm.reset({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: new Date(child.dateOfBirth).toISOString().split('T')[0],
      gender: child.gender,
      location: child.location,
      story: child.story,
      needs: child.needs,
      photoUrl: child.photoUrl || "",
      monthlyAmount: child.monthlyAmount,
    });
  };

  const openEditReport = (report: Report) => {
    setEditingReport(report);
    reportForm.reset({
      childId: report.childId.toString(),
      title: report.title,
      content: report.content,
      photoUrl: report.photoUrl || "",
    });
  };

  const handleChildSubmit = (data: ChildFormData) => {
    if (editingChild) {
      updateChildMutation.mutate({ id: editingChild.id, data });
    } else {
      createChildMutation.mutate(data);
    }
  };

  const handleReportSubmit = (data: ReportFormData) => {
    if (editingReport) {
      updateReportMutation.mutate({ id: editingReport.id, data: { title: data.title, content: data.content, photoUrl: data.photoUrl } });
    } else {
      createReportMutation.mutate(data);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  const totalChildren = children?.length || 0;
  const sponsoredChildren = children?.filter(c => c.isSponsored).length || 0;
  const totalSponsors = sponsors?.length || 0;
  const totalReports = reports?.length || 0;

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
                <Badge variant="secondary" className="ml-2">Admin</Badge>
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/profile">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AnimatedContainer>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage children, sponsors, reports, and sponsorships
              </p>
            </div>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loadingChildren || loadingSponsors ? (
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
                          Total Children
                        </CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalChildren}</div>
                        <p className="text-xs text-muted-foreground">
                          {sponsoredChildren} sponsored
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Active Sponsors
                        </CardTitle>
                        <Heart className="h-4 w-4 text-accent" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalSponsors}</div>
                        <p className="text-xs text-muted-foreground">Registered sponsors</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total Reports
                        </CardTitle>
                        <FileText className="h-4 w-4 text-chart-3" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalReports}</div>
                        <p className="text-xs text-muted-foreground">Published reports</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>

                <StaggerItem>
                  <HoverScale>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Sponsorship Rate
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-chart-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {totalChildren > 0 ? Math.round((sponsoredChildren / totalChildren) * 100) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Children sponsored</p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              </>
            )}
          </StaggerContainer>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" data-testid="admin-tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="children" data-testid="admin-tab-children">Children</TabsTrigger>
              <TabsTrigger value="sponsors" data-testid="admin-tab-sponsors">Sponsors</TabsTrigger>
              <TabsTrigger value="reports" data-testid="admin-tab-reports">Reports</TabsTrigger>
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Sponsorships</CardTitle>
                        <CardDescription>Latest sponsorship activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingSponsorships ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-muted" />
                                <div className="flex-1 space-y-1">
                                  <div className="h-4 w-3/4 bg-muted rounded" />
                                  <div className="h-3 w-1/2 bg-muted rounded" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : sponsorships && sponsorships.length > 0 ? (
                          <div className="space-y-3">
                            {sponsorships.slice(0, 5).map((sp) => (
                              <motion.div
                                key={sp.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                                whileHover={{ x: 4 }}
                              >
                                <Avatar>
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {sp.sponsor.firstName[0]}{sp.sponsor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{sp.sponsor.firstName} sponsors {sp.child.firstName}</p>
                                  <p className="text-sm text-muted-foreground">${sp.monthlyAmount}/month</p>
                                </div>
                                <Badge variant="secondary">{sp.status}</Badge>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No sponsorships yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <Dialog open={isChildDialogOpen} onOpenChange={setIsChildDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="justify-start" variant="outline" data-testid="button-add-child">
                              <Plus className="w-4 h-4 mr-2" />
                              Add New Child
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add New Child</DialogTitle>
                              <DialogDescription>
                                Create a new child profile for sponsorship
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...childForm}>
                              <form onSubmit={childForm.handleSubmit((data) => createChildMutation.mutate(data))} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={childForm.control}
                                    name="firstName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} data-testid="input-child-first-name" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={childForm.control}
                                    name="lastName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                          <Input {...field} data-testid="input-child-last-name" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={childForm.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl>
                                          <Input type="date" {...field} data-testid="input-child-dob" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={childForm.control}
                                    name="gender"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger data-testid="select-child-gender">
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={childForm.control}
                                  name="location"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Location</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="City, Country" data-testid="input-child-location" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={childForm.control}
                                  name="story"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Story</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} placeholder="Tell us about this child..." className="resize-none" data-testid="input-child-story" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={childForm.control}
                                  name="needs"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Needs</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} placeholder="What does this child need support with?" className="resize-none" data-testid="input-child-needs" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={childForm.control}
                                  name="monthlyAmount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Monthly Amount ($)</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" {...field} data-testid="input-child-amount" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full"
                                  disabled={createChildMutation.isPending}
                                  data-testid="button-submit-child"
                                >
                                  {createChildMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Creating...
                                    </>
                                  ) : (
                                    "Add Child"
                                  )}
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="justify-start" variant="outline" data-testid="button-add-report">
                              <FileText className="w-4 h-4 mr-2" />
                              Publish Progress Report
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Publish Progress Report</DialogTitle>
                              <DialogDescription>
                                Create a progress report for a sponsored child
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...reportForm}>
                              <form onSubmit={reportForm.handleSubmit((data) => createReportMutation.mutate(data))} className="space-y-4">
                                <FormField
                                  control={reportForm.control}
                                  name="childId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Child</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-report-child">
                                            <SelectValue placeholder="Select a child" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {children?.filter(c => c.isSponsored).map((child) => (
                                            <SelectItem key={child.id} value={child.id.toString()}>
                                              {child.firstName} {child.lastName}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={reportForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Title</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="Monthly Progress Update" data-testid="input-report-title" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={reportForm.control}
                                  name="content"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Content</FormLabel>
                                      <FormControl>
                                        <Textarea {...field} placeholder="Share updates about the child's progress..." className="min-h-[120px] resize-none" data-testid="input-report-content" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full"
                                  disabled={createReportMutation.isPending}
                                  data-testid="button-submit-report"
                                >
                                  {createReportMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Publishing...
                                    </>
                                  ) : (
                                    "Publish Report"
                                  )}
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="children" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle>Children</CardTitle>
                        <CardDescription>Manage child profiles</CardDescription>
                      </div>
                      <Dialog open={isChildDialogOpen} onOpenChange={setIsChildDialogOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-add-child-header">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Child
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Age</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Monthly</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingChildren ? (
                              [...Array(5)].map((_, i) => (
                                <TableRowSkeleton key={i} columns={6} />
                              ))
                            ) : children && children.length > 0 ? (
                              children.map((child) => {
                                const age = Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                                return (
                                  <TableRow key={child.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={child.photoUrl || undefined} />
                                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                            {child.firstName[0]}{child.lastName[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{child.firstName} {child.lastName}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{child.location}</TableCell>
                                    <TableCell>{age} years</TableCell>
                                    <TableCell>
                                      <Badge variant={child.isSponsored ? "default" : "secondary"}>
                                        {child.isSponsored ? "Sponsored" : "Available"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>${child.monthlyAmount}</TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => openEditChild(child)}
                                        data-testid={`button-edit-child-${child.id}`}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setDeleteChildId(child.id)}
                                        disabled={child.isSponsored}
                                        data-testid={`button-delete-child-${child.id}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No children added yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sponsors" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sponsors</CardTitle>
                      <CardDescription>View and manage sponsor accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Joined</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingSponsors ? (
                              [...Array(5)].map((_, i) => (
                                <TableRowSkeleton key={i} columns={5} />
                              ))
                            ) : sponsors && sponsors.length > 0 ? (
                              sponsors.map((sponsor) => (
                                <TableRow key={sponsor.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={sponsor.avatarUrl || undefined} />
                                        <AvatarFallback className="bg-accent/10 text-accent text-xs">
                                          {sponsor.firstName[0]}{sponsor.lastName[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{sponsor.firstName} {sponsor.lastName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{sponsor.email}</TableCell>
                                  <TableCell>{sponsor.phone || "-"}</TableCell>
                                  <TableCell>
                                    {format(new Date(sponsor.createdAt), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" data-testid={`button-view-sponsor-${sponsor.id}`}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                  No sponsors registered yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <div>
                        <CardTitle>Progress Reports</CardTitle>
                        <CardDescription>Published reports for sponsored children</CardDescription>
                      </div>
                      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                        <DialogTrigger asChild>
                          <Button data-testid="button-add-report-header">
                            <Plus className="w-4 h-4 mr-2" />
                            New Report
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Child</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loadingReports ? (
                              [...Array(5)].map((_, i) => (
                                <TableRowSkeleton key={i} columns={4} />
                              ))
                            ) : reports && reports.length > 0 ? (
                              reports.map((report) => {
                                const child = children?.find(c => c.id === report.childId);
                                return (
                                  <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell>
                                      {child ? `${child.firstName} ${child.lastName}` : "-"}
                                    </TableCell>
                                    <TableCell>
                                      {format(new Date(report.reportDate), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => openEditReport(report)}
                                        data-testid={`button-edit-report-${report.id}`}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setDeleteReportId(report.id)}
                                        data-testid={`button-delete-report-${report.id}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                  No reports published yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>

      <AlertDialog open={deleteChildId !== null} onOpenChange={(open) => !open && setDeleteChildId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this child profile? This action cannot be undone and will also remove all associated reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-child">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChildId && deleteChildMutation.mutate(deleteChildId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-child"
            >
              {deleteChildMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteReportId !== null} onOpenChange={(open) => !open && setDeleteReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-report">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReportId && deleteReportMutation.mutate(deleteReportId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-report"
            >
              {deleteReportMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editingChild !== null} onOpenChange={(open) => !open && setEditingChild(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Child Profile</DialogTitle>
            <DialogDescription>
              Update the child's information.
            </DialogDescription>
          </DialogHeader>
          <Form {...childForm}>
            <form onSubmit={childForm.handleSubmit(handleChildSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={childForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-child-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={childForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-child-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={childForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-edit-child-dob" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={childForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-child-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={childForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City, Country" data-testid="input-edit-child-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="story"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="input-edit-child-story" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="needs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needs</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} data-testid="input-edit-child-needs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." data-testid="input-edit-child-photo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={childForm.control}
                name="monthlyAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Amount ($)</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-child-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateChildMutation.isPending}
                data-testid="button-update-child"
              >
                {updateChildMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Child"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editingReport !== null} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>
              Update the progress report.
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleReportSubmit)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-report-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reportForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} data-testid="input-edit-report-content" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reportForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." data-testid="input-edit-report-photo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateReportMutation.isPending}
                data-testid="button-update-report"
              >
                {updateReportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Report"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
