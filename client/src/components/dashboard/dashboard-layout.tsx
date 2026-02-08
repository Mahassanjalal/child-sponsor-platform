import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition, AnimatedContainer } from "@/components/animated-container";
import { Heart, LogOut } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  logoutTestId?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  badge,
  logoutTestId = "button-logout",
}: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

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
                {badge && (
                  <Badge variant="secondary" className="ml-2">
                    {badge}
                  </Badge>
                )}
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/profile">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {badge || user?.email}
                    </p>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid={logoutTestId}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AnimatedContainer>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
          </AnimatedContainer>
          {children}
        </main>
      </div>
    </PageTransition>
  );
}
