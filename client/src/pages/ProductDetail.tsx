import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ArrowLeft } from "lucide-react";
import type { Product, Vendor } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  const { data: vendor, isLoading: vendorLoading } = useQuery<Vendor>({
    queryKey: ["/api/vendors", product?.vendorId],
    enabled: !!product?.vendorId,
  });

  if (productLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Product not found</h2>
            <p className="text-muted-foreground">The product you're looking for doesn't exist</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCall = () => {
    if (vendor?.phone) {
      window.location.href = `tel:${vendor.phone}`;
    }
  };

  const handleWhatsApp = () => {
    if (vendor?.whatsapp) {
      window.open(`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`, "_blank");
    }
  };

  const handleEmail = () => {
    if (vendor?.email) {
      window.location.href = `mailto:${vendor.email}`;
    }
  };

  const vendorInitials = vendor?.storeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>

          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
              <div>
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full rounded-xl"
                    data-testid="img-product"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-muted-foreground"
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
              </div>

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2" data-testid="text-product-name">
                      {product.name}
                    </h2>
                  </div>
                  {product.status === "active" && (
                    <span className="px-3 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-4xl font-bold text-primary mb-2" data-testid="text-product-price">
                    ${product.price}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
                    {product.description || "No description available"}
                  </p>
                </div>

                {vendor && (
                  <div className="border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground mb-3">Sold by:</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {vendor.logoUrl ? (
                          <img
                            src={vendor.logoUrl}
                            alt={vendor.storeName}
                            className="w-12 h-12 rounded-lg object-cover"
                            data-testid="img-vendor-logo"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-foreground">
                              {vendorInitials}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold" data-testid="text-vendor-name">{vendor.storeName}</h4>
                        </div>
                      </div>
                      <Link href={`/vendors/${vendor.id}`}>
                        <Button variant="ghost" size="sm" data-testid="button-view-store">
                          View Store
                        </Button>
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {vendor.phone && (
                        <Button onClick={handleCall} className="contact-btn flex-1" data-testid="button-call">
                          <Phone className="w-5 h-5 mr-2" />
                          Call Vendor
                        </Button>
                      )}
                      {vendor.whatsapp && (
                        <Button
                          onClick={handleWhatsApp}
                          className="contact-btn flex-1 bg-[#25D366] hover:bg-[#25D366]/90"
                          data-testid="button-whatsapp"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          WhatsApp
                        </Button>
                      )}
                      {vendor.email && (
                        <Button onClick={handleEmail} variant="secondary" className="contact-btn flex-1" data-testid="button-email">
                          <Mail className="w-5 h-5 mr-2" />
                          Email
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
