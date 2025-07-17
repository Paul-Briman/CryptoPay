import { useEffect, useState } from "react";
import { ForgotPasswordModal } from "./forgot-password-modal";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useRegister } from "../lib/auth";
import { loginSchema, insertUserSchema } from "@shared/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "../hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import type { LoginData, InsertUser } from "@shared/schema";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

const phonePrefixes = [
  { code: "+61", label: "Australia" },
  { code: "+55", label: "Brazil" },
  { code: "+86", label: "China" },
  { code: "+20", label: "Egypt" },
  { code: "+33", label: "France" },
  { code: "+49", label: "Germany" },
  { code: "+30", label: "Greece" },
  { code: "+36", label: "Hungary" },
  { code: "+91", label: "India" },
  { code: "+62", label: "Indonesia" },
  { code: "+39", label: "Italy" },
  { code: "+81", label: "Japan" },
  { code: "+254", label: "Kenya" },
  { code: "+60", label: "Malaysia" },
  { code: "+52", label: "Mexico" },
  { code: "+212", label: "Morocco" },
  { code: "+31", label: "Netherlands" },
  { code: "+234", label: "Nigeria" },
  { code: "+92", label: "Pakistan" },
  { code: "+63", label: "Philippines" },
  { code: "+7", label: "Russia" },
  { code: "+65", label: "Singapore" },
  { code: "+27", label: "South Africa" },
  { code: "+82", label: "South Korea" },
  { code: "+34", label: "Spain" },
  { code: "+94", label: "Sri Lanka" },
  { code: "+65", label: "Singapore" },
  { code: "+44", label: "UK" },
  { code: "+256", label: "Uganda" },
  { code: "+1", label: "US/Canada" },
  { code: "+84", label: "Vietnam" },
  { code: "+260", label: "Zambia" },
  { code: "+263", label: "Zimbabwe" },
];



export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<any>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phonePrefix: "+1",
      phoneNumber: "",
    },
  });

  const handleLogin = (data: LoginData) => {
    login.mutate(data, {
      onSuccess: (user) => {
        toast({
          title: "Welcome back!",
          description: "Logged in successfully.",
        });
        setLocation(user.isAdmin ? "/admin" : "/dashboard");
        loginForm.reset();
        onClose();
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err.message || "Invalid credentials",
          variant: "destructive",
        });
      },
    });
  };

  const handleSignup = (data: InsertUser) => {
    if (!termsAccepted) {
      toast({
        title: "Please accept Terms and Conditions",
        variant: "destructive",
      });
      return;
    }

    register.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Account created!",
          description: "Welcome to CryptoPay.",
        });
        signupForm.reset();
        onClose();
        setTermsAccepted(false);
      },
      onError: (err: any) => {
        toast({
          title: "Signup failed",
          description: err.message || "Registration failed",
          variant: "destructive",
        });
      },
    });
  };

  const isSignupValid = () => {
    const values = signupForm.getValues();
    return (
      values.name &&
      values.email &&
      /\S+@\S+\.\S+/.test(values.email) &&
      values.password &&
      values.confirmPassword &&
      values.phonePrefix &&
      values.phoneNumber &&
      termsAccepted
    );
  };

  const PasswordToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-sm text-gray-400 hover:text-white ml-2"
    >
      {showPassword ? (
        <EyeOff className="w-4 h-4" />
      ) : (
        <Eye className="w-4 h-4" />
      )}
    </button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[90vw] max-h-[90vh] overflow-y-auto sm:rounded-lg crypto-bg-gray border border-gray-600 p-6">
        <DialogHeader className="flex flex-col items-center justify-center space-y-2 mb-4">
          <DialogTitle className="text-3xl font-bold text-white text-center">
            {mode === "login" ? "Login" : "Sign Up"}
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...loginForm.register("email")}
                className="crypto-bg-black text-white border-gray-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="flex items-center">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...loginForm.register("password")}
                  className="crypto-bg-black text-white border-gray-600"
                  placeholder="Enter your password"
                />
                <PasswordToggle />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-yellow-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" className="w-full crypto-bg-gold text-black">
              {login.isPending ? "Logging in..." : "Login"}
            </Button>

            <p className="text-center text-gray-300">
              Don’t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="crypto-text-gold hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form
            onSubmit={signupForm.handleSubmit(handleSignup)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="name"
                {...signupForm.register("name")}
                className="crypto-bg-black text-white border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...signupForm.register("email")}
                className="crypto-bg-black text-white border-gray-600"
              />
              {signupForm.watch("email") &&
                !/\S+@\S+\.\S+/.test(signupForm.watch("email")) && (
                  <p className="text-sm text-red-400 mt-1">
                    Please enter a valid email
                  </p>
                )}
            </div>

            <div>
              <Label htmlFor="phone" className="text-gray-300">
                Phone Number
              </Label>
              <div className="flex space-x-2">
                <select
                  {...signupForm.register("phonePrefix")}
                  className="w-1/3 crypto-bg-black text-white border-gray-600 rounded-md"
                >
                  {phonePrefixes.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label} ({p.code})
                    </option>
                  ))}
                </select>
                <Input
                  id="phone"
                  type="tel"
                  {...signupForm.register("phoneNumber")}
                  className="w-2/3 crypto-bg-black text-white border-gray-600"
                  placeholder="2125551234"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...signupForm.register("password")}
                className="crypto-bg-black text-white border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                {...signupForm.register("confirmPassword")}
                className="crypto-bg-black text-white border-gray-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                I agree to the{" "}
                <a href="" className="text-yellow-400 underline">
                  Terms & Conditions
                </a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={!isSignupValid() || register.isPending}
              className="w-full crypto-bg-gold text-black"
            >
              {register.isPending ? "Creating account..." : "Sign Up"}
            </Button>

            <p className="text-center text-gray-300">
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="crypto-text-gold hover:underline"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </DialogContent>
      <ForgotPasswordModal
        open={forgotOpen}
        onOpenChange={() => setForgotOpen(false)}
      />
    </Dialog>
  );
}
