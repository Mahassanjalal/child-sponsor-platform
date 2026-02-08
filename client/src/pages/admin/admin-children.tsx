import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableRowSkeleton } from "@/components/loading-skeleton";
import { ConfirmDialog, DashboardEmptyState } from "@/components/dashboard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Baby,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  MapPin,
  Calendar,
  Heart,
  DollarSign,
} from "lucide-react";
import type { Child, Sponsorship, User } from "@shared/schema";
import { format } from "date-fns";

const childSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  location: z.string().min(1, "Location is required"),
  story: z.string().min(10, "Story must be at least 10 characters"),
  needs: z.string().min(10, "Needs must be at least 10 characters"),
  photoUrl: z.string().optional(),
  monthlyAmount: z.string().default("35.00"),
});

type ChildFormData = z.infer<typeof childSchema>;

interface SponsorshipWithDetails extends Sponsorship {
  sponsor: User;
  child: Child;
}

function ChildFormFields({ form, testIdPrefix = "" }: { form: UseFormReturn<ChildFormData>; testIdPrefix?: string }) {
  const p = testIdPrefix;
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid={`input-${p}child-first-name`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid={`input-${p}child-last-name`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid={`input-${p}child-dob`} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid={`select-${p}child-gender`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input {...field} placeholder="City, Country" data-testid={`input-${p}child-location`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="story"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Story</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Tell us about this child..." className="resize-none" data-testid={`input-${p}child-story`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="needs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Needs</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="What does this child need support with?" className="resize-none" data-testid={`input-${p}child-needs`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="photoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Photo URL</FormLabel>
            <FormControl>
              <Input {...field} placeholder="https://..." data-testid={`input-${p}child-photo`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="monthlyAmount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Amount ($)</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} data-testid={`input-${p}child-amount`} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}

export default function AdminChildren() {
  const { toast } = useToast();
  const [isChildDialogOpen, setIsChildDialogOpen] = useState(false);
  const [deleteChildId, setDeleteChildId] = useState<number | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sponsored" | "available">("all");

  const { data: children, isLoading: loadingChildren } = useQuery<Child[]>({
    queryKey: ["/api/admin/children"],
  });

  const { data: sponsorships } = useQuery<SponsorshipWithDetails[]>({
    queryKey: ["/api/admin/sponsorships"],
  });

  const childForm = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      location: "",
      story: "",
      needs: "",
      photoUrl: "",
      monthlyAmount: "35.00",
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: ChildFormData) => {
      const res = await apiRequest("POST", "/api/admin/children", {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setIsChildDialogOpen(false);
      childForm.reset();
      toast({
        title: "Child Added",
        description: "The child profile has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ChildFormData }) => {
      const res = await apiRequest("PUT", `/api/admin/children/${id}`, {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setEditingChild(null);
      childForm.reset();
      toast({
        title: "Child Updated",
        description: "The child profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/children/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/children"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children/featured"] });
      setDeleteChildId(null);
      toast({
        title: "Child Deleted",
        description: "The child profile has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete child",
        variant: "destructive",
      });
      setDeleteChildId(null);
    },
  });

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    childForm.reset({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: new Date(child.dateOfBirth).toISOString().split("T")[0],
      gender: child.gender,
      location: child.location,
      story: child.story,
      needs: child.needs,
      photoUrl: child.photoUrl || "",
      monthlyAmount: child.monthlyAmount,
    });
  };

  const handleChildSubmit = (data: ChildFormData) => {
    if (editingChild) {
      updateChildMutation.mutate({ id: editingChild.id, data });
    } else {
      createChildMutation.mutate(data);
    }
  };

  const getSponsorForChild = (childId: number) => {
    const sp = sponsorships?.find((s) => s.childId === childId && s.status === "active");
    return sp?.sponsor;
  };

  // Filter children based on search and status
  const filteredChildren = children?.filter((child) => {
    const matchesSearch =
      searchQuery === "" ||
      `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "sponsored" && child.isSponsored) ||
      (statusFilter === "available" && !child.isSponsored);

    return matchesSearch && matchesStatus;
  });

  const sponsoredCount = children?.filter((c) => c.isSponsored).length || 0;
  const availableCount = children?.filter((c) => !c.isSponsored).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Children Management</h1>
          <p className="text-muted-foreground">
            Manage child profiles in the sponsorship program
          </p>
        </div>
        <Dialog open={isChildDialogOpen} onOpenChange={setIsChildDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Child
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Child</DialogTitle>
              <DialogDescription>
                Create a new child profile for the sponsorship program.
              </DialogDescription>
            </DialogHeader>
            <Form {...childForm}>
              <form onSubmit={childForm.handleSubmit(handleChildSubmit)} className="space-y-4">
                <ChildFormFields form={childForm} />
                <Button type="submit" className="w-full" disabled={createChildMutation.isPending}>
                  {createChildMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Child Profile"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Children</p>
                <p className="text-2xl font-bold">{children?.length || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Baby className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sponsored</p>
                <p className="text-2xl font-bold text-green-600">{sponsoredCount}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Sponsors</p>
                <p className="text-2xl font-bold text-amber-600">{availableCount}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-500/10">
                <Baby className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
                <SelectItem value="available">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Children Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Children</CardTitle>
          <CardDescription>
            {filteredChildren?.length || 0} children found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingChildren ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRowSkeleton key={i} columns={6} />
              ))}
            </div>
          ) : filteredChildren && filteredChildren.length > 0 ? (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Child</TableHead>
                    <TableHead>Age / Gender</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredChildren.map((child) => {
                      const age = Math.floor(
                        (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      );
                      const sponsor = getSponsorForChild(child.id);

                      return (
                        <motion.tr
                          key={child.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={child.photoUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {child.firstName[0]}
                                  {child.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {child.firstName} {child.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Added {format(new Date(child.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>{age} years</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {child.gender}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="truncate max-w-[120px]">{child.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{child.monthlyAmount}/mo</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={child.isSponsored ? "default" : "secondary"}>
                              {child.isSponsored ? "Sponsored" : "Available"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sponsor ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={sponsor.avatarUrl || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {sponsor.firstName[0]}
                                    {sponsor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate max-w-[80px]">
                                  {sponsor.firstName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditChild(child)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteChildId(child.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          ) : (
            <DashboardEmptyState
              icon={Baby}
              title="No children found"
              description={
                searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Add children to the sponsorship program"
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingChild} onOpenChange={(open) => !open && setEditingChild(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Child</DialogTitle>
            <DialogDescription>Update the child's profile information.</DialogDescription>
          </DialogHeader>
          <Form {...childForm}>
            <form onSubmit={childForm.handleSubmit(handleChildSubmit)} className="space-y-4">
              <ChildFormFields form={childForm} testIdPrefix="edit-" />
              <Button type="submit" className="w-full" disabled={updateChildMutation.isPending}>
                {updateChildMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Child Profile"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteChildId}
        onOpenChange={(open) => !open && setDeleteChildId(null)}
        title="Delete Child"
        description="Are you sure you want to delete this child profile? This action cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={() => deleteChildId && deleteChildMutation.mutate(deleteChildId)}
        isPending={deleteChildMutation.isPending}
      />
    </div>
  );
}
