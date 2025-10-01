import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Vendor } from "@shared/schema";

interface ProductCardProps {
  product: Product & { vendor?: Vendor };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();

  const { data: wishlistStatus } = useQuery<{ isInWishlist: boolean }>({
    queryKey: ["/api/wishlist/check", product.id],
    queryFn: async ({ queryKey }) => {
      const [path, productId] = queryKey;
      const res = await fetch(`${path}/${productId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to check wishlist");
      return res.json();
    },
    enabled: !!user,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (wishlistStatus?.isInWishlist) {
        return await apiRequest("DELETE", `/api/wishlist/${product.id}`, {});
      } else {
        return await apiRequest("POST", "/api/wishlist", { productId: product.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist/check"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
  });

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      toggleWishlistMutation.mutate();
    }
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="card-hover bg-card rounded-xl shadow-md overflow-hidden border border-border cursor-pointer relative" data-testid={`card-product-${product.id}`}>
        {user && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 z-10 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart
              className={`w-5 h-5 ${
                wishlistStatus?.isInWishlist
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        )}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
            data-testid={`img-product-${product.id}`}
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <svg
              className="w-16 h-16 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-lg line-clamp-1" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h4>
            {product.status === "active" && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
            {product.description || "No description available"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
              ${product.price}
            </span>
            {product.vendor && (
              <Link href={`/vendors/${product.vendor.id}`}>
                <button className="text-sm text-muted-foreground hover:text-foreground flex items-center space-x-1" data-testid={`link-vendor-${product.vendor.id}`}>
                  <span>by {product.vendor.storeName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
