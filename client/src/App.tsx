import { Switch, Router as WouterRouter, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "./components/navbar";
import { AuthModal } from "./components/auth-modal";
import { SupportChat } from "./components/support-chat";
import { Home } from "./pages/home";
import { Dashboard } from "./pages/dashboard";
import { Admin } from "./pages/admin";
import { AdminLogin } from "./pages/admin-login";
import NotFound from "@/pages/not-found";
import Terms from "@/pages/terms";
import FAQ from "@/pages/faq";

function Router() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [location] = useLocation();

  const handleLoginClick = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleSignupClick = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  // Normalize route to ignore base
  const normalizedPath = location.replace("/CryptoPay", "") || "/";

  
return (
  <div className="min-h-screen crypto-bg-black">
    {/* Hide Navbar on terms, faq, admin-login, and admin pages */}
    {!["/terms", "/faq", "/admin-login", "/admin"].includes(normalizedPath) && (
      <Navbar
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
      />
    )}

      <WouterRouter base={import.meta.env.BASE_URL}>
        <Switch>
          <Route
            path="/"
            component={() => (
              <Home
                onLoginClick={handleLoginClick}
                onSignupClick={handleSignupClick}
              />
            )}
          />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/admin" component={Admin} />
          <Route path="/terms" component={Terms} />
          <Route path="/faq" component={FAQ} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <SupportChat />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;


