import { Link } from "wouter";
import { Store, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleSelection() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-primary">Orient</h1>
          <p className="text-xl text-muted-foreground">
            Connecting Farmers with Buyers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-hover cursor-pointer hover:border-primary transition-all">
            <Link href="/vendor/post">
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
                  Post Your Products
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
          <Link href="/crop-info">
            <Button variant="outline" size="lg" data-testid="button-crop-info">
              Learn About Crops
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
