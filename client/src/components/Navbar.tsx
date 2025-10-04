import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, Store, LayoutDashboard, Shield, Heart, Download, Smartphone, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const { isInstallable, isIOS, isAndroid, isInstalled, installApp, shareApp } = usePWAInstall();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") || "";
    setSearchQuery(search);
  }, [location]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams(window.location.search);
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      navigate(`/?${params.toString()}`);
    }
  };

  const handleInstallAndroid = async () => {
    const installed = await installApp();
    if (installed) {
      setInstallDialogOpen(false);
    }
  };

  const handleInstallIOS = () => {
    setInstallDialogOpen(false);
  };

  const handleShare = async () => {
    const result = await shareApp();
    if (result.success) {
      setInstallDialogOpen(false);
      if (result.method === 'clipboard') {
        toast({
          title: "Link copied!",
          description: "The app link has been copied to your clipboard.",
        });
      } else {
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing Orient!",
        });
      }
    } else if (!result.cancelled) {
      toast({
        title: "Unable to share",
        description: "Please copy the URL from your browser and share it manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Orient</h1>
              <p className="text-xs text-muted-foreground">Vendor Marketplace</p>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, vendors..."
                className="w-full px-4 py-2 pl-10 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                data-testid="input-search"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {isAuthenticated && (
              <>
                <Link href="/wishlist">
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center space-x-2"
                    data-testid="link-wishlist"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Wishlist</span>
                  </Button>
                </Link>
                {user?.role === "vendor" && (
                  <Link href="/vendor-dashboard">
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center space-x-2"
                      data-testid="link-vendor-dashboard"
                    >
                      <Store className="w-5 h-5" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/admin-dashboard">
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center space-x-2"
                      data-testid="link-admin-dashboard"
                    >
                      <Shield className="w-5 h-5" />
                      <span>Admin</span>
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={() => (window.location.href = "/api/logout")}
                  variant="ghost"
                  className="hidden md:flex"
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInstallDialogOpen(true)}
              className="flex items-center space-x-1"
              data-testid={isInstalled ? "button-share-app" : "button-download-app"}
            >
              {isInstalled ? (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </Button>
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 pl-10 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              data-testid="input-search-mobile"
            />
            <svg
              className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {isAuthenticated ? (
              <>
                {user?.role === "vendor" && (
                  <Link href="/vendor-dashboard">
                    <Button variant="ghost" className="w-full justify-start" data-testid="link-vendor-dashboard-mobile">
                      <Store className="w-5 h-5 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link href="/admin-dashboard">
                    <Button variant="ghost" className="w-full justify-start" data-testid="link-admin-dashboard-mobile">
                      <Shield className="w-5 h-5 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={() => (window.location.href = "/api/logout")}
                  variant="ghost"
                  className="w-full justify-start"
                  data-testid="button-logout-mobile"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => (window.location.href = "/api/login")}
                  variant="ghost"
                  className="w-full justify-start"
                  data-testid="button-login-mobile"
                >
                  Login
                </Button>
                <Button
                  onClick={() => (window.location.href = "/api/login")}
                  className="w-full"
                  data-testid="button-become-vendor-mobile"
                >
                  Become a Vendor
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#F5F5DC', opacity: 1 }}>
          {isInstalled ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5" />
                  <span>Share Orient App</span>
                </DialogTitle>
                <DialogDescription>
                  Share Orient with friends and family so they can discover great local vendors!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 h-14"
                  variant="default"
                  data-testid="button-share-link"
                >
                  <Share2 className="w-5 h-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Share App Link</span>
                    <span className="text-xs opacity-90">
                      Send link via messages, email, or social media
                    </span>
                  </div>
                </Button>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <p className="text-muted-foreground">
                  When others open the link, they'll be able to browse Orient and install it on their devices too!
                </p>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download Orient App</span>
                </DialogTitle>
                <DialogDescription>
                  Choose your device type to install Orient as an app on your phone
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleInstallAndroid}
                  className="w-full flex items-center justify-center space-x-2 h-14"
                  variant="default"
                  disabled={!isInstallable && isAndroid}
                  data-testid="button-install-android"
                >
                  <Smartphone className="w-5 h-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">Android</span>
                    <span className="text-xs opacity-90">
                      {isInstallable ? "Install now" : "Use Chrome browser to install"}
                    </span>
                  </div>
                </Button>
                <Button
                  onClick={handleInstallIOS}
                  className="w-full flex items-center justify-center space-x-2 h-14"
                  variant="default"
                  data-testid="button-install-ios"
                >
                  <Smartphone className="w-5 h-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">iOS (iPhone/iPad)</span>
                    <span className="text-xs opacity-90">
                      Tap Share → Add to Home Screen
                    </span>
                  </div>
                </Button>
              </div>
              {isIOS && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-semibold mb-1">iOS Installation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Tap the Share button (square with arrow)</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top right corner</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </nav>
  );
}
