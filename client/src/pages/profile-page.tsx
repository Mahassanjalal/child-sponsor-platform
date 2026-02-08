import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Save,
  Shield,
  Trash2,
  AlertTriangle,
  CreditCard,
  Plus,
  Star,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string; address?: string }) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("PUT", "/api/profile/password", data);
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ firstName, lastName, phone, address });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/");
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/profile");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      queryClient.clear();
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payment Methods - only for sponsors
  const { data: paymentMethodsData, isLoading: loadingPaymentMethods } = useQuery<PaymentMethodsResponse>({
    queryKey: ["/api/stripe/payment-methods"],
    enabled: user?.role === "sponsor",
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/billing-portal");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Open Billing Portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDefaultPaymentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const res = await apiRequest("POST", "/api/stripe/set-default-payment-method", { paymentMethodId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/payment-methods"] });
      toast({
        title: "Default Updated",
        description: "Your default payment method has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const res = await apiRequest("DELETE", `/api/stripe/payment-methods/${paymentMethodId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/payment-methods"] });
      toast({
        title: "Payment Method Removed",
        description: "The payment method has been removed from your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Remove Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand?.toLowerCase() || "";
    switch (brandLower) {
      case "visa":
        return "💳 Visa";
      case "mastercard":
        return "💳 Mastercard";
      case "amex":
        return "💳 Amex";
      case "discover":
        return "💳 Discover";
      default:
        return "💳 Card";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50 h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 mb-4 ring-4 ring-primary/10">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-semibold">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-primary/10">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm capitalize font-medium text-primary">{user?.role}</span>
            </div>
          </CardContent>
        </Card>

        {/* Forms Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      data-testid="input-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-3" />
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your address"
                      className="resize-none"
                      data-testid="input-address"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    data-testid="input-current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={updatePasswordMutation.isPending}
                  className="w-full"
                  data-testid="button-change-password"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {updatePasswordMutation.isPending ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Payment Methods - Sponsors Only */}
          {user?.role === "sponsor" && (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>Manage your saved payment methods</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => billingPortalMutation.mutate()}
                    disabled={billingPortalMutation.isPending}
                    data-testid="button-add-payment-method"
                  >
                    {billingPortalMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPaymentMethods ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                ) : paymentMethodsData?.paymentMethods && paymentMethodsData.paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethodsData.paymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          pm.isDefault ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">
                            {pm.brand?.toUpperCase().slice(0, 4) || "CARD"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {getCardBrandIcon(pm.brand)} •••• {pm.last4}
                              </span>
                              {pm.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Expires {pm.expMonth.toString().padStart(2, "0")}/{pm.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!pm.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDefaultPaymentMutation.mutate(pm.id)}
                              disabled={setDefaultPaymentMutation.isPending}
                              data-testid={`button-set-default-${pm.id}`}
                            >
                              Set Default
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                data-testid={`button-remove-${pm.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove the card ending in {pm.last4} from your account. 
                                  You can add it again later if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePaymentMethodMutation.mutate(pm.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => billingPortalMutation.mutate()}
                        disabled={billingPortalMutation.isPending}
                        data-testid="button-manage-billing"
                      >
                        {billingPortalMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4 mr-2" />
                        )}
                        Manage Billing in Stripe Portal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No Payment Methods</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a payment method to sponsor children more easily.
                    </p>
                    <Button
                      onClick={() => billingPortalMutation.mutate()}
                      disabled={billingPortalMutation.isPending}
                      data-testid="button-add-first-payment"
                    >
                      {billingPortalMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {user?.role !== "admin" && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. This will permanently
                  remove your profile, sponsorship history, and all related data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                        <span className="block mt-2 text-amber-600 font-medium">
                          Note: You must cancel any active sponsorships before deleting your account.
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccountMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        {deleteAccountMutation.isPending ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
