import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "../lib/auth";
import { loginSchema } from "@shared/schema";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Bitcoin, Shield } from "lucide-react";
import { Link } from "wouter";
import type { LoginData } from "@shared/schema";

export function AdminLogin() {
  const { toast } = useToast();
  const login = useLogin();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = (data: LoginData) => {
    login.mutate(data, {
      onSuccess: (user) => {
        if (user.isAdmin) {
          toast({
            title: "Welcome, Admin!",
            description: "You have been successfully logged in to the admin panel.",
          });
          window.location.href = "/admin";
        } else {
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
          });
        }
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

  return (
    <div className="min-h-screen crypto-bg-dark flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="crypto-bg-gray border-gray-600 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Bitcoin className="h-12 w-12 crypto-text-gold mr-2" />
              <span className="text-2xl font-bold crypto-text-gold">CryptoPay</span>
            </div>
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
              <Shield className="h-6 w-6 crypto-text-gold mr-2" />
              Admin Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Username/Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  {...form.register("email")}
                  className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                  placeholder="Enter admin username or email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm crypto-text-error">
                    {form.formState.errors.email.message}
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
                  {...form.register("password")}
                  className="crypto-bg-black border-gray-600 text-white focus:crypto-border-gold"
                  placeholder="Enter admin password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm crypto-text-error">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={login.isPending}
                className="w-full crypto-bg-gold text-black hover:bg-yellow-400 font-semibold py-3"
              >
                {login.isPending ? "Logging in..." : "Login as Admin"}
              </Button>

              <div className="text-center mt-4">
                <Link href="/" className="text-gray-300 hover:crypto-text-gold transition-colors">
                  ← Back to Homepage
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}