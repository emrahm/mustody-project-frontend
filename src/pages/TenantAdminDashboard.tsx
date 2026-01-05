import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Users, Wallet, Key, Link2 } from "lucide-react";
import { useState } from "react";

export default function TenantAdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Tenant Admin</h1>
              <p className="text-gray-600 mt-2">Manage your organization and resources</p>
            </div>
            <Button>Create New Resource</Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "users", label: "Users", icon: "👥" },
              { id: "team", label: "Team", icon: "🏢" },
              { id: "wallets", label: "Wallets", icon: "💰" },
              { id: "api-keys", label: "API Keys", icon: "🔑" },
              { id: "payment-links", label: "Payment Links", icon: "🔗" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 border-b-2 font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">Team Members</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">Active Wallets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">256</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">API Keys</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">5</p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add User</h3>
                    <p className="text-sm text-gray-600">Invite team member</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Create Wallet</h3>
                    <p className="text-sm text-gray-600">New crypto wallet</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Generate API Key</h3>
                    <p className="text-sm text-gray-600">For integrations</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Link2 className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Payment Link</h3>
                    <p className="text-sm text-gray-600">Create payment link</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: "Wallet Created", resource: "Production Wallet", time: "2 hours ago", status: "success" },
                  { action: "User Added", resource: "john@example.com", time: "5 hours ago", status: "success" },
                  { action: "API Key Generated", resource: "sk_prod_123", time: "1 day ago", status: "success" },
                  { action: "Transaction Sent", resource: "0.5 ETH", time: "2 days ago", status: "success" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.resource}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{item.time}</p>
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, name: "Alice Johnson", email: "alice@company.com", role: "Admin", status: "active" },
                    { id: 2, name: "Bob Smith", email: "bob@company.com", role: "User", status: "active" },
                    { id: 3, name: "Carol White", email: "carol@company.com", role: "User", status: "inactive" },
                  ].map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="outline" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "team" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Team Management</h3>
              <Button onClick={() => window.location.href = '/team'}>
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </div>
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Takım üyelerinizi yönetin</p>
              <p className="text-sm text-gray-500">Yeni üye davet edin ve mevcut üyeleri görüntüleyin</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = '/team'}
              >
                Takım Yönetimine Git
              </Button>
            </div>
          </Card>
        )}

        {activeTab === "wallets" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Wallets</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Wallet
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "Production Wallet", blockchain: "Ethereum", balance: "5.25 ETH", status: "active" },
                { name: "Test Wallet", blockchain: "Polygon", balance: "100 MATIC", status: "active" },
              ].map((wallet, idx) => (
                <Card key={idx} className="p-6 border-2 border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                    <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      {wallet.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Blockchain: {wallet.blockchain}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-4">{wallet.balance}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Send</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "api-keys" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">API Keys</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Key
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Key</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Last Used</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, name: "Production", key: "sk_prod_***", status: "active", lastUsed: "5 minutes ago" },
                    { id: 2, name: "Development", key: "sk_dev_***", status: "active", lastUsed: "2 days ago" },
                  ].map((key) => (
                    <tr key={key.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{key.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{key.key}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {key.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{key.lastUsed}</td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="outline" size="sm" className="text-red-600">Revoke</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === "payment-links" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Payment Links</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Link
              </Button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Invoice #001", amount: "0.5 ETH", status: "active", created: "2024-01-15" },
                { title: "Invoice #002", amount: "1.0 ETH", status: "paid", created: "2024-01-14" },
              ].map((link, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <h4 className="font-semibold text-gray-900">{link.title}</h4>
                    <p className="text-sm text-gray-600">Created: {link.created}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{link.amount}</p>
                    <span className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                      link.status === "active" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {link.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
