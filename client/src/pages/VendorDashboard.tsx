import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import type { Vendor, Product } from "@shared/schema";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function VendorDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: vendor } = useQuery<Vendor | null>({
    queryKey: ["/api/vendors/me"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/me");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const res = await fetch(`/api/products?vendorId=${vendor.id}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!vendor?.id,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product created successfully" });
      setShowProductForm(false);
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product updated successfully" });
      setEditingProduct(null);
      setShowProductForm(false);
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/products/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product deleted successfully" });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      categoryId: formData.get("categoryId") || null,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleGetUploadParameters = async () => {
    const res = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
    });
    const { uploadURL } = await res.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
    };
  };

  const handleUploadComplete = async (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    if (result.successful.length > 0 && editingProduct) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        await apiRequest("PUT", "/api/product-image", {
          imageUrl: uploadURL,
          productId: editingProduct.id,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ title: "Success", description: "Product image uploaded" });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save product image",
          variant: "destructive",
        });
      }
    }
  };

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

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">No Vendor Account</h2>
            <p className="text-muted-foreground mb-4">
              You need to create a vendor account to access the dashboard.
            </p>
            <Button onClick={() => setLocation("/")}>Go to Homepage</Button>
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
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Vendor Dashboard</h2>
              <p className="text-muted-foreground">Manage your store and products</p>
            </div>
            {vendor && (
              <Link href="/vendor-analytics">
                <Button variant="outline" data-testid="button-view-analytics">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold mb-1" data-testid="text-product-count">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="bg-card rounded-xl shadow-md border border-border p-6">
              <div className="text-3xl font-bold mb-1">
                {vendor.status === "approved" ? "✓" : "⏳"}
              </div>
              <div className="text-sm text-muted-foreground capitalize">{vendor.status}</div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setShowProductForm(true)} data-testid="button-add-product">
                <Plus className="w-5 h-5 mr-2" />
                Add New Product
              </Button>
            </div>
          </div>

          {showProductForm && (
            <div className="bg-card rounded-xl shadow-md border border-border p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h3>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                    data-testid="input-product-name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingProduct?.description || ""}
                    data-testid="input-product-description"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.price}
                    required
                    data-testid="input-product-price"
                  />
                </div>
                {editingProduct && (
                  <div>
                    <Label>Product Image</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      data-testid="uploader-product-image"
                    >
                      <span>Upload Image</span>
                    </ObjectUploader>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" data-testid="button-save-product">
                    {editingProduct ? "Update" : "Create"} Product
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowProductForm(false);
                      setEditingProduct(null);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-lg">Your Products</h3>
            </div>

            {products.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">No products yet. Add your first product!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Price
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
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-muted/50" data-testid={`row-product-${product.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-lg mr-3" />
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold">${product.price}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.status === "active"
                                ? "bg-green-100 text-green-800"
                                : product.status === "flagged"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowProductForm(true);
                              }}
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this product?")) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
