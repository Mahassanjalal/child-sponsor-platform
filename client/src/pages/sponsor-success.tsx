import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedContainer } from "@/components/animated-container";
import {
  Heart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";

export default function SponsorSuccess() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");
  const childId = params.get("child_id");
  const paymentType = params.get("type");

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/confirm-sponsorship", {
        sessionId,
      });
      return res.json();
    },
    onSuccess: () => {
      setStatus("success");
      queryClient.invalidateQueries({ queryKey: ["/api/sponsorships/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
    },
    onError: (error: Error) => {
      setStatus("error");
      setErrorMessage(error.message);
    },
  });

  useEffect(() => {
    if (sessionId) {
      confirmMutation.mutate();
    } else {
      setStatus("error");
      setErrorMessage("Missing session information");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AnimatedContainer>
        <Card className="w-full max-w-md border-border/50 overflow-hidden">
            {status === "loading" && (
              <CardContent className="p-8 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-6"
                >
                  <Loader2 className="w-16 h-16 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Processing Your Sponsorship</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </CardContent>
            )}

            {status === "success" && (
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">Thank You!</h2>
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground mb-6">
                    Your sponsorship has been confirmed. You're now making a difference in a child's life!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="flex items-center justify-center gap-2 text-primary mb-2">
                      <Heart className="w-5 h-5 fill-current" />
                      <span className="font-semibold">What Happens Next?</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>You'll receive regular progress reports</li>
                      <li>Track your sponsorship in your dashboard</li>
                      <li>See the direct impact of your support</li>
                    </ul>
                  </div>

                  <Link href="/dashboard">
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      data-testid="button-go-dashboard"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            )}

            {status === "error" && (
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center"
                >
                  <XCircle className="w-10 h-10 text-destructive" />
                </motion.div>
                
                <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
                <p className="text-muted-foreground mb-6">
                  {errorMessage || "We couldn't complete your sponsorship. Please try again."}
                </p>

                <div className="space-y-3">
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-try-again"
                    >
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </AnimatedContainer>
      </div>
  );
}
