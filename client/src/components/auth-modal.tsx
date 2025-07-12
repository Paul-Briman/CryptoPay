import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useRegister } from "../lib/auth";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "../hooks/use-toast";
import { X } from "lucide-react";
import type { LoginData, InsertUser } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleLogin = (data: LoginData) => {
    login.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        onClose();
        loginForm.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    });
  };

  const handleSignup = (data: InsertUser) => {
    register.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Account created!",
          description: "Welcome to CryptoPay. Your account has been created successfully.",
        });
        onClose();
        signupForm.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
      },
    });
  };

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md crypto-bg-gray border-gray-600">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-white">
              {mode === "login" ? "Login" : "Sign Up"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {mode === "login" ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...loginForm.register("email")}
                className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                placeholder="Enter your email"
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm crypto-text-error">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...loginForm.register("password")}
                className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                placeholder="Enter your password"
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm crypto-text-error">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full crypto-bg-gold text-black hover:bg-yellow-400"
            >
              {login.isPending ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-gray-300">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="crypto-text-gold hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                {...signupForm.register("name")}
                className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                placeholder="Enter your full name"
              />
              {signupForm.formState.errors.name && (
                <p className="text-sm crypto-text-error">
                  {signupForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...signupForm.register("email")}
                className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                placeholder="Enter your email"
              />
              {signupForm.formState.errors.email && (
                <p className="text-sm crypto-text-error">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...signupForm.register("password")}
                className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                placeholder="Create a password"
              />
              {signupForm.formState.errors.password && (
                <p className="text-sm crypto-text-error">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full crypto-bg-gold text-black hover:bg-yellow-400"
            >
              {register.isPending ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-gray-300">
              Already have an account?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="crypto-text-gold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
