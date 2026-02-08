import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardShell } from "@/components/dashboard";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

// Public Pages
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ContactPage from "@/pages/contact";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import PaymentErrorPage from "@/pages/payment-error";
import NotFound from "@/pages/not-found";

// Protected Pages (rendered inside DashboardShell)
import SponsorDashboard from "@/pages/sponsor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile-page";
import SponsorChild from "@/pages/sponsor-child";
import SponsorSuccess from "@/pages/sponsor-success";
import ChildDetailPage from "@/pages/child-detail";
import ReportsPage from "@/pages/reports-page";
import PaymentsPage from "@/pages/payments-page";
import MyChildrenPage from "@/pages/my-children-page";

// Loading component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

// Protected Dashboard Routes - all inside the shell
function ProtectedDashboardRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const isAdmin = user.role === "admin";

  return (
    <DashboardShell>
      <Switch>
        {/* Sponsor Routes */}
        <Route path="/dashboard" component={SponsorDashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/my-children" component={MyChildrenPage} />
        <Route path="/sponsor/child/:id" component={SponsorChild} />
        <Route path="/sponsor/success" component={SponsorSuccess} />
        <Route path="/child/:id" component={ChildDetailPage} />
        <Route path="/contact" component={ContactPage} />
        
        {/* Admin Routes */}
        {isAdmin && (
          <>
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/children" component={AdminDashboard} />
            <Route path="/admin/sponsors" component={AdminDashboard} />
            <Route path="/admin/reports" component={AdminDashboard} />
            <Route path="/admin/payments" component={AdminDashboard} />
            <Route path="/admin/settings" component={AdminDashboard} />
          </>
        )}
        
        {/* Fallback */}
        <Route>
          <Redirect to={isAdmin ? "/admin" : "/dashboard"} />
        </Route>
      </Switch>
    </DashboardShell>
  );
}

// Public Routes
function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/payment-error" component={PaymentErrorPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main Router that decides between public and protected routes
function AppRouter() {
  const [location] = useLocation();
  
  // Define which paths are public (don't need authentication)
  const publicPaths = ["/", "/auth", "/forgot-password", "/reset-password", "/terms", "/privacy", "/payment-error"];
  
  // Check if current path is public
  const isPublicPath = publicPaths.some(path => location === path);
  
  if (isPublicPath) {
    return <PublicRouter />;
  }
  
  // All other routes go through the protected dashboard shell
  return <ProtectedDashboardRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="hopeconnect-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
