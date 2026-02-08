import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Calendar,
  MapPin,
  User,
  Heart,
  Phone,
  Mail,
  Home,
  X,
  Printer,
  Eye,
  GraduationCap,
  Clock,
} from "lucide-react";
import type { Report, Child, User as UserType } from "@shared/schema";

interface ReportWithDetails extends Report {
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
}

interface ReportViewerProps {
  report: Report;
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
  onClose?: () => void;
  isOpen?: boolean;
}

export function ReportViewer({ report, child, sponsor, onClose, isOpen = true }: ReportViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const calculateAge = (dateOfBirth: Date | string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Progress Report - ${child?.firstName || 'Child'} ${child?.lastName || ''}</title>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 40px;
              background: white;
              color: #1a1a1a;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #6366f1;
            }
            .logo {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .logo-icon {
              width: 50px;
              height: 50px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
            }
            .logo-text {
              font-size: 24px;
              font-weight: bold;
              background: linear-gradient(90deg, #6366f1, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .report-info {
              text-align: right;
            }
            .report-badge {
              display: inline-block;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              color: white;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .report-date {
              color: #666;
              font-size: 14px;
            }
            .content-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-card {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 24px;
              border: 1px solid #e9ecef;
            }
            .card-title {
              font-size: 14px;
              font-weight: 600;
              color: #6366f1;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-row {
              display: flex;
              margin-bottom: 12px;
              align-items: flex-start;
            }
            .info-label {
              width: 100px;
              font-weight: 600;
              color: #495057;
              font-size: 13px;
            }
            .info-value {
              flex: 1;
              color: #1a1a1a;
              font-size: 13px;
            }
            .child-photo {
              width: 100%;
              max-width: 200px;
              border-radius: 12px;
              margin-bottom: 16px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .report-content-section {
              margin-top: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e9ecef;
            }
            .report-title {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 8px;
            }
            .report-body {
              line-height: 1.8;
              color: #495057;
              font-size: 14px;
              white-space: pre-wrap;
            }
            .report-photo {
              width: 100%;
              max-width: 400px;
              border-radius: 12px;
              margin-top: 20px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .watermark {
              position: fixed;
              bottom: 20px;
              right: 20px;
              opacity: 0.1;
              font-size: 60px;
              font-weight: bold;
              color: #6366f1;
              transform: rotate(-15deg);
            }
          </style>
        </head>
        <body>
          <div class="watermark">HopeConnect</div>
          <div class="header">
            <div class="logo">
              <div class="logo-icon">♥</div>
              <span class="logo-text">HopeConnect</span>
            </div>
            <div class="report-info">
              <div class="report-badge">OFFICIAL PROGRESS REPORT</div>
              <div class="report-date">Report #${report.id} • Generated ${format(new Date(), "MMMM d, yyyy")}</div>
            </div>
          </div>
          
          <div class="content-grid">
            <div class="info-card">
              <div class="card-title">Child Information</div>
              ${child?.photoUrl ? `<img src="${child.photoUrl}" class="child-photo" alt="Child photo" />` : ''}
              <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${child?.firstName || 'N/A'} ${child?.lastName || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Age:</span>
                <span class="info-value">${child?.dateOfBirth ? calculateAge(child.dateOfBirth) + ' years old' : 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Gender:</span>
                <span class="info-value" style="text-transform: capitalize;">${child?.gender || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-value">${child?.location || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Sponsorship:</span>
                <span class="info-value">$${child?.monthlyAmount || '35.00'}/month</span>
              </div>
            </div>
            
            <div class="info-card">
              <div class="card-title">Sponsor Information</div>
              <div class="info-row">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${sponsor?.firstName || 'N/A'} ${sponsor?.lastName || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${sponsor?.email || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${sponsor?.phone || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${sponsor?.address || 'Not provided'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Member Since:</span>
                <span class="info-value">${sponsor?.createdAt ? format(new Date(sponsor.createdAt), "MMMM yyyy") : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div class="info-card" style="margin-bottom: 30px;">
            <div class="card-title">Child's Story & Needs</div>
            <div style="margin-bottom: 16px;">
              <strong style="color: #6366f1;">Story:</strong>
              <p style="margin: 8px 0; color: #495057; line-height: 1.6;">${child?.story || 'No story available'}</p>
            </div>
            <div>
              <strong style="color: #6366f1;">Needs & Goals:</strong>
              <p style="margin: 8px 0; color: #495057; line-height: 1.6;">${child?.needs || 'No needs listed'}</p>
            </div>
          </div>
          
          <div class="report-content-section">
            <div class="section-title">Progress Report Details</div>
            <div class="info-row">
              <span class="info-label">Report Date:</span>
              <span class="info-value">${format(new Date(report.reportDate), "MMMM d, yyyy")}</span>
            </div>
            <h2 class="report-title">${report.title}</h2>
            <p class="report-body">${report.content}</p>
            ${report.photoUrl ? `<img src="${report.photoUrl}" class="report-photo" alt="Report photo" />` : ''}
          </div>
          
          <div class="footer">
            <p>This is an official progress report from HopeConnect Child Sponsorship Program.</p>
            <p>Report ID: ${report.id} • Child ID: ${report.childId} • Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            <p style="margin-top: 10px; font-style: italic;">Thank you for making a difference in a child's life.</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadPDF = () => {
    // For PDF download, we'll use print dialog with PDF option
    handlePrint();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Progress Report
              </DialogTitle>
              <DialogDescription>
                Detailed report for {child?.firstName} {child?.lastName}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div ref={printRef} className="p-6 space-y-6">
            {/* Report Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    HopeConnect
                  </h3>
                  <p className="text-xs text-muted-foreground">Child Sponsorship Program</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                  Official Report
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Report #{report.id}
                </p>
              </div>
            </div>

            <Separator />

            {/* Child and Sponsor Information */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Child Info */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-primary">
                    <User className="w-4 h-4" />
                    Child Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Avatar className="w-20 h-20 rounded-lg">
                      <AvatarImage src={child?.photoUrl || undefined} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl">
                        {child?.firstName?.[0]}{child?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-lg">
                        {child?.firstName} {child?.lastName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {child?.dateOfBirth ? `${calculateAge(child.dateOfBirth)} years old` : 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {child?.location || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground capitalize">
                        <User className="w-3.5 h-3.5" />
                        {child?.gender || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sponsor Info */}
              <Card className="border-accent/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-accent">
                    <Heart className="w-4 h-4" />
                    Sponsor Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Avatar className="w-20 h-20 rounded-lg">
                      <AvatarImage src={sponsor?.avatarUrl || undefined} />
                      <AvatarFallback className="rounded-lg bg-accent/10 text-accent text-xl">
                        {sponsor?.firstName?.[0]}{sponsor?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="font-semibold text-lg">
                        {sponsor?.firstName} {sponsor?.lastName}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        {sponsor?.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {sponsor?.phone || 'Not provided'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Home className="w-3.5 h-3.5" />
                        {sponsor?.address || 'Not provided'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Child Story & Needs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-chart-3" />
                  Child's Story & Needs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-primary mb-2">Story</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {child?.story || 'No story available'}
                  </p>
                </div>
                <Separator />
                <div>
                  <h5 className="text-sm font-medium text-accent mb-2">Needs & Goals</h5>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {child?.needs || 'No needs listed'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Report Content */}
            <Card className="border-2 border-primary/10">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(report.reportDate), "MMMM d, yyyy")}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    <FileText className="w-3 h-3 mr-1" />
                    Progress Report
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {report.photoUrl && (
                  <div className="mb-6">
                    <img
                      src={report.photoUrl}
                      alt={report.title}
                      className="w-full max-h-80 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {report.content}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                This is an official progress report from HopeConnect Child Sponsorship Program.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Report ID: {report.id} • Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                Thank you for making a difference in a child's life. ❤️
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface ReportCardProps {
  report: Report;
  child?: Child;
  sponsor?: Omit<UserType, 'password'>;
  showViewButton?: boolean;
}

export function ProfessionalReportCard({ report, child, sponsor, showViewButton = true }: ReportCardProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const calculateAge = (dateOfBirth: Date | string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {child && (
                <Avatar className="w-12 h-12">
                  <AvatarImage src={child.photoUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {child.firstName?.[0]}{child.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(report.reportDate), "MMMM d, yyyy")}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="shrink-0">
              <FileText className="w-3 h-3 mr-1" />
              Report
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.photoUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={report.photoUrl}
                alt={report.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          {child && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{child.firstName} {child.lastName}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {child.location}
              </div>
              {child.dateOfBirth && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="text-sm text-muted-foreground">
                    {calculateAge(child.dateOfBirth)} years old
                  </div>
                </>
              )}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground line-clamp-3">{report.content}</p>
          
          {showViewButton && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsViewerOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => setIsViewerOpen(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isViewerOpen && (
        <ReportViewer
          report={report}
          child={child}
          sponsor={sponsor}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
}
