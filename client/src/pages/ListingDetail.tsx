import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@shared/schema";
import { Link, useParams } from "wouter";
import { ArrowLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ListingDetail() {
  const { id } = useParams();

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
  });

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
      </div>
    </div>
  );
}
