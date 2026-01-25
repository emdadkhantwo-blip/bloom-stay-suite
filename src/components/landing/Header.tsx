import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hotel, Phone, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "ফিচার", href: "#features" },
  { label: "সমাধান", href: "#solutions" },
  { label: "প্রাইসিং", href: "#pricing" },
  { label: "রিভিউ", href: "#reviews" },
  { label: "প্রশ্ন", href: "#faq" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info text-info-foreground">
            <Hotel className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">HotelPMS</span>
            <span className="hidden sm:block text-xs text-muted-foreground">Hotel Management System</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <a 
            href="tel:01974599741" 
            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Phone className="h-4 w-4 text-info" />
            01974599741
          </a>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/auth">লগইন</Link>
          </Button>
          <Button size="sm" className="bg-info hover:bg-info/90" asChild>
            <Link to="/auth">শুরু করুন</Link>
          </Button>
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-card">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t">
                <Button className="w-full bg-info hover:bg-info/90" asChild>
                  <Link to="/auth">ফ্রি ট্রায়াল শুরু করুন</Link>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
