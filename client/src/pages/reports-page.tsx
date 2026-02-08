import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  DashboardEmptyState,
} from "@/components/dashboard";
import { ProfessionalReportCard, ReportViewer } from "@/components/report-viewer";
import { HoverScale } from "@/components/animated-container";
import { ReportCardSkeleton } from "@/components/loading-skeleton";
import {
  FileText,
  Search,
  Download,
  Filter,
  Calendar,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from "lucide-react";
import type { Child, Report, User as UserType } from "@shared/schema";

interface ReportWithDetails extends Report {
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);

  const { data: reports, isLoading } = useQuery<ReportWithDetails[]>({
    queryKey: ["/api/reports/my/detailed"],
  });

  // Filter and sort reports
  const filteredReports = reports
    ?.filter((report) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        report.title.toLowerCase().includes(searchLower) ||
        report.content.toLowerCase().includes(searchLower) ||
        report.child?.firstName.toLowerCase().includes(searchLower) ||
        report.child?.lastName.toLowerCase().includes(searchLower) ||
        report.child?.location.toLowerCase().includes(searchLower)
      );
    })
    ?.sort((a, b) => {
      const dateA = new Date(a.reportDate).getTime();
      const dateB = new Date(b.reportDate).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Group reports by child
  const reportsByChild = filteredReports?.reduce((acc, report) => {
    const childId = report.childId;
    if (!acc[childId]) {
      acc[childId] = {
        child: report.child,
        reports: [],
      };
    }
    acc[childId].reports.push(report);
    return acc;
  }, {} as Record<number, { child?: Child; reports: ReportWithDetails[] }>);

  const handleExportAll = () => {
    if (!reports || reports.length === 0) {
      toast({
        title: "No Reports",
        description: "There are no reports to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Report ID", "Date", "Title", "Child Name", "Child Location", "Content"];
    const rows = reports.map((r) => [
      r.id.toString(),
      format(new Date(r.reportDate), "yyyy-MM-dd"),
      r.title,
      r.child ? `${r.child.firstName} ${r.child.lastName}` : "N/A",
      r.child?.location || "N/A",
      r.content.substring(0, 200) + (r.content.length > 200 ? "..." : ""),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${reports.length} report(s) exported successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports by title, child name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
              >
                {sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-end">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Stats */}
      {reports && reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{reports.length}</div>
              <div className="text-sm text-muted-foreground">Total Reports</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-accent">
                {Object.keys(reportsByChild || {}).length}
              </div>
              <div className="text-sm text-muted-foreground">Children</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-chart-3">
                {reports.filter((r) => r.photoUrl).length}
              </div>
              <div className="text-sm text-muted-foreground">With Photos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-chart-4">
                {reports.length > 0
                  ? format(new Date(reports[0].reportDate), "MMM yyyy")
                  : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Latest Report</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports List */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredReports && filteredReports.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredReports.map((report) => (
              <HoverScale key={report.id}>
                <ProfessionalReportCard
                  report={report}
                  child={report.child}
                  sponsor={report.sponsor}
                />
              </HoverScale>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : searchQuery ? (
        <DashboardEmptyState
          icon={Search}
          title={`No reports found matching "${searchQuery}"`}
          description="Try a different search term or clear the filter."
          action={
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          }
        />
      ) : (
        <DashboardEmptyState
          icon={FileText}
          title="No reports yet"
          description="Reports will appear here once you sponsor a child. You'll receive monthly progress updates with photos and detailed information about your sponsored child's development."
        />
      )}

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          child={selectedReport.child}
          sponsor={selectedReport.sponsor}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
