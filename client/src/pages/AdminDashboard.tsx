import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vendor, Product } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    } else if (!isLoading && user?.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: user?.role === "admin",
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: user?.role === "admin",
  });

  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const flaggedProducts = products.filter((p) => p.status === "flagged");

  const approveVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/vendors/${id}/status`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor approved" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/vendors/${id}/status`, {
        status: "rejected",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({ title: "Success", description: "Vendor rejected" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/products/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product removed" });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
            <p className="text-muted-foreground">Manage vendors and moderate content</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold text-primary mb-1" data-testid="text-total-vendors">
                {vendors.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </div>
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold text-amber-600 mb-1" data-testid="text-pending-vendors">
                {pendingVendors.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </div>
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold text-primary mb-1" data-testid="text-total-products">
                {products.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold text-destructive mb-1" data-testid="text-flagged-products">
                {flaggedProducts.length}
              </div>
              <div className="text-sm text-muted-foreground">Flagged Items</div>
            </div>
          </div>

          {pendingVendors.length > 0 && (
            <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden mb-8">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Pending Vendor Approvals</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {pendingVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-muted/50" data-testid={`row-vendor-${vendor.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{vendor.storeName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{vendor.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveVendorMutation.mutate(vendor.id)}
                            data-testid={`button-approve-${vendor.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectVendorMutation.mutate(vendor.id)}
                            data-testid={`button-reject-${vendor.id}`}
                          >
                            Reject
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {flaggedProducts.length > 0 && (
            <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-lg">Flagged Content</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {flaggedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/50" data-testid={`row-flagged-${product.id}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium">{product.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-destructive/10 text-destructive">
                            {product.flagReason || "Flagged"}
                          </span>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this product?")) {
                                removeProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`button-remove-${product.id}`}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
