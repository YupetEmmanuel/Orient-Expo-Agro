import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Vendor, Product, Review } from "@shared/schema";

export default function VendorProfile() {
  const [, params] = useRoute("/vendors/:id");
  const vendorId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/products?vendorId=${vendorId}&status=active`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!vendorId,
  });

  const { data: reviews = [] } = useQuery<(Review & { userName: string })[]>({
    queryKey: ["/api/reviews/vendor", vendorId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/vendor/${vendorId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
    enabled: !!vendorId,
  });

  const { data: averageRating = 0 } = useQuery<number>({
    queryKey: ["/api/reviews/vendor", vendorId, "average"],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/vendor/${vendorId}/average`);
      if (!res.ok) throw new Error("Failed to fetch average rating");
      const data = await res.json();
      return data.average;
    },
    enabled: !!vendorId,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: { vendorId: string; rating: string; comment: string }) => {
      return await apiRequest("POST", "/api/reviews", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/vendor", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/vendor", vendorId, "average"] });
      toast({ title: "Success", description: "Review submitted successfully" });
      setShowReviewForm(false);
      setComment("");
      setRating(5);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    },
  });

  if (vendorLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading vendor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Vendor not found</h2>
            <p className="text-muted-foreground">The vendor you're looking for doesn't exist</p>
          </div>
        </div>
      </div>
    );
  }

  const initials = vendor.storeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const trackContact = async (contactType: string) => {
    try {
      await fetch("/api/analytics/contact-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          vendorId,
          contactType,
        }),
      });
    } catch (error) {
      console.error("Error tracking contact:", error);
    }
  };

  const handleCall = () => {
    if (vendor.phone) {
      trackContact("phone");
      window.location.href = `tel:${vendor.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (vendor.whatsapp) {
      trackContact("whatsapp");
      window.open(`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (vendor.email) {
      trackContact("email");
      window.location.href = `mailto:${vendor.email}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-primary to-primary/70"></div>
            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-start md:space-x-6 -mt-16">
                {vendor.logoUrl ? (
                  <img
                    src={vendor.logoUrl}
                    alt={vendor.storeName}
                    className="w-24 h-24 bg-card border-4 border-card rounded-xl object-cover mb-4 md:mb-0"
                    data-testid="img-vendor-logo"
                  />
                ) : (
                  <div className="w-24 h-24 bg-card border-4 border-card rounded-xl flex items-center justify-center mb-4 md:mb-0">
                    <span className="text-3xl font-bold text-primary">{initials}</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="md:mt-16">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                      <div>
                        <h2 className="text-2xl font-bold mb-1" data-testid="text-vendor-name">
                          {vendor.storeName}
                        </h2>
                        <p className="text-muted-foreground">{vendor.description || "Quality products for you"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {vendor.phone && (
                        <Button onClick={handleCall} className="contact-btn" data-testid="button-call">
                          <Phone className="w-5 h-5 mr-2" />
                          Call Now
                        </Button>
                      )}
                      {vendor.whatsapp && (
                        <Button
                          onClick={handleWhatsApp}
                          className="contact-btn bg-[#25D366] hover:bg-[#25D366]/90"
                          data-testid="button-whatsapp"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </Button>
                      )}
                      {vendor.email && (
                        <Button onClick={handleEmail} variant="secondary" className="contact-btn" data-testid="button-email">
                          <Mail className="w-5 h-5 mr-2" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <div className="text-3xl font-bold text-primary mb-1" data-testid="text-product-count">
                {products.length}
              </div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <div className="text-3xl font-bold text-primary" data-testid="text-average-rating">
                  {averageRating.toFixed(1)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{reviews.length} Reviews</div>
            </div>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {user && (
                <div className="mb-6">
                  {!showReviewForm ? (
                    <Button onClick={() => setShowReviewForm(true)} data-testid="button-add-review">
                      Write a Review
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              data-testid={`button-rating-${star}`}
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          rows={4}
                          data-testid="textarea-review-comment"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            createReviewMutation.mutate({
                              vendorId: vendorId!,
                              rating: rating.toString(),
                              comment,
                            });
                          }}
                          disabled={createReviewMutation.isPending}
                          data-testid="button-submit-review"
                        >
                          {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReviewForm(false);
                            setComment("");
                            setRating(5);
                          }}
                          data-testid="button-cancel-review"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0" data-testid={`review-${review.id}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold">{review.userName}</div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < parseFloat(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-2xl font-bold mb-6">Products from {vendor.storeName}</h3>
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                    <div className="w-full h-48 bg-muted rounded-lg mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={{ ...product, vendor }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
