import { Link, useLocation } from "wouter";
import { Shield, Server, Key, Zap, CheckCircle, ArrowRight, Lock, Globe, Users, Star, BarChart3, Wallet, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function Homepage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token && !!user);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation for authenticated users */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Mustody</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <Button onClick={() => setLocation('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
            <p className="text-gray-600 mt-2">Manage your digital assets and blockchain infrastructure</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Wallet className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                    <p className="text-2xl font-bold text-gray-900">$2.4M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Wallets</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Key className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">API Keys</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Security Score</p>
                    <p className="text-2xl font-bold text-gray-900">98%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/dashboard')}>
              <CardContent className="p-6">
                <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-4">View detailed analytics and performance metrics</p>
                <Button variant="outline" className="w-full">
                  View Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/api-keys')}>
              <CardContent className="p-6">
                <Key className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Management</h3>
                <p className="text-gray-600 mb-4">Manage API keys and integration settings</p>
                <Button variant="outline" className="w-full">
                  Manage APIs <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/messaging')}>
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                <p className="text-gray-600 mb-4">Communicate with your team members</p>
                <Button variant="outline" className="w-full">
                  Open Messages <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Original homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Mustody</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900 font-medium">Security</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">Log In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Trusted by 5000+ enterprises worldwide
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Blockchain Infrastructure for
              <span className="text-blue-600 block">Modern Business</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Secure digital asset custody with Multi-Party Computation technology. 
              One integration, multiple blockchains. Build without the complexity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Start Building <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Infrastructure</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for scale, security, and reliability. Everything you need to integrate blockchain technology.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Shield className="h-12 w-12 text-blue-600 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Multi-Party Computation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced cryptographic security with distributed key management. No single point of failure.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Server className="h-12 w-12 text-blue-600 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Multi-Chain Support</h3>
                <p className="text-gray-600 leading-relaxed">
                  One API for Bitcoin, Ethereum, and 50+ blockchains. Unified interface for all networks.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Key className="h-12 w-12 text-blue-600 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Developer-First APIs</h3>
                <p className="text-gray-600 leading-relaxed">
                  RESTful APIs, WebSocket streams, and SDKs. Get started in minutes, not months.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">Mustody</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Enterprise blockchain infrastructure for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Custody Wallet</a></li>
                <li><a href="#" className="hover:text-white transition-colors">RPC Network</a></li>
                <li><a href="#" className="hover:text-white transition-colors">APIs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Mustody. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
