import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Wallet, 
  TrendingUp, 
  Plus, 
  Settings, 
  Eye,
  Network,
  Shield,
  Coins,
  ArrowUpRight,
  Activity
} from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: "active" | "pending" | "suspended";
  wallets: number;
  users: number;
  volume: string;
  chains: string[];
  created_at: string;
}

export default function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: "1",
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active",
      wallets: 1250,
      users: 45,
      volume: "$2.4M",
      chains: ["Ethereum", "Polygon", "Cosmos"],
      created_at: "2024-01-15"
    },
    {
      id: "2", 
      name: "TechStart Inc",
      slug: "techstart-inc",
      status: "active",
      wallets: 890,
      users: 23,
      volume: "$1.8M",
      chains: ["Ethereum", "Cosmos"],
      created_at: "2024-02-20"
    },
    {
      id: "3",
      name: "Global Finance",
      slug: "global-finance", 
      status: "pending",
      wallets: 0,
      users: 0,
      volume: "$0",
      chains: [],
      created_at: "2024-12-20"
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "suspended": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Tenant Management
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your multi-tenant custody wallet infrastructure</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Tenant
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white/70 dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenants.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Wallets</p>
                    <p className="text-2xl font-bold text-white">
                      {tenants.reduce((sum, t) => sum + t.wallets, 0).toLocaleString()}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">
                      {tenants.reduce((sum, t) => sum + t.users, 0)}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-black/40 border-white/10 backdrop-blur-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Volume</p>
                    <p className="text-2xl font-bold text-white">$4.2M</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tenants List */}
        <div className="space-y-4">
          {tenants.map((tenant, index) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border-white/10 backdrop-blur-md hover:bg-black/60 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{tenant.name}</h3>
                        <p className="text-gray-400 text-sm">/{tenant.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{tenant.wallets.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Wallets</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{tenant.users}</p>
                        <p className="text-xs text-gray-400">Users</p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{tenant.volume}</p>
                        <p className="text-xs text-gray-400">Volume</p>
                      </div>

                      <div className="flex space-x-2">
                        {tenant.chains.map((chain) => (
                          <Badge key={chain} variant="outline" className="border-white/20 text-gray-300">
                            {chain}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {tenant.status === "active" && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">MPC Security Active</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Network className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">{tenant.chains.length} Chains Connected</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">API Active</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Plus className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Create New Tenant</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Set up a new tenant with isolated wallet infrastructure and user management.
              </p>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-0">
                Get Started <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Network className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Chain Integration</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Add support for new blockchain networks and configure multi-chain operations.
              </p>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                Configure Chains <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-green-500/20 border-white/10 backdrop-blur-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Security Settings</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Configure MPC parameters, key management, and security policies.
              </p>
              <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                Security Center <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
