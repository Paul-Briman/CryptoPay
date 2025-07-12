import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleLoginClick = () => {
    setAuthMode("login");
    setAuthModalOpen(true);
  };

  const handleSignupClick = () => {
    setAuthMode("signup");
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen crypto-bg-black">
      <Navbar onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      
      <Switch>
        <Route path="/" component={() => <Home onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>

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
