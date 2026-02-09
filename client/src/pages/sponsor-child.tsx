import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedContainer } from "@/components/animated-container";
import { StripePaymentDialog } from "@/components/stripe-payment-dialog";
import {
  Heart,
  MapPin,
  Calendar,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Gift,
  RefreshCw,
} from "lucide-react";
import type { Child } from "@shared/schema";
import { differenceInYears } from "date-fns";

export default function SponsorChild() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [paymentType, setPaymentType] = useState<"monthly" | "one-time">("monthly");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data: child, isLoading } = useQuery<Child>({
    queryKey: ["/api/children", id],
    enabled: !!id,
  });

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setLocation("/sponsor/success?embedded=true");
  };

  const calculateAge = (dateOfBirth: Date | string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Child Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This child may already be sponsored or the profile was removed.
            </p>
            <Link href="/my-children">
              <Button data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Browse Children
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/child/${child.id}`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Sponsor {child.firstName}</h1>
          <p className="text-muted-foreground">Complete your sponsorship</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedContainer>
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

        <AnimatedContainer>
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
                onClick={() => setShowPaymentDialog(true)}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg"
                data-testid="button-proceed-checkout"
              >
                <Heart className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe. Your payment information is encrypted and secure.
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>

      {/* Stripe Payment Dialog */}
      {child && (
        <StripePaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          childId={child.id}
          childName={`${child.firstName} ${child.lastName}`}
          amount={child.monthlyAmount}
          paymentType={paymentType}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
