import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Wallet, TrendingUp, Lock } from "lucide-react";

// Dummy data for charts
const walletData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 2000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
];

const transactionData = [
  { name: "Mon", transactions: 24 },
  { name: "Tue", transactions: 13 },
  { name: "Wed", transactions: 98 },
  { name: "Thu", transactions: 39 },
  { name: "Fri", transactions: 48 },
  { name: "Sat", transactions: 38 },
  { name: "Sun", transactions: 43 },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user?.name || "Administrator"}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Export Report</Button>
              <Button>Create Tenant</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
                <p className="text-green-600 text-sm mt-2">+2 this month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Wallets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
                <p className="text-green-600 text-sm mt-2">+12 this week</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Volume</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">$2.4M</p>
                <p className="text-green-600 text-sm mt-2">+8.2% from last month</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">API Keys Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">89</p>
                <p className="text-yellow-600 text-sm mt-2">3 revoked this week</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Lock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Wallet Balance Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Wallet Balance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={walletData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Transaction Volume Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Transactions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }} 
                />
                <Bar dataKey="transactions" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Tenants</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tenant Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Wallets</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: "Acme Corp", email: "admin@acme.com", status: "active", wallets: 8, created: "2024-01-15" },
                  { id: 2, name: "TechStart Inc", email: "contact@techstart.com", status: "active", wallets: 12, created: "2024-01-10" },
                  { id: 3, name: "Global Finance", email: "info@globalfinance.com", status: "inactive", wallets: 0, created: "2024-01-05" },
                ].map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tenant.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenant.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        tenant.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenant.wallets}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenant.created}</td>
                    <td className="px-6 py-4 text-sm">
                      <Button variant="outline" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
