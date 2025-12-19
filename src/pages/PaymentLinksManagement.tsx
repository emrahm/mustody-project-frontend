import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Copy, Eye, Trash2, Edit2, QrCode, Share2, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface PaymentLink {
  id: string;
  title: string;
  slug: string;
  amount: string;
  currency: string;
  blockchain: string;
  status: "active" | "expired" | "disabled";
  totalPayments: number;
  totalAmount: string;
  createdAt: string;
  expiresAt: string;
  views: number;
  conversions: number;
}

export default function PaymentLinksManagement() {
  const [, navigate] = useLocation();
  const [links, setLinks] = useState<PaymentLink[]>([
    {
      id: "1",
      title: "Invoice #001",
      slug: "inv-abc123",
      amount: "0.5",
      currency: "ETH",
      blockchain: "ethereum",
      status: "active",
      totalPayments: 3,
      totalAmount: "1.5",
      createdAt: "2024-01-15",
      expiresAt: "2024-02-15",
      views: 45,
      conversions: 3,
    },
    {
      id: "2",
      title: "Product Purchase",
      slug: "prod-def456",
      amount: "100",
      currency: "USDC",
      blockchain: "polygon",
      status: "active",
      totalPayments: 12,
      totalAmount: "1200",
      createdAt: "2024-01-10",
      expiresAt: "2024-02-10",
      views: 234,
      conversions: 12,
    },
    {
      id: "3",
      title: "Service Fee",
      slug: "svc-ghi789",
      amount: "0.1",
      currency: "BTC",
      blockchain: "bitcoin",
      status: "expired",
      totalPayments: 5,
      totalAmount: "0.5",
      createdAt: "2024-01-01",
      expiresAt: "2024-01-31",
      views: 89,
      conversions: 5,
    },
  ]);

  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "disabled">("all");

  const filteredLinks = links.filter((link) => filterStatus === "all" || link.status === filterStatus);

  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(`https://mustody.com/pay/${text}`);
    setCopied(linkId);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "disabled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const conversionRate = (link: PaymentLink) => {
    if (link.views === 0) return "0%";
    return ((link.conversions / link.views) * 100).toFixed(1) + "%";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Payment Links</h1>
              <p className="text-gray-600 mt-2">Create and manage crypto payment links for your customers</p>
            </div>
            <Button onClick={() => navigate("/create-payment-link")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Links</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{links.length}</p>
            <p className="text-green-600 text-sm mt-2">{links.filter((l) => l.status === "active").length} active</p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {links.reduce((sum, link) => sum + link.views, 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">All time</p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Total Payments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {links.reduce((sum, link) => sum + link.totalPayments, 0)}
            </p>
            <p className="text-gray-600 text-sm mt-2">Completed</p>
          </Card>

          <Card className="p-6">
            <p className="text-gray-600 text-sm font-medium">Avg Conversion</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(
                links.reduce((sum, link) => sum + (link.views > 0 ? link.conversions / link.views : 0), 0) /
                links.length *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-gray-600 text-sm mt-2">View to payment</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "active", "expired", "disabled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Payment Links Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Views</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Payments</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Conversion</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.length > 0 ? (
                  filteredLinks.map((link) => (
                    <tr
                      key={link.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => setSelectedLink(link.id)}
                      onMouseLeave={() => setSelectedLink(null)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{link.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {link.amount} {link.currency}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(link.status)}`}>
                          {link.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{link.views}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{link.totalPayments}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{conversionRate(link)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{link.createdAt}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`flex gap-2 transition-opacity ${selectedLink === link.id ? "opacity-100" : "opacity-0"}`}>
                          <button
                            onClick={() => copyToClipboard(link.slug, link.id)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Copy link"
                          >
                            {copied === link.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button className="p-2 hover:bg-gray-200 rounded transition-colors" title="View details">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-200 rounded transition-colors" title="Share">
                            <Share2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-200 rounded transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            className="p-2 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-600">
                      No payment links found. Create one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top Performing Links */}
        {links.length > 0 && (
          <Card className="p-6 mt-8">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Top Performing Links</h3>
            </div>
            <div className="space-y-4">
              {links
                .sort((a, b) => b.conversions - a.conversions)
                .slice(0, 3)
                .map((link, idx) => (
                  <div key={link.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-blue-600">#{idx + 1}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{link.title}</p>
                        <p className="text-sm text-gray-600">{link.conversions} payments received</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{link.totalAmount} {link.currency}</p>
                      <p className="text-sm text-gray-600">{conversionRate(link)} conversion rate</p>
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

// Import Check icon
import { Check } from "lucide-react";
