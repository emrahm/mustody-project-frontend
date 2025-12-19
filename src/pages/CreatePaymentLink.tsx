import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy, Check, QrCode } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatePaymentLink() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "ETH",
    blockchain: "ethereum",
    recipientAddress: "",
    expiresIn: "30", // days
    maxPayments: "",
    notificationEmail: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    slug: string;
    url: string;
    qrCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const blockchains = [
    { value: "ethereum", label: "Ethereum (ETH)" },
    { value: "bitcoin", label: "Bitcoin (BTC)" },
    { value: "polygon", label: "Polygon (MATIC)" },
    { value: "solana", label: "Solana (SOL)" },
    { value: "arbitrum", label: "Arbitrum (ARB)" },
  ];

  const currencies = [
    { value: "ETH", label: "Ethereum (ETH)" },
    { value: "BTC", label: "Bitcoin (BTC)" },
    { value: "MATIC", label: "Polygon (MATIC)" },
    { value: "SOL", label: "Solana (SOL)" },
    { value: "USDC", label: "USD Coin (USDC)" },
    { value: "USDT", label: "Tether (USDT)" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setCreatedLink({
        slug: "inv-" + Math.random().toString(36).substr(2, 9),
        url: `https://mustody.com/pay/inv-${Math.random().toString(36).substr(2, 9)}`,
        qrCode: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23fff' width='200' height='200'/%3E%3C/svg%3E",
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const copyToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-8">
            <button
              onClick={() => navigate("/payment-links")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Payment Links
            </button>
            <h1 className="text-4xl font-bold text-gray-900">Payment Link Created!</h1>
            <p className="text-gray-600 mt-2">Your payment link is ready to share</p>
          </div>
        </div>

        {/* Success Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Success Card */}
            <Card className="p-8 mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-center mb-8">
                <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                <p className="text-gray-600 mt-2">Your payment link has been created successfully</p>
              </div>

              {/* Link Details */}
              <div className="space-y-6">
                {/* Payment Link */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdLink.url}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm"
                    />
                    <Button onClick={copyToClipboard} className="flex gap-2">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">QR Code</label>
                  <div className="bg-white p-6 rounded-lg border border-gray-200 inline-block">
                    <div className="w-40 h-40 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Scan to open payment link</p>
                </div>

                {/* Payment Details */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {formData.amount} {formData.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Blockchain:</span>
                      <span className="font-semibold text-gray-900">
                        {blockchains.find((b) => b.value === formData.blockchain)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires In:</span>
                      <span className="font-semibold text-gray-900">{formData.expiresIn} days</span>
                    </div>
                    {formData.maxPayments && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Payments:</span>
                        <span className="font-semibold text-gray-900">{formData.maxPayments}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                <Button className="flex-1" onClick={() => navigate("/payment-links")}>
                  View All Links
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                  Dashboard
                </Button>
              </div>
            </Card>

            {/* Share Options */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Payment Link</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: "📧", label: "Email", action: "email" },
                  { icon: "💬", label: "WhatsApp", action: "whatsapp" },
                  { icon: "𝕏", label: "Twitter", action: "twitter" },
                  { icon: "📋", label: "Copy", action: "copy" },
                ].map((option) => (
                  <button
                    key={option.action}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <button
            onClick={() => navigate("/payment-links")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Links
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Create Payment Link</h1>
          <p className="text-gray-600 mt-2">Generate a shareable crypto payment link for your customers</p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="form-label">Payment Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Invoice #001, Product Purchase"
                  className="input"
                  required
                />
                <p className="form-hint">A descriptive name for this payment link</p>
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add details about what this payment is for..."
                  className="input"
                  rows={3}
                />
                <p className="form-hint">Optional description shown to payers</p>
              </div>

              {/* Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.0001"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Currency *</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="input">
                    {currencies.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Blockchain */}
              <div>
                <label className="form-label">Blockchain *</label>
                <select name="blockchain" value={formData.blockchain} onChange={handleChange} className="input">
                  {blockchains.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <p className="form-hint">Select the blockchain network for this payment</p>
              </div>

              {/* Recipient Address */}
              <div>
                <label className="form-label">Recipient Address *</label>
                <input
                  type="text"
                  name="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={handleChange}
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f8f2b"
                  className="input font-mono text-sm"
                  required
                />
                <p className="form-hint">The wallet address that will receive the payment</p>
              </div>

              {/* Expiration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Expires In (Days) *</label>
                  <input
                    type="number"
                    name="expiresIn"
                    value={formData.expiresIn}
                    onChange={handleChange}
                    min="1"
                    max="365"
                    className="input"
                    required
                  />
                  <p className="form-hint">How long the link remains active</p>
                </div>
                <div>
                  <label className="form-label">Max Payments (Optional)</label>
                  <input
                    type="number"
                    name="maxPayments"
                    value={formData.maxPayments}
                    onChange={handleChange}
                    placeholder="Unlimited"
                    min="1"
                    className="input"
                  />
                  <p className="form-hint">Leave empty for unlimited</p>
                </div>
              </div>

              {/* Notification Email */}
              <div>
                <label className="form-label">Notification Email</label>
                <input
                  type="email"
                  name="notificationEmail"
                  value={formData.notificationEmail}
                  onChange={handleChange}
                  placeholder="notify@example.com"
                  className="input"
                />
                <p className="form-hint">Email address to receive payment notifications</p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Creating..." : "Create Payment Link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/payment-links")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {/* Info Card */}
          <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Payment Link Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Payment links are public and don't require authentication</li>
              <li>• Customers can pay from any wallet supporting the selected blockchain</li>
              <li>• You'll receive instant notifications when payments are received</li>
              <li>• All payments are recorded in your transaction history</li>
              <li>• You can disable or modify links anytime from the dashboard</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
