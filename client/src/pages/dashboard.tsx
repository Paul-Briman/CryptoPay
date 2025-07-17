import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { Home, Copy, Check } from "lucide-react";
import type { UserPlan } from "@shared/schema";
import { useLocation } from "wouter";

export function Dashboard() {
  const { data: user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && user?.isAdmin) {
      setLocation("/admin");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const { data: userPlans = [] } = useQuery<UserPlan[]>({
    queryKey: ["/api/user/plans"],
    enabled: !!user,
  });
  const { data: walletData } = useQuery<{ balance: number }>({
    queryKey: ["/api/user/wallet"],
    enabled: !!user,
  });

  const activePlan = userPlans.find((plan) => plan.status === "active");
  const pendingPlan = userPlans.find((plan) => plan.status === "pending");
  const completedPlan = userPlans.find((plan) => plan.status === "completed");

  const createPlan = useMutation({
    mutationFn: async (planData: any) => {
      const response = await apiRequest("POST", "/api/user/plans", planData);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/plans"] });
      toast({
        title: "Plan selected!",
        description:
          "Your investment plan has been created. Please make your payment to activate it.",
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
    basic: {
      name: "Basic Plan",
      investment: 500,
      returns: 2000,
      roi: 300,
      duration: 7,
    },
    gold: {
      name: "Gold Plan",
      investment: 1000,
      returns: 6500,
      roi: 550,
      duration: 7,
    },
    platinum: {
      name: "Platinum Plan",
      investment: 2000,
      returns: 15000,
      roi: 650,
      duration: 7,
    },
    diamond: {
      name: "Diamond Plan",
      investment: 5000,
      returns: 50000,
      roi: 900,
      duration: 7,
    },
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

  if (isLoading || !user || user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen crypto-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold crypto-text-gold">
              Welcome back, {user.name}!
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your cryptocurrency investments
            </p>
          </div>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">
                  Your Investment Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {completedPlan ? (
  <>
    <div className="text-center py-12">
      <h3 className="text-xl font-semibold mb-4 text-blue-400">
        Plan Completed!
      </h3>
      <p className="text-gray-300 mb-4 text-lg">
        Your {completedPlan.planType} has been completed. You can now withdraw your earnings.
      </p>
      <Badge variant="outline" className="border-blue-400 text-blue-400">
        Status: Completed
      </Badge>
    </div>

    {/* Show Select Plan section again */}
    <div className="mt-10">
      <h3 className="text-xl font-semibold mb-6 text-white text-center">
        Select a New Investment Plan
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(plans).map(([key, plan]) => (
          <Card
            key={key}
            className="crypto-bg-black border-gray-600 hover:crypto-border-gold transition-all duration-200 cursor-pointer hover:shadow-lg hover:transform hover:scale-105"
          >
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4 text-lg crypto-text-gold">
                {plan.name}
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Investment:</span>
                  <span className="font-semibold crypto-text-gold">
                    ${plan.investment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Returns:</span>
                  <span className="font-semibold crypto-text-success">
                    ${plan.returns.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ROI:</span>
                  <span className="font-semibold crypto-text-gold">
                    {plan.roi}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-semibold text-white">
                    {plan.duration} days
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handlePlanSelect(key)}
                className="w-full mt-4 bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
              >
                Select This Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </>
) : activePlan ? (
  <div className="text-center py-12">
    <h3 className="text-xl font-semibold mb-4 text-green-400">Plan Active!</h3>
    <p className="text-gray-300 mb-4 text-lg">
      Your {activePlan.planType} is active. ROI will be delivered in{" "}
      {plans[activePlan.planType as keyof typeof plans]?.duration ?? 7} days.
    </p>
    <Badge variant="outline" className="border-green-400 text-green-400">
      Status: Active
    </Badge>
  </div>
) : pendingPlan ? (
  <div className="text-center py-12">
    <h3 className="text-xl font-semibold mb-4 text-yellow-400">
      Pending Payment
    </h3>
    <p className="text-gray-300 mb-6 text-lg">
      Please send{" "}
      <span className="font-bold text-white">
        ${pendingPlan.investmentAmount.toLocaleString()}
      </span>{" "}
      to the wallet address below to activate your plan.
    </p>
    <div className="bg-gray-900 border border-yellow-500 rounded-lg px-4 py-3 inline-block mb-4">
      <code className="text-yellow-400 break-all">
        bc1qxq5vg8pqvu22897a4s5vk0as4dlske0j6mw5f8
      </code>
    </div>
    <div>
      <Button
        onClick={copyWalletAddress}
        className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </>
        )}
      </Button>
    </div>
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
        >
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 text-lg crypto-text-gold">
              {plan.name}
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Investment:</span>
                <span className="font-semibold crypto-text-gold">
                  ${plan.investment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Returns:</span>
                <span className="font-semibold crypto-text-success">
                  ${plan.returns.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ROI:</span>
                <span className="font-semibold crypto-text-gold">
                  {plan.roi}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-white">
                  {plan.duration} days
                </span>
              </div>
            </div>
            <Button
              onClick={() => handlePlanSelect(key)}
              className="w-full mt-4 bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
            >
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

          {/* Right Side Cards */}
          <div className="space-y-6">
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold crypto-text-gold">
                  ${walletData?.balance?.toLocaleString() ?? "0"}
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  This is your total balance.
                </p>
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">
                  Account Information
                </CardTitle>
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
                      $
                      {activePlan
                        ? activePlan.investmentAmount.toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Expected Returns</span>
                    <span className="crypto-text-success font-semibold">
                      $
                      {activePlan
                        ? activePlan.expectedReturn.toLocaleString()
                        : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">ROI</span>
                    <span className="crypto-text-gold font-semibold">
                      {activePlan ? activePlan.roi : "0"}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdraw */}
            <Card className="crypto-bg-gray border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Withdraw Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {completedPlan ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const walletInput = form.elements.namedItem(
                        "wallet"
                      ) as HTMLInputElement;
                      const btcWallet = walletInput.value.trim();

                      if (!btcWallet) {
                        toast({
                          title: "Error",
                          description:
                            "Please enter a valid BTC wallet address.",
                          variant: "destructive",
                        });
                        return;
                      }

                      toast({
                        title: "Withdraw request sent",
                        description: `Your funds will be sent to ${btcWallet}.`,
                      });

                      walletInput.value = "";
                    }}
                    className="space-y-4"
                  >
                    <Label htmlFor="wallet" className="text-sm text-gray-300">
                      BTC Wallet Address
                    </Label>
                    <Input
                      name="wallet"
                      id="wallet"
                      placeholder="Paste your BTC wallet address"
                      className="crypto-bg-black text-white border-gray-700"
                    />
                    <Button
                      type="submit"
                      className="w-full crypto-bg-gold text-black hover:bg-yellow-400"
                    >
                      Request Withdrawal
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-400">
                    You need a completed plan to withdraw earnings.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

