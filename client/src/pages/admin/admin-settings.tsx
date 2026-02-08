import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Globe,
  Mail,
  CreditCard,
  Bell,
  Shield,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteDescription: z.string().min(10, "Description must be at least 10 characters"),
  contactEmail: z.string().email("Invalid email address"),
  supportPhone: z.string().optional(),
  defaultMonthlyAmount: z.string().regex(/^\d+(\.\d{2})?$/, "Invalid amount format"),
  currency: z.string().min(1, "Currency is required"),
});

const emailSettingsSchema = z.object({
  welcomeEmailSubject: z.string().min(1, "Subject is required"),
  welcomeEmailEnabled: z.boolean(),
  reportNotificationEnabled: z.boolean(),
  paymentReceiptEnabled: z.boolean(),
  paymentFailedAlertEnabled: z.boolean(),
});

const notificationSettingsSchema = z.object({
  newSponsorNotification: z.boolean(),
  paymentFailureNotification: z.boolean(),
  lowChildAvailabilityAlert: z.boolean(),
  lowChildThreshold: z.string(),
  weeklyReportEnabled: z.boolean(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
type EmailSettingsData = z.infer<typeof emailSettingsSchema>;
type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;

interface IntegrationStatus {
  stripe: {
    connected: boolean;
    mode: string;
    webhookActive: boolean;
  };
  email: {
    connected: boolean;
    provider: string;
  };
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  // Fetch settings from API
  const { data: settingsData, isLoading: loadingSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  // Fetch integration status
  const { data: integrationStatus, isLoading: loadingIntegrations } = useQuery<IntegrationStatus>({
    queryKey: ["/api/admin/integrations/status"],
  });

  // General Settings Form
  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "Child Sponsor Hub",
      siteDescription: "Connect with children around the world and make a difference through monthly sponsorships.",
      contactEmail: "support@childsponsorhub.org",
      supportPhone: "+1 (555) 123-4567",
      defaultMonthlyAmount: "35.00",
      currency: "USD",
    },
  });

  // Email Settings Form
  const emailForm = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      welcomeEmailSubject: "Welcome to Child Sponsor Hub!",
      welcomeEmailEnabled: true,
      reportNotificationEnabled: true,
      paymentReceiptEnabled: true,
      paymentFailedAlertEnabled: true,
    },
  });

  // Notification Settings Form
  const notificationForm = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      newSponsorNotification: true,
      paymentFailureNotification: true,
      lowChildAvailabilityAlert: true,
      lowChildThreshold: "5",
      weeklyReportEnabled: false,
    },
  });

  // Update forms when settings are loaded
  useEffect(() => {
    if (settingsData) {
      generalForm.reset({
        siteName: settingsData.siteName || "Child Sponsor Hub",
        siteDescription: settingsData.siteDescription || "Connect with children around the world and make a difference through monthly sponsorships.",
        contactEmail: settingsData.contactEmail || "support@childsponsorhub.org",
        supportPhone: settingsData.supportPhone || "+1 (555) 123-4567",
        defaultMonthlyAmount: settingsData.defaultMonthlyAmount || "35.00",
        currency: settingsData.currency || "USD",
      });
      emailForm.reset({
        welcomeEmailSubject: settingsData.welcomeEmailSubject || "Welcome to Child Sponsor Hub!",
        welcomeEmailEnabled: settingsData.welcomeEmailEnabled === "true",
        reportNotificationEnabled: settingsData.reportNotificationEnabled === "true",
        paymentReceiptEnabled: settingsData.paymentReceiptEnabled === "true",
        paymentFailedAlertEnabled: settingsData.paymentFailedAlertEnabled === "true",
      });
      notificationForm.reset({
        newSponsorNotification: settingsData.newSponsorNotification === "true",
        paymentFailureNotification: settingsData.paymentFailureNotification === "true",
        lowChildAvailabilityAlert: settingsData.lowChildAvailabilityAlert === "true",
        lowChildThreshold: settingsData.lowChildThreshold || "5",
        weeklyReportEnabled: settingsData.weeklyReportEnabled === "true",
      });
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your settings have been updated successfully.",
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

  const handleGeneralSubmit = (data: GeneralSettingsData) => {
    saveSettingsMutation.mutate({ type: "general", ...data });
  };

  const handleEmailSubmit = (data: EmailSettingsData) => {
    saveSettingsMutation.mutate({ type: "email", ...data });
  };

  const handleNotificationSubmit = (data: NotificationSettingsData) => {
    saveSettingsMutation.mutate({ type: "notifications", ...data });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your platform settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full lg:w-auto">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic platform configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={generalForm.control}
                      name="siteName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Site Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormDescription>
                            Primary contact email for inquiries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generalForm.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="resize-none" rows={3} />
                        </FormControl>
                        <FormDescription>
                          A brief description of your organization's mission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={generalForm.control}
                      name="supportPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1 (555) 000-0000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="defaultMonthlyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Monthly Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input {...field} className="pl-7" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generalForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="CAD">CAD ($)</SelectItem>
                              <SelectItem value="AUD">AUD ($)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure automated email notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-6">
                  <FormField
                    control={emailForm.control}
                    name="welcomeEmailSubject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Welcome Email Subject</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Subject line for new sponsor welcome emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Email Notifications</h4>
                    
                    <FormField
                      control={emailForm.control}
                      name="welcomeEmailEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Welcome Email</FormLabel>
                            <FormDescription>
                              Send welcome email to new sponsors
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="reportNotificationEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Report Notifications</FormLabel>
                            <FormDescription>
                              Notify sponsors when new reports are published
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="paymentReceiptEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Receipts</FormLabel>
                            <FormDescription>
                              Send receipts for successful payments
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="paymentFailedAlertEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Failure Alerts</FormLabel>
                            <FormDescription>
                              Alert sponsors when a payment fails
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Admin Notifications
              </CardTitle>
              <CardDescription>
                Configure notifications for administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="newSponsorNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">New Sponsor Alerts</FormLabel>
                            <FormDescription>
                              Get notified when a new sponsor registers
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="paymentFailureNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Failures</FormLabel>
                            <FormDescription>
                              Get notified when a payment fails
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="lowChildAvailabilityAlert"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Low Availability Alert</FormLabel>
                            <FormDescription>
                              Alert when available children drops below threshold
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="lowChildThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Availability Threshold</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="w-32" />
                          </FormControl>
                          <FormDescription>
                            Number of available children to trigger alert
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="weeklyReportEnabled"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Weekly Summary Report</FormLabel>
                            <FormDescription>
                              Receive a weekly summary of platform activity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saveSettingsMutation.isPending}>
                      {saveSettingsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Integrations & API
              </CardTitle>
              <CardDescription>
                Manage third-party integrations and API settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Integration */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Stripe</h4>
                      <p className="text-sm text-muted-foreground">Payment processing</p>
                    </div>
                  </div>
                  {loadingIntegrations ? (
                    <Skeleton className="h-6 w-24" />
                  ) : integrationStatus?.stripe?.connected ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">API Mode</Label>
                    {loadingIntegrations ? (
                      <Skeleton className="h-5 w-20 mt-1" />
                    ) : (
                      <p className="font-medium capitalize">{integrationStatus?.stripe?.mode || "Not configured"} Mode</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Webhook Status</Label>
                    {loadingIntegrations ? (
                      <Skeleton className="h-5 w-16 mt-1" />
                    ) : (
                      <p className={`font-medium ${integrationStatus?.stripe?.webhookActive ? "text-green-600" : "text-yellow-600"}`}>
                        {integrationStatus?.stripe?.webhookActive ? "Active" : "Inactive"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Provider */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Email Service</h4>
                      <p className="text-sm text-muted-foreground">Transactional emails</p>
                    </div>
                  </div>
                  {loadingIntegrations ? (
                    <Skeleton className="h-6 w-24" />
                  ) : integrationStatus?.email?.connected ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Development Mode
                    </Badge>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Provider</Label>
                    {loadingIntegrations ? (
                      <Skeleton className="h-5 w-20 mt-1" />
                    ) : (
                      <p className="font-medium">{integrationStatus?.email?.provider || "Not configured"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    {loadingIntegrations ? (
                      <Skeleton className="h-5 w-16 mt-1" />
                    ) : (
                      <p className={`font-medium ${integrationStatus?.email?.connected ? "text-green-600" : "text-yellow-600"}`}>
                        {integrationStatus?.email?.connected ? "Production" : "Console Logging"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">API Documentation</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    For API integration details and documentation, contact your system administrator
                    or visit the developer portal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
