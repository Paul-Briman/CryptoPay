import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { Home } from "lucide-react";
import { useMemo, useState } from "react";

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

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const { data: users = [], isLoading: loadingUsers } = useQuery<UserWithPlan[]>({
  queryKey: ["/api/admin/users"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/admin/users");
    return res.json();
  },
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

  const completePlan = useMutation({
  mutationFn: async (planId: number) => {
    const res = await apiRequest("PATCH", `/api/admin/complete-plan/${planId}`);
    if (!res.ok) throw new Error("Failed to complete plan");
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    toast({
      title: "Plan completed",
      description: "The plan has been marked as completed.",
    });
  },
  onError: () => {
    toast({
      title: "Error",
      description: "Failed to complete plan.",
      variant: "destructive",
    });
  },
});




  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user account has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user.",
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

  function handleDelete(id: number) {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser.mutate(id);
    }
  }

  function handleExport() {
    const csv = ["Name,Email,Plan,Amount,Status"];
    filteredUsers.forEach((u) => {
      const plan = u.plan ? plans[u.plan.planType as keyof typeof plans] : "";
      const amount = u.plan ? `$${u.plan.investmentAmount}` : "";
      const status = u.plan ? u.plan.status : "";
      csv.push(`${u.name},${u.email},${plan},${amount},${status}`);
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter((u) =>
        statusFilter === "all" || (u.plan?.status === statusFilter)
      )
      .filter((u) =>
        planFilter === "all" || (u.plan?.planType === planFilter)
      )
      .sort((a, b) => {
        if (sortBy === "amount") {
          return (b.plan?.investmentAmount || 0) - (a.plan?.investmentAmount || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [users, search, statusFilter, planFilter, sortBy]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

  if (!user) {
    window.location.href = "/admin-login";
    return null;
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen crypto-bg-dark flex items-center justify-center">
        <Card className="crypto-bg-gray border-gray-600 max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">You don't have permission to access this page.</p>
            <Button onClick={() => window.location.href = "/"} className="crypto-bg-gold text-black">
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen crypto-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold crypto-text-gold">Admin Panel</h1>
            <p className="text-gray-300">Manage users and investment plans</p>
          </div>
          <Button onClick={handleExport} className="crypto-bg-gold text-black">Export CSV</Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="crypto-bg-black border border-gray-600 text-white px-3 py-2 rounded"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="crypto-bg-black border border-gray-600 text-white px-3 py-2 rounded"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="crypto-bg-black border border-gray-600 text-white px-3 py-2 rounded"
          >
            <option value="all">All Plans</option>
            <option value="basic">Basic</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
            <option value="diamond">Diamond</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="crypto-bg-black border border-gray-600 text-white px-3 py-2 rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>

        <Card className="crypto-bg-gray border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="text-center py-8 text-gray-300">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No users found.</div>
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
                    {currentUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-600">
                        <td className="py-3 px-4 text-white">{user.name}</td>
                        <td className="py-3 px-4 text-white">{user.email}</td>
                        <td className="py-3 px-4 text-white">
                          {user.plan ? plans[user.plan.planType as keyof typeof plans] : "No plan"}
                        </td>
                        <td className="py-3 px-4 text-white">
                          {user.plan ? `$${user.plan.investmentAmount.toLocaleString()}` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {user.plan ? (
                            <Badge
                              variant={user.plan.status === "active" ? "default" : "secondary"}
                              className={
                                user.plan.status === "active"
                                  ? "bg-green-600 text-white"
                                  : user.plan.status === "completed"
                                  ? "bg-blue-600 text-white"
                                  : "bg-yellow-500 text-black"
                              }
                            >
                              {user.plan.status}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 flex-wrap">
                            {user.plan?.status === "pending" && (
                              <Button
                                onClick={() => activatePlan.mutate(user.plan!.id)}
                                disabled={activatePlan.isPending}
                                size="sm"
                                className="crypto-bg-gold text-black hover:bg-yellow-400"
                              >
                                {activatePlan.isPending ? "Activating..." : "Activate"}
                              </Button>
                            )}
                            {user.plan?.status === "active" && (
                              <Button
                                onClick={() => completePlan.mutate(user.plan!.id)}
                                disabled={completePlan.isPending}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {completePlan.isPending ? "Completing..." : "Mark as Completed"}
                              </Button>
                            )}
                            {!user.isAdmin && (
                              <Button
                                onClick={() => handleDelete(user.id)}
                                variant="destructive"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded ${
                      currentPage === page
                        ? "crypto-bg-gold text-black"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






