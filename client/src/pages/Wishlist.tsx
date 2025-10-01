import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Wishlist, Product, Vendor } from "@shared/schema";

export default function Wishlist() {
  const { user } = useAuth();

  const { data: wishlistItems = [], isLoading } = useQuery<(Wishlist & { product: Product; vendor: Vendor })[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <section className="py-16 bg-background flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-bold mb-4">My Wishlist</h1>
            <p className="text-muted-foreground mb-6">Please log in to view your wishlist</p>
            <Link href="/">
              <a className="text-primary hover:underline">Go to Home</a>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8" data-testid="heading-wishlist">My Wishlist</h1>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-6" data-testid="text-empty-wishlist">Your wishlist is empty</p>
              <Link href="/">
                <a className="text-primary hover:underline">Browse products</a>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <ProductCard key={item.id} product={{ ...item.product, vendor: item.vendor }} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
