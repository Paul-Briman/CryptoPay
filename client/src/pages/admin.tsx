import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { Home } from "lucide-react";

interface UserWithPlan {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  plan: {
    id: number;
    planType: string;
    investmentAmount: number;
    expectedReturn: number;
    roi: number;
    status: string;
  } | null;
}

export function Admin() {
  const { data: user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserWithPlan[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const activatePlan = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/plans/${planId}/status`, {
        status: "active",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Plan activated!",
        description: "The user's plan has been successfully activated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate plan",
        variant: "destructive",
      });
    },
  });

  const plans = {
    basic: "Basic Plan",
    gold: "Gold Plan",
    platinum: "Platinum Plan",
    diamond: "Diamond Plan",
  };

  if (!user) {
    return (
      <div className="min-h-screen crypto-bg-dark flex items-center justify-center">
        <Card className="crypto-bg-gray border-gray-600 max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">Please log in to access the admin panel.</p>
            <Button onClick={() => window.location.href = "/"} className="crypto-bg-gold text-black">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen crypto-bg-dark flex items-center justify-center">
        <Card className="crypto-bg-gray border-gray-600 max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">You don't have permission to access this page.</p>
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
        {/* Admin Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold crypto-text-gold">Admin Panel</h1>
            <p className="text-gray-300">Manage users and investment plans</p>
          </div>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:border-gray-500"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Users Management */}
        <Card className="crypto-bg-gray border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-300">Loading users...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-gray-300">Plan</th>
                      <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-600">
                        <td className="py-3 px-4 text-white">{user.name}</td>
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-white">
                          {user.plan 
                            ? plans[user.plan.planType as keyof typeof plans] 
                            : "No plan"}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {user.plan 
                            ? `$${user.plan.investmentAmount.toLocaleString()}` 
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {user.plan ? (
                            <Badge
                              variant={user.plan.status === "active" ? "default" : "secondary"}
                              className={
                                user.plan.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {user.plan.status}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.plan?.status === "pending" ? (
                            <Button
                              onClick={() => activatePlan.mutate(user.plan!.id)}
                              disabled={activatePlan.isPending}
                              size="sm"
                              className="crypto-bg-gold text-black hover:bg-yellow-400"
                            >
                              {activatePlan.isPending ? "Activating..." : "Activate"}
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
