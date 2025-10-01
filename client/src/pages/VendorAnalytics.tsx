import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, Phone, Mail, MessageSquare, TrendingUp } from "lucide-react";
import type { Vendor } from "@shared/schema";

interface AnalyticsData {
  productViews: { productId: string; productName: string; viewCount: number }[];
  contactClicks: { contactType: string; clickCount: number }[];
}

export default function VendorAnalytics() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view analytics",
      });
      setTimeout(() => {
        navigate("/");
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, navigate]);

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

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/vendor", vendor?.id],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/vendor/${vendor?.id}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!vendor?.id,
  });

  if (authLoading || !vendor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
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
            <h2 className="text-2xl font-bold mb-2">No Vendor Account</h2>
            <p className="text-muted-foreground">You need to create a vendor account to view analytics</p>
          </div>
        </div>
      </div>
    );
  }

  const totalViews = analytics?.productViews.reduce((sum, p) => sum + p.viewCount, 0) || 0;
  const totalClicks = analytics?.contactClicks.reduce((sum, c) => sum + c.clickCount, 0) || 0;

  const getContactIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="w-5 h-5" />;
      case "whatsapp":
        return <MessageSquare className="w-5 h-5" />;
      case "email":
        return <Mail className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your product views and customer engagement</p>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      Total Product Views
                    </CardTitle>
                    <CardDescription>Number of times your products were viewed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold" data-testid="text-total-views">{totalViews}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Total Contact Clicks
                    </CardTitle>
                    <CardDescription>Number of times customers clicked to contact you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold" data-testid="text-total-clicks">{totalClicks}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Product Views Breakdown</CardTitle>
                  <CardDescription>Views per product</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.productViews && analytics.productViews.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.productViews.map((product) => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          data-testid={`product-view-${product.productId}`}
                        >
                          <span className="font-medium">{product.productName}</span>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="font-bold">{product.viewCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No product views yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Clicks Breakdown</CardTitle>
                  <CardDescription>How customers are reaching out</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.contactClicks && analytics.contactClicks.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.contactClicks.map((contact) => (
                        <div
                          key={contact.contactType}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          data-testid={`contact-click-${contact.contactType}`}
                        >
                          <div className="flex items-center gap-3">
                            {getContactIcon(contact.contactType)}
                            <span className="font-medium capitalize">{contact.contactType}</span>
                          </div>
                          <span className="font-bold">{contact.clickCount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No contact clicks yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
