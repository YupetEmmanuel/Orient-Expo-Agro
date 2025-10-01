import { Link } from "wouter";
import type { Vendor } from "@shared/schema";

interface VendorCardProps {
  vendor: Vendor;
  productCount?: number;
}

export default function VendorCard({ vendor, productCount = 0 }: VendorCardProps) {
  const initials = vendor.storeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/vendors/${vendor.id}`}>
      <div className="card-hover bg-card rounded-xl shadow-md overflow-hidden border border-border cursor-pointer" data-testid={`card-vendor-${vendor.id}`}>
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-4">
            {vendor.logoUrl ? (
              <img
                src={vendor.logoUrl}
                alt={vendor.storeName}
                className="w-16 h-16 rounded-lg object-cover"
                data-testid={`img-vendor-logo-${vendor.id}`}
              />
            ) : (
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1" data-testid={`text-vendor-name-${vendor.id}`}>
                {vendor.storeName}
              </h4>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {vendor.description || "No description"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {vendor.description || "Welcome to our store! Browse our quality products."}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground" data-testid={`text-product-count-${vendor.id}`}>
              {productCount} Products
            </span>
            <button className="text-sm font-semibold text-primary hover:underline" data-testid={`button-view-store-${vendor.id}`}>
              View Store →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
