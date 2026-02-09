import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StripePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: number;
  childName: string;
  amount: string;
  paymentType: "monthly" | "one-time";
  onSuccess: () => void;
}

// Get the publishable key and initialize Stripe
const useStripePromise = () => {
  const { data } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe/publishable-key"],
    staleTime: Infinity,
  });
  
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  
  useEffect(() => {
    if (data?.publishableKey && !stripePromise) {
      setStripePromise(loadStripe(data.publishableKey));
    }
  }, [data?.publishableKey, stripePromise]);
  
  return stripePromise;
};

// Payment Form Component
function PaymentForm({
  childId,
  childName,
  amount,
  paymentType,
  onSuccess,
  onCancel,
}: {
  childId: number;
  childName: string;
  amount: string;
  paymentType: "monthly" | "one-time";
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Complete sponsorship after successful payment
  const completeSponsorshipMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const res = await apiRequest("POST", "/api/stripe/complete-sponsorship", {
        paymentIntentId,
        childId,
        paymentType,
      });
      return res.json();
    },
    onSuccess: () => {
      setPaymentStatus("success");
      toast({
        title: "Sponsorship Confirmed!",
        description: `You are now sponsoring ${childName}!`,
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: Error) => {
      setPaymentStatus("error");
      setErrorMessage(error.message || "Failed to confirm sponsorship");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/sponsor/success",
        },
        redirect: "if_required",
      });

      if (error) {
        setPaymentStatus("error");
        setErrorMessage(error.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded, complete the sponsorship
        completeSponsorshipMutation.mutate(paymentIntent.id);
      } else {
        setPaymentStatus("error");
        setErrorMessage("Payment was not completed");
        setIsProcessing(false);
      }
    } catch (err) {
      setPaymentStatus("error");
      setErrorMessage("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  if (paymentStatus === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
          Payment Successful!
        </h3>
        <p className="text-muted-foreground text-center">
          Thank you for sponsoring {childName}. You will be redirected shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Child</span>
          <span className="font-medium">{childName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Type</span>
          <span className="font-medium capitalize">{paymentType}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Amount</span>
          <span className="font-bold text-primary">${amount}</span>
        </div>
      </div>

      <div className="min-h-[200px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="flex-1 bg-gradient-to-r from-primary to-accent"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${amount}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

// Main Dialog Component
export function StripePaymentDialog({
  open,
  onOpenChange,
  childId,
  childName,
  amount,
  paymentType,
  onSuccess,
}: StripePaymentDialogProps) {
  const stripePromise = useStripePromise();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent when dialog opens
  useEffect(() => {
    if (open && !clientSecret) {
      setIsLoading(true);
      setError(null);

      apiRequest("POST", "/api/stripe/create-payment-intent", {
        childId,
        paymentType,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError(data.error || "Failed to initialize payment");
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to initialize payment");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, childId, paymentType, clientSecret]);

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setClientSecret(null);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Enter your payment details to sponsor {childName}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Initializing payment...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <p className="text-destructive text-center">{error}</p>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        )}

        {!isLoading && !error && clientSecret && stripePromise && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#7c3aed",
                },
              },
            }}
          >
            <PaymentForm
              childId={childId}
              childName={childName}
              amount={amount}
              paymentType={paymentType}
              onSuccess={onSuccess}
              onCancel={() => handleOpenChange(false)}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
