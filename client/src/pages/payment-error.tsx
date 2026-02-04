import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AnimatedContainer,
  PageTransition,
} from "@/components/animated-container";
import {
  Heart,
  XCircle,
  RefreshCw,
  CreditCard,
  Mail,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

const errorReasons = [
  {
    icon: CreditCard,
    title: "Card Declined",
    description: "Your card may have been declined due to insufficient funds or spending limits.",
  },
  {
    icon: AlertTriangle,
    title: "Expired Card",
    description: "Please check if your card has expired and update your payment method.",
  },
  {
    icon: XCircle,
    title: "Invalid Details",
    description: "The card number, expiration date, or CVV may have been entered incorrectly.",
  },
];

export default function PaymentErrorPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const errorMessage = params.get("message") || "Your payment could not be processed.";

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

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <AnimatedContainer>
              <Card className="text-center">
                <CardHeader className="pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <XCircle className="w-10 h-10 text-destructive" />
                  </motion.div>
                  <CardTitle className="text-2xl">Payment Failed</CardTitle>
                  <CardDescription className="text-base">
                    {errorMessage}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Don't worry - no charges have been made to your account. 
                      You can try again with a different payment method.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-left">Common Reasons for Payment Failure:</h3>
                    <div className="space-y-3">
                      {errorReasons.map((reason, index) => (
                        <div key={index} className="flex items-start gap-3 text-left p-3 rounded-lg bg-muted/30">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <reason.icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{reason.title}</p>
                            <p className="text-xs text-muted-foreground">{reason.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      onClick={() => window.history.back()} 
                      className="flex-1"
                      data-testid="button-try-again"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="outline" className="w-full" data-testid="button-go-dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      Still having trouble? Contact our support team.
                    </p>
                    <Link href="/contact">
                      <Button variant="ghost" size="sm" data-testid="button-contact-support">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
