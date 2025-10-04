import { Link } from "wouter";
import { Store, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import heroImage from "@assets/stock_images/agricultural_field_c_5d66ae93.jpg";
import vegetablesImage from "@assets/stock_images/fresh_vegetables_har_b2005c0c.jpg";
import farmlandImage from "@assets/stock_images/pexels_farm_image.jpg";

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div 
        className="relative h-72 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4" data-testid="text-app-title">Orient</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Connecting Farmers with Buyers
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-lg overflow-hidden shadow-md">
            <img 
              src={vegetablesImage} 
              alt="Fresh vegetables" 
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <img 
              src={farmlandImage} 
              alt="Farmland" 
              className="w-full h-48 object-cover"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-hover cursor-pointer hover:border-primary transition-all">
            <Link href="/vendor/browse">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">I'm a Vendor</CardTitle>
                <CardDescription className="text-base">
                  Sell your crops and food products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" data-testid="button-vendor-role">
                  Explore & Sell
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="card-hover cursor-pointer hover:border-secondary transition-all">
            <Link href="/buyer/browse">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle className="text-2xl">I'm a Buyer</CardTitle>
                <CardDescription className="text-base">
                  Browse fresh crops and products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-secondary hover:bg-secondary/90" size="lg" data-testid="button-buyer-role">
                  Browse Products
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/questions">
            <Button variant="outline" size="lg" data-testid="button-questions">
              Learn About Orient - Post Questions
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
