import { useQuery, useMutation } from "@tanstack/react-query";
import type { Listing } from "@shared/schema";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Phone, Mail, MessageCircle, Home, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function ListingDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [password, setPassword] = useState("");

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
  });

  const { data: vendorListings } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { role: "vendor", search: listing?.vendorName }],
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey as [string, { role?: string; search?: string }];
      const searchParams = new URLSearchParams();
      if (params.role) searchParams.append("role", params.role);
      if (params.search) searchParams.append("search", params.search);
      const res = await fetch(`${url}?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
    enabled: !!listing,
  });

  const deleteListingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/listings/${id}`, {
        vendorName,
        password,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete listing");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
      setDeleteDialogOpen(false);
      setLocation("/vendor/browse");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (!vendorName || !password) {
      toast({
        title: "Error",
        description: "Please enter vendor name and password",
        variant: "destructive",
      });
      return;
    }
    deleteListingMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link href="/buyer/browse">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{listing.itemName}</h1>
            <p className="text-primary-foreground/80">by {listing.vendorName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            {listing.imageUrl && (
              <img
                src={listing.imageUrl}
                alt={listing.itemName}
                className="w-full h-96 object-cover rounded-lg mb-4"
                data-testid="img-listing-detail"
              />
            )}
            <CardTitle className="text-3xl">{listing.itemName}</CardTitle>
            <CardDescription className="text-lg">{listing.vendorName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold text-primary">
              ${listing.price}
            </div>

            {listing.cropType && (
              <div className="inline-block px-4 py-2 bg-accent/20 text-accent-foreground rounded-full">
                {listing.cropType}
              </div>
            )}

            {listing.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Contact Vendor</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="flex-1"
                  data-testid="button-call"
                >
                  <a href={`tel:${listing.contactPhone}`}>
                    <Phone className="h-5 w-5 mr-2" />
                    Call: {listing.contactPhone}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  data-testid="button-whatsapp"
                >
                  <a href={`https://wa.me/${listing.contactPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  data-testid="button-email"
                >
                  <a href={`mailto:${listing.contactEmail}`}>
                    <Mail className="h-5 w-5 mr-2" />
                    Email
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {vendorListings && vendorListings.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>More from {listing.vendorName}</CardTitle>
              <CardDescription>Other products from this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {vendorListings
                  .filter((item) => item.id !== listing.id)
                  .map((item) => (
                    <Link key={item.id} href={`/listing/${item.id}`}>
                      <Card className="card-hover cursor-pointer" data-testid={`card-suggestion-${item.id}`}>
                        <CardHeader>
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                              data-testid={`img-suggestion-${item.id}`}
                            />
                          )}
                          <CardTitle className="text-lg">{item.itemName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-primary">
                            ${item.price}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/">
            <Button variant="outline" size="lg" data-testid="button-home">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/buyer/browse">
            <Button variant="outline" size="lg" data-testid="button-browse">
              Browse All Products
            </Button>
          </Link>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" data-testid="button-delete-listing">
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Listing
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                <AlertDialogDescription>
                  To delete this listing, please confirm your vendor name and password.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-name">Vendor Name</Label>
                  <Input
                    id="vendor-name"
                    placeholder="Enter your vendor name"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    data-testid="input-delete-vendor-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-delete-password"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  disabled={deleteListingMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteListingMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
