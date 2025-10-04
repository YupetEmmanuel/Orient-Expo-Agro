import { useQuery } from "@tanstack/react-query";
import type { Listing } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Phone, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function BuyerBrowse() {
  const [search, setSearch] = useState("");
  const [cropType, setCropType] = useState<string>("");

  const { data: listings, isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings", { role: "vendor", cropType, search }],
  });

  const filteredListings = listings || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Browse Products</h1>
            <p className="text-primary-foreground/80">Fresh crops from local vendors</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex gap-4 flex-col sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
          <Select value={cropType} onValueChange={setCropType}>
            <SelectTrigger className="sm:w-48" data-testid="select-filter-crop-type">
              <SelectValue placeholder="All crop types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All crop types</SelectItem>
              <SelectItem value="vegetables">Vegetables</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
              <SelectItem value="grains">Grains</SelectItem>
              <SelectItem value="livestock">Livestock</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="card-hover" data-testid={`card-listing-${listing.id}`}>
                <CardHeader>
                  {listing.imageUrl && (
                    <img
                      src={listing.imageUrl}
                      alt={listing.itemName}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      data-testid={`img-listing-${listing.id}`}
                    />
                  )}
                  <CardTitle className="text-xl">{listing.itemName}</CardTitle>
                  <CardDescription>{listing.vendorName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.cropType && (
                    <div className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm">
                      {listing.cropType}
                    </div>
                  )}
                  {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <div className="text-2xl font-bold text-primary">
                    ${listing.price}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      data-testid={`button-call-${listing.id}`}
                    >
                      <a href={`tel:${listing.contactPhone}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      data-testid={`button-email-${listing.id}`}
                    >
                      <a href={`mailto:${listing.contactEmail}`}>
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center pt-8">
          <Link href="/crop-info">
            <Button variant="outline" data-testid="button-view-crop-info">
              Learn About Crops
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
