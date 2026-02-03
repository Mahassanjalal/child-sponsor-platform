import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition, AnimatedContainer } from "@/components/animated-container";
import {
  Heart,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  LogOut,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Gift,
  RefreshCw,
  Loader2,
} from "lucide-react";
import type { Child } from "@shared/schema";
import { format, differenceInYears } from "date-fns";

export default function SponsorChild() {
  const { id } = useParams<{ id: string }>();
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentType, setPaymentType] = useState<"monthly" | "one-time">("monthly");

  const { data: child, isLoading } = useQuery<Child>({
    queryKey: ["/api/children", id],
    enabled: !!id,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/create-checkout", {
        childId: parseInt(id!),
        paymentType,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  const calculateAge = (dateOfBirth: Date | string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageTransition>
    );
  }

  if (!child) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">Child Not Found</h1>
          <p className="text-muted-foreground">This child may already be sponsored.</p>
          <Link href="/dashboard">
            <Button data-testid="button-back-dashboard">Back to Dashboard</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

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
              </motion.div>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <AnimatedContainer delay={0.1}>
            <div className="flex items-center gap-4 mb-8">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Sponsor {child.firstName}</h1>
                <p className="text-muted-foreground">Complete your sponsorship</p>
              </div>
            </div>
          </AnimatedContainer>

          <div className="grid gap-8 lg:grid-cols-2">
            <AnimatedContainer delay={0.2}>
              <Card className="border-border/50 overflow-hidden">
                <div className="relative h-64 bg-gradient-to-br from-primary/20 to-accent/20">
                  {child.photoUrl ? (
                    <img
                      src={child.photoUrl}
                      alt={`${child.firstName} ${child.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="w-32 h-32">
                        <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-white">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-accent text-accent-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Awaiting Sponsor
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {child.firstName} {child.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{calculateAge(child.dateOfBirth)} years old</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{child.location}</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Story</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {child.story}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Needs</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {child.needs}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>

            <AnimatedContainer delay={0.3}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Choose Your Sponsorship Plan
                  </CardTitle>
                  <CardDescription>
                    Select how you'd like to support {child.firstName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentType}
                    onValueChange={(value) => setPaymentType(value as "monthly" | "one-time")}
                    className="space-y-4"
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        paymentType === "monthly"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentType("monthly")}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="monthly" id="monthly" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="monthly" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-primary" />
                            Monthly Sponsorship
                          </Label>
                          <p className="text-muted-foreground text-sm mt-1">
                            Provide consistent support with automatic monthly payments
                          </p>
                          <div className="flex items-baseline gap-1 mt-3">
                            <span className="text-3xl font-bold text-primary">${child.monthlyAmount}</span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              Regular progress reports
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              Direct impact on education
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              Cancel anytime
                            </li>
                          </ul>
                        </div>
                        {paymentType === "monthly" && (
                          <Badge className="bg-primary text-primary-foreground">
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                        paymentType === "one-time"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setPaymentType("one-time")}
                    >
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="one-time" id="one-time" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="one-time" className="text-lg font-semibold cursor-pointer flex items-center gap-2">
                            <Gift className="w-5 h-5 text-accent" />
                            One-Time Contribution
                          </Label>
                          <p className="text-muted-foreground text-sm mt-1">
                            Make a single contribution to support {child.firstName}
                          </p>
                          <div className="flex items-baseline gap-1 mt-3">
                            <span className="text-3xl font-bold text-accent">${child.monthlyAmount}</span>
                            <span className="text-muted-foreground">one-time</span>
                          </div>
                          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              Immediate impact
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-accent" />
                              No recurring charges
                            </li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  </RadioGroup>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sponsorship Amount</span>
                      <span className="font-medium">${child.monthlyAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Type</span>
                      <span className="font-medium capitalize">{paymentType}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-xl text-primary">${child.monthlyAmount}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => checkoutMutation.mutate()}
                    disabled={checkoutMutation.isPending}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg"
                    data-testid="button-proceed-checkout"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment powered by Stripe. Your payment information is encrypted and secure.
                  </p>
                </CardContent>
              </Card>
            </AnimatedContainer>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
