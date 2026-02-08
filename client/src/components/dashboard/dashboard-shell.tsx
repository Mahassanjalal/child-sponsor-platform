import { ReactNode, useState } from "react";
import { Link, useLocation, Switch, Route } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
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
  Baby,
  BarChart3,
  Shield,
  Mail,
  Sparkles,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
  matchPaths?: string[]; // Additional paths that should highlight this nav item
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
      { 
        label: "Dashboard", 
        href: "/dashboard", 
        icon: LayoutDashboard, 
        description: "Overview of your sponsorships",
        matchPaths: ["/dashboard"]
      },
    ],
  },
  {
    title: "Sponsorship",
    items: [
      { 
        label: "My Children", 
        href: "/my-children", 
        icon: Baby, 
        description: "Children you sponsor",
        matchPaths: ["/my-children", "/child"]
      },
      { 
        label: "Reports", 
        href: "/reports", 
        icon: FileText, 
        description: "Progress reports",
        matchPaths: ["/reports"]
      },
      { 
        label: "Payments", 
        href: "/payments", 
        icon: CreditCard, 
        description: "Payment history",
        matchPaths: ["/payments"]
      },
    ],
  },
  {
    title: "Account",
    items: [
      { 
        label: "Profile", 
        href: "/profile", 
        icon: UserCircle, 
        description: "Manage your profile",
        matchPaths: ["/profile"]
      },
      { 
        label: "Contact Us", 
        href: "/contact", 
        icon: Mail, 
        description: "Get in touch",
        matchPaths: ["/contact"]
      },
    ],
  },
];

// Navigation items for admins
const adminNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { 
        label: "Dashboard", 
        href: "/admin", 
        icon: LayoutDashboard, 
        description: "Admin overview",
        matchPaths: ["/admin"]
      },
    ],
  },
  {
    title: "Management",
    items: [
      { 
        label: "Children", 
        href: "/admin/children", 
        icon: Baby, 
        description: "Manage children",
        matchPaths: ["/admin/children"]
      },
      { 
        label: "Sponsors", 
        href: "/admin/sponsors", 
        icon: Users, 
        description: "Manage sponsors",
        matchPaths: ["/admin/sponsors"]
      },
      { 
        label: "Reports", 
        href: "/admin/reports", 
        icon: FileText, 
        description: "Manage reports",
        matchPaths: ["/admin/reports"]
      },
      { 
        label: "Payments", 
        href: "/admin/payments", 
        icon: CreditCard, 
        description: "View payments",
        matchPaths: ["/admin/payments"]
      },
    ],
  },
  {
    title: "Account",
    items: [
      { 
        label: "Profile", 
        href: "/profile", 
        icon: UserCircle, 
        description: "Admin profile",
        matchPaths: ["/profile"]
      },
      { 
        label: "Settings", 
        href: "/admin/settings", 
        icon: Settings, 
        description: "Platform settings",
        matchPaths: ["/admin/settings"]
      },
    ],
  },
];

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navSections = isAdmin ? adminNavSections : sponsorNavSections;

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  // Check if current path matches nav item
  const isActive = (item: NavItem) => {
    if (location === item.href) return true;
    if (item.matchPaths) {
      return item.matchPaths.some(path => location.startsWith(path));
    }
    return false;
  };

  // Get current page title based on location
  const getCurrentPageInfo = () => {
    for (const section of navSections) {
      for (const item of section.items) {
        if (isActive(item)) {
          return { title: item.label, description: item.description };
        }
      }
    }
    return { title: "Dashboard", description: "Overview" };
  };

  const pageInfo = getCurrentPageInfo();

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
                  const active = isActive(item);
                  
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
                            "w-full justify-start gap-3 h-11 transition-all",
                            active && "bg-primary/10 text-primary border border-primary/20 shadow-sm",
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full justify-start gap-3 h-auto py-2 hover:bg-muted/50",
              isCollapsed && !mobile && "justify-center px-2 w-auto"
            )}>
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10">
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
          <DropdownMenuContent align={isCollapsed && !mobile ? "center" : "end"} className="w-56">
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
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border/50 transition-all duration-300 hidden lg:block shadow-sm",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}>
        <NavContent />
        
        {/* Collapse Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted z-50"
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
        isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
      )}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-background/95 border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
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

              {/* Page Title - Desktop */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold">{pageInfo.title}</h1>
                {pageInfo.description && (
                  <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="relative hidden md:flex"
                  >
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pr-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex"
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}
              </AnimatePresence>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </Button>

              <ThemeToggle />

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

        {/* Page Content with Animation */}
        <main className="p-4 lg:p-6">
          {/* Mobile Title */}
          <div className="mb-6 sm:hidden">
            <h1 className="text-2xl font-bold">{pageInfo.title}</h1>
            {pageInfo.description && (
              <p className="text-sm text-muted-foreground mt-1">{pageInfo.description}</p>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
