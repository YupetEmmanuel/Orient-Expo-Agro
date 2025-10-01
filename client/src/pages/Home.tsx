import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import VendorCard from "@/components/VendorCard";
import type { Product, Vendor, Category } from "@shared/schema";

export default function Home() {
  const [location] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") || "";
    setSearchQuery(search);
  }, [location]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<(Product & { vendor?: Vendor })[]>({
    queryKey: ["/api/products", selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      params.append("status", "active");
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/vendors?status=approved");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const featuredVendors = vendors.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="hero-gradient text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Discover Quality Vendors</h2>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Connect directly with trusted vendors and explore thousands of quality products
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 border-y border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Categories:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory("")}
                className={`category-chip px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  !selectedCategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
                data-testid="button-category-all"
              >
                All Products
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`category-chip px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}
                  data-testid={`button-category-${category.slug}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">Featured Products</h3>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border p-4 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {featuredVendors.length > 0 && (
        <section className="py-16 bg-secondary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-3">Featured Vendors</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our trusted vendor community and find quality products from verified sellers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
