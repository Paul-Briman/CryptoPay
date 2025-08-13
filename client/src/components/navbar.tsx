import { useState, useEffect } from "react";
import { Link as WouterLink, useLocation } from "wouter";
import { useAuth, useLogout } from "../lib/auth";
import { Button } from "./ui/button";
import { Menu, X, Bitcoin } from "lucide-react";

interface NavbarProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
}

export function Navbar({ onLoginClick, onSignupClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { data: user } = useAuth();
  const logout = useLogout();
  const [location, setLocation] = useLocation();

  const handleLogout = () => logout.mutate();

  const navItems = [
    { href: "home", label: "Home" },
    { href: "plans", label: "Plans" },
    { href: "about", label: "About" },
    { href: "contact", label: "Contact" },
  ];

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      for (const item of navItems) {
        const section = document.getElementById(item.href);
        if (section) {
          const offset = section.offsetTop - 100;
          const height = section.offsetHeight;
          if (scrollY >= offset && scrollY < offset + height) {
            setActiveSection(item.href);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="crypto-bg-dark border-b border-gray-600 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <WouterLink href="/" className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
            <Bitcoin className="h-8 w-8 crypto-text-gold" />
            <span className="text-xl font-bold crypto-text-gold">CryptoPay</span>
          </WouterLink>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === item.href
                    ? "crypto-text-gold crypto-border-gold"
                    : "text-gray-300 border-transparent hover:crypto-text-gold hover:border-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <WouterLink href="/dashboard">
                  <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                    Dashboard
                  </Button>
                </WouterLink>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-black"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoginClick}
                  className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={onSignupClick}
                  className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="crypto-hover-gold"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 crypto-bg-gray space-y-2">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`block w-full text-left px-3 py-2 text-base font-medium rounded ${
                activeSection === item.href ? "crypto-text-gold" : "text-gray-300 hover:crypto-text-gold"
              }`}
            >
              {item.label}
            </button>
          ))}

          <hr className="border-gray-600 my-2" />

          {user ? (
            <>
              <WouterLink href="/dashboard">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:crypto-text-gold"
                >
                  Dashboard
                </button>
              </WouterLink>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:crypto-text-gold"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:crypto-text-gold"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onSignupClick();
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium crypto-text-gold"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}




