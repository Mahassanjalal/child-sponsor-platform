import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { ConfirmDialog, DashboardEmptyState } from "@/components/dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  Search,
  MoreHorizontal,
  Eye,
  Calendar,
  Baby,
  Image,
  ExternalLink,
} from "lucide-react";
import type { Child, Report } from "@shared/schema";
import { format } from "date-fns";

const reportSchema = z.object({
  childId: z.string().min(1, "Child is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  photoUrl: z.string().optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

function ReportFormFields({
  form,
  testIdPrefix = "",
  childrenList,
  showChildSelect = false,
}: {
  form: UseFormReturn<ReportFormData>;
  testIdPrefix?: string;
  childrenList?: Child[];
  showChildSelect?: boolean;
}) {
  const p = testIdPrefix;
  return (
    <>
      {showChildSelect && (
        <FormField
          control={form.control}
          name="childId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid={`select-${p}report-child`}>
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {childrenList
                    ?.filter((c) => c.isSponsored)
                    .map((child) => (
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
      )}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Monthly Progress Update"
                data-testid={`input-${p}report-title`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Share updates about the child's progress..."
                className="min-h-[120px] resize-none"
                data-testid={`input-${p}report-content`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="photoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Photo URL</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="https://..."
                data-testid={`input-${p}report-photo`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export default function AdminReports() {
  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<number | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data: children, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/admin/children"],
  });

  const { data: reports, isLoading: loadingReports } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
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

  const openEditReport = (report: Report) => {
    setEditingReport(report);
    reportForm.reset({
      childId: report.childId.toString(),
      title: report.title,
      content: report.content,
      photoUrl: report.photoUrl || "",
    });
  };

  const handleReportSubmit = (data: ReportFormData) => {
    if (editingReport) {
      updateReportMutation.mutate({ id: editingReport.id, data });
    } else {
      createReportMutation.mutate(data);
    }
  };

  const getChildForReport = (childId: number) => {
    return children?.find((c) => c.id === childId);
  };

  // Filter reports based on search
  const filteredReports = reports?.filter((report) => {
    const child = getChildForReport(report.childId);
    const matchesSearch =
      searchQuery === "" ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${child?.firstName} ${child?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sponsoredChildren = children?.filter((c) => c.isSponsored) || [];
  const thisMonthReports =
    reports?.filter((r) => {
      const reportDate = new Date(r.reportDate);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Progress Reports</h1>
          <p className="text-muted-foreground">
            Create and manage progress reports for sponsored children
          </p>
        </div>
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={sponsoredChildren.length === 0}>
              <Plus className="w-4 h-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Progress Report</DialogTitle>
              <DialogDescription>
                Share updates about a child's progress with their sponsor.
              </DialogDescription>
            </DialogHeader>
            <Form {...reportForm}>
              <form onSubmit={reportForm.handleSubmit(handleReportSubmit)} className="space-y-4">
                <ReportFormFields
                  form={reportForm}
                  childrenList={children}
                  showChildSelect={true}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createReportMutation.isPending}
                >
                  {createReportMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{reports?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600">{thisMonthReports}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Children with Reports</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(reports?.map((r) => r.childId)).size}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Baby className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reports by title or child name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>{filteredReports?.length || 0} reports found</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReports ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))}
            </div>
          ) : filteredReports && filteredReports.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Report</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Has Photo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredReports.map((report) => {
                      const child = getChildForReport(report.childId);
                      return (
                        <motion.tr
                          key={report.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="max-w-[250px]">
                              <p className="font-medium truncate">{report.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {report.content.substring(0, 60)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={child?.photoUrl || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {child?.firstName?.[0]}
                                  {child?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {child?.firstName} {child?.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{format(new Date(report.reportDate), "MMM d, yyyy")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.photoUrl ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                <Image className="w-3 h-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedReport(report)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditReport(report)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteReportId(report.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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
              icon={FileText}
              title="No reports found"
              description={
                searchQuery
                  ? "Try adjusting your search"
                  : sponsoredChildren.length === 0
                  ? "You need sponsored children to create reports"
                  : "Create your first progress report"
              }
            />
          )}
        </CardContent>
      </Card>

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Published on {selectedReport && format(new Date(selectedReport.reportDate), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {/* Child Info */}
              {(() => {
                const child = getChildForReport(selectedReport.childId);
                return child ? (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={child.photoUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {child.firstName[0]}
                        {child.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {child.firstName} {child.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{child.location}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Photo */}
              {selectedReport.photoUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedReport.photoUrl}
                    alt="Report"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedReport.content}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingReport} onOpenChange={(open) => !open && setEditingReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Report</DialogTitle>
            <DialogDescription>Update the progress report.</DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleReportSubmit)} className="space-y-4">
              <ReportFormFields
                form={reportForm}
                testIdPrefix="edit-"
                childrenList={children}
                showChildSelect={false}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={updateReportMutation.isPending}
              >
                {updateReportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteReportId}
        onOpenChange={(open) => !open && setDeleteReportId(null)}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => deleteReportId && deleteReportMutation.mutate(deleteReportId)}
        isPending={deleteReportMutation.isPending}
      />
    </div>
  );
}
