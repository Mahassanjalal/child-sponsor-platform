import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Heart,
  LogOut,
  FileText,
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  Bell,
  Search,
  Home,
  Baby,
  PlusCircle,
  BarChart3,
  Shield,
  Mail,
  Sparkles,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Navigation items for sponsors
const sponsorNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview of your sponsorships" },
      { label: "My Children", href: "/dashboard?tab=children", icon: Baby, description: "Children you sponsor" },
    ],
  },
  {
    title: "Activity",
    items: [
      { label: "Reports", href: "/reports", icon: FileText, description: "Progress reports" },
      { label: "Payments", href: "/dashboard?tab=payments", icon: CreditCard, description: "Payment history" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle, description: "Manage your profile" },
      { label: "Contact Us", href: "/contact", icon: Mail, description: "Get in touch" },
    ],
  },
];

// Navigation items for admins
const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, description: "Admin overview" },
      { label: "Analytics", href: "/admin?tab=overview", icon: BarChart3, description: "Platform analytics" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Children", href: "/admin?tab=children", icon: Baby, description: "Manage children" },
      { label: "Sponsors", href: "/admin?tab=sponsors", icon: Users, description: "Manage sponsors" },
      { label: "Sponsorships", href: "/admin?tab=sponsorships", icon: Heart, description: "View sponsorships" },
      { label: "Reports", href: "/admin?tab=reports", icon: FileText, description: "Manage reports" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle, description: "Admin profile" },
      { label: "Settings", href: "/admin?tab=settings", icon: Settings, description: "Platform settings" },
    ],
  },
];

interface UnifiedDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function UnifiedDashboardLayout({
  children,
  title,
  subtitle,
  actions,
}: UnifiedDashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navSections = isAdmin ? adminNavSections : sponsorNavSections;

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href.includes("?")) {
      return location === href.split("?")[0];
    }
    return location === href;
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border/50",
        isCollapsed && !mobile && "justify-center px-2"
      )}>
        <Link href="/">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {(!isCollapsed || mobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap"
                >
                  HopeConnect
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {(!isCollapsed || mobile) && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  const NavButton = (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => mobile && setIsMobileOpen(false)}
                      >
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-11",
                            active && "bg-primary/10 text-primary border border-primary/20",
                            isCollapsed && !mobile && "justify-center px-2"
                          )}
                        >
                          <Icon className={cn("w-5 h-5 shrink-0", active && "text-primary")} />
                          {(!isCollapsed || mobile) && (
                            <span className="truncate">{item.label}</span>
                          )}
                          {(!isCollapsed || mobile) && item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </motion.div>
                    </Link>
                  );

                  if (isCollapsed && !mobile) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>
                          {NavButton}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex flex-col">
                          <span className="font-medium">{item.label}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground">{item.description}</span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return NavButton;
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className={cn(
        "border-t border-border/50 p-4",
        isCollapsed && !mobile && "px-2"
      )}>
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && !mobile && "justify-center"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "w-full justify-start gap-3 h-auto py-2",
                isCollapsed && !mobile && "justify-center px-2 w-auto"
              )}>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {(!isCollapsed || mobile) && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {isAdmin ? (
                        <>
                          <Shield className="w-3 h-3" />
                          Administrator
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Sponsor
                        </>
                      )}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user?.firstName} {user?.lastName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="cursor-pointer">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border/50 transition-all duration-300 hidden lg:block",
        isCollapsed ? "w-[70px]" : "w-[260px]"
      )}>
        <NavContent />
        
        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px]">
          <NavContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn(
        "min-h-screen transition-all duration-300",
        isCollapsed ? "lg:pl-[70px]" : "lg:pl-[260px]"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Page Title */}
              {title && (
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search (placeholder for future) */}
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="w-5 h-5" />
              </Button>

              {/* Notifications (placeholder for future) */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              </Button>

              <ThemeToggle />

              {/* Actions */}
              {actions}

              {/* Mobile User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.firstName} {user?.lastName}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <UserCircle className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {/* Mobile Title */}
          {title && (
            <div className="mb-6 sm:hidden">
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}

// Stat Card Component for dashboard statistics
interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-3xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.value >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5">
          <Icon className="h-32 w-32" />
        </div>
      </div>
    </motion.div>
  );
}

// Quick Action Card
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color?: "primary" | "accent" | "success";
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color = "primary",
}: QuickActionProps) {
  const colorClasses = {
    primary: "from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
    accent: "from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70",
    success: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
  };

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-xl p-6 text-white cursor-pointer bg-gradient-to-br shadow-lg transition-all",
          colorClasses[color]
        )}
      >
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-white/20 p-3">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Icon className="h-24 w-24" />
        </div>
      </motion.div>
    </Link>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action}
    </motion.div>
  );
}
