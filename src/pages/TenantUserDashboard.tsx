import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function TenantUserDashboard() {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Wallets</h1>
            <p className="text-gray-600 mt-2">Manage and monitor your crypto assets</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Total Balance Card */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Balance</p>
              <div className="flex items-center gap-3 mt-2">
                <h2 className="text-4xl font-bold">
                  {showBalance ? "$24,580.50" : "••••••"}
                </h2>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  {showBalance ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-blue-100 text-sm mt-2">+2.5% from last month</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Across 3 wallets</p>
            </div>
          </div>
        </Card>

        {/* Wallets Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Wallets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Ethereum Wallet",
                blockchain: "Ethereum",
                address: "0x742d...8f2b",
                balance: "5.25",
                currency: "ETH",
                usdValue: "$9,450",
              },
              {
                name: "Polygon Wallet",
                blockchain: "Polygon",
                address: "0x9a5c...3d1e",
                balance: "1,250",
                currency: "MATIC",
                usdValue: "$1,125",
              },
              {
                name: "Bitcoin Wallet",
                blockchain: "Bitcoin",
                address: "1A1z...EWDj",
                balance: "0.35",
                currency: "BTC",
                usdValue: "$14,005",
              },
            ].map((wallet, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {wallet.blockchain}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-mono">{wallet.address}</span>
                </p>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm text-gray-600">Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {wallet.balance} <span className="text-lg text-gray-600">{wallet.currency}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{wallet.usdValue}</p>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Receive
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {[
              {
                type: "send",
                description: "Sent to 0x742d...8f2b",
                amount: "-0.5 ETH",
                usdAmount: "-$900",
                time: "2 hours ago",
                status: "confirmed",
              },
              {
                type: "receive",
                description: "Received from 0x9a5c...3d1e",
                amount: "+100 MATIC",
                usdAmount: "+$90",
                time: "5 hours ago",
                status: "confirmed",
              },
              {
                type: "send",
                description: "Sent to 1A1z...EWDj",
                amount: "-0.1 BTC",
                usdAmount: "-$4,000",
                time: "1 day ago",
                status: "confirmed",
              },
              {
                type: "receive",
                description: "Received from external wallet",
                amount: "+2.0 ETH",
                usdAmount: "+$3,600",
                time: "2 days ago",
                status: "confirmed",
              },
            ].map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    tx.type === "send"
                      ? "bg-red-100"
                      : "bg-green-100"
                  }`}>
                    {tx.type === "send" ? (
                      <ArrowUpRight className={`w-5 h-5 ${tx.type === "send" ? "text-red-600" : "text-green-600"}`} />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-600">{tx.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === "send"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {tx.amount}
                  </p>
                  <p className="text-sm text-gray-600">{tx.usdAmount}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-6">View All Transactions</Button>
        </Card>
      </div>
    </div>
  );
}
