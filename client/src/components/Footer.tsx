export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-primary">Orient</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted marketplace connecting quality vendors with customers worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Browse Products
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Find Vendors
                </a>
              </li>
              <li>
                <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
                  About Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Vendors</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/api/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Register Your Store
                </a>
              </li>
              <li>
                <a
                  href="/api/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Vendor Login
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2024 Orient Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
