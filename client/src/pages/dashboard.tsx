import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { Home, Copy, Check, AlertTriangle, Info } from "lucide-react";
import type { UserPlan } from "@shared/schema";

export function Dashboard() {
  const { data: user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: userPlan } = useQuery<UserPlan>({
    queryKey: ["/api/plans/my"],
    enabled: !!user,
  });

  const createPlan = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest("POST", "/api/plans", planData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans/my"] });
      toast({
        title: "Plan selected!",
        description: "Your investment plan has been created. Please make your payment to activate it.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const plans = {
    basic: { name: "Basic Plan", investment: 500, returns: 2000, roi: 300, duration: 7 },
    gold: { name: "Gold Plan", investment: 1000, returns: 6500, roi: 550, duration: 7 },
    platinum: { name: "Platinum Plan", investment: 2000, returns: 15000, roi: 650, duration: 7 },
    diamond: { name: "Diamond Plan", investment: 5000, returns: 50000, roi: 900, duration: 7 },
  };

  const handlePlanSelect = (planType: string) => {
    const plan = plans[planType as keyof typeof plans];
    createPlan.mutate({
      planType,
      investmentAmount: plan.investment,
      expectedReturn: plan.returns,
      roi: plan.roi,
      status: "pending",
    });
  };

  const copyWalletAddress = () => {
    const walletAddress = "bc1qxq5vg8pqvu22897a4s5vk0as4dlske0j6mw5f8";
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen crypto-bg-dark flex items-center justify-center">
        <Card className="crypto-bg-gray border-gray-600 max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">Please log in to access your dashboard.</p>
            <Button onClick={() => window.location.href = "/"} className="crypto-bg-gold text-black">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen crypto-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold crypto-text-gold">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-300 text-lg">Manage your cryptocurrency investments</p>
          </div>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:border-gray-500 hover:crypto-text-gold transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Your Investment Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {userPlan ? (
                  <div className="space-y-6">
                    {/* Current Plan Status */}
                    <div className="crypto-bg-black rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          {plans[userPlan.planType as keyof typeof plans]?.name}
                        </h3>
                        <Badge
                          variant={userPlan.status === "active" ? "default" : "secondary"}
                          className={
                            userPlan.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {userPlan.status === "active" ? "Active" : "Pending"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold crypto-text-gold">
                            ${userPlan.investmentAmount.toLocaleString()}
                          </div>
                          <div className="text-gray-300 text-sm">Investment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold crypto-text-success">
                            ${userPlan.expectedReturn.toLocaleString()}
                          </div>
                          <div className="text-gray-300 text-sm">Expected Return</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold crypto-text-gold">
                            {userPlan.roi}%
                          </div>
                          <div className="text-gray-300 text-sm">ROI</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">7 days</div>
                          <div className="text-gray-300 text-sm">Duration</div>
                        </div>
                      </div>

                      {userPlan.status === "pending" && (
                        <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertTriangle className="text-yellow-500 mr-3 h-5 w-5" />
                            <p className="text-yellow-200">
                              Your plan is pending payment confirmation. Once payment is verified, your plan will be activated.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Instructions */}
                    {userPlan.status === "pending" && (
                      <div className="crypto-bg-black rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          <span className="crypto-text-gold mr-2">₿</span>
                          Payment Instructions
                        </h3>
                        <p className="text-gray-300 mb-4">
                          Send your investment amount to activate your plan.
                        </p>

                        <div className="mb-4">
                          <p className="text-gray-300 mb-2">
                            Send your Bitcoin payment to the wallet address below to activate your plan.
                          </p>
                          <p className="text-gray-300">
                            Amount to send:{" "}
                            <span className="font-semibold">
                              ${userPlan.investmentAmount.toLocaleString()} worth of Bitcoin
                            </span>
                          </p>
                        </div>

                        <div className="mb-4">
                          <Label className="text-gray-300 text-sm font-medium mb-2">
                            BTC Wallet Address:
                          </Label>
                          <div className="flex items-center mt-2">
                            <Input
                              value="bc1qxq5vg8pqvu22897a4s5vk0as4dlske0j6mw5f8"
                              readOnly
                              className="flex-1 crypto-bg-gray border-gray-600 text-white font-mono text-sm"
                            />
                            <Button
                              onClick={copyWalletAddress}
                              className="ml-2 crypto-bg-gold text-black hover:bg-yellow-400"
                            >
                              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
                          <div className="flex items-start">
                            <Info className="text-blue-400 mr-3 h-5 w-5 mt-0.5" />
                            <div>
                              <p className="text-blue-200">
                                <strong>Important:</strong> Your plan will be activated once our team
                                confirms your payment. This usually takes 1-24 hours. You'll receive an
                                email confirmation once activated.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-4">No Active Plan</h3>
                    <p className="text-gray-300 mb-8 text-lg">
                      Select an investment plan to start earning with CryptoPay
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(plans).map(([key, plan]) => (
                        <Card
                          key={key}
                          className="crypto-bg-black border-gray-600 hover:crypto-border-gold transition-all duration-200 cursor-pointer hover:shadow-lg hover:transform hover:scale-105"
                          onClick={() => handlePlanSelect(key)}
                        >
                          <CardContent className="p-6">
                            <h4 className="font-semibold mb-4 text-lg crypto-text-gold">{plan.name}</h4>
                            <div className="space-y-2 text-sm text-gray-300">
                              <div className="flex justify-between">
                                <span>Investment:</span>
                                <span className="font-semibold crypto-text-gold">${plan.investment.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Returns:</span>
                                <span className="font-semibold crypto-text-success">${plan.returns.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>ROI:</span>
                                <span className="font-semibold crypto-text-gold">{plan.roi}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="font-semibold text-white">{plan.duration} days</span>
                              </div>
                            </div>
                            <Button className="w-full mt-4 crypto-bg-gold text-black hover:bg-yellow-400 font-semibold">
                              Select This Plan
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Information */}
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-300 text-sm">Name</div>
                    <div className="text-white font-medium">{user.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">Email</div>
                    <div className="text-white font-medium">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">Status</div>
                    <div className="text-white font-medium">Active</div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">Member Since</div>
                    <div className="text-white font-medium">Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Invested</span>
                    <span className="crypto-text-gold font-semibold">
                      ${userPlan ? userPlan.investmentAmount.toLocaleString() : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Expected Returns</span>
                    <span className="crypto-text-success font-semibold">
                      ${userPlan ? userPlan.expectedReturn.toLocaleString() : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">ROI</span>
                    <span className="crypto-text-gold font-semibold">
                      {userPlan ? userPlan.roi : "0"}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
