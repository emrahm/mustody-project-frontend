import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

interface PaymentLinkData {
  title: string;
  description: string;
  amount: string;
  currency: string;
  blockchain: string;
  recipientAddress: string;
  expiresAt: string;
  remainingPayments: number;
  totalPayments: number;
  views: number;
}

export default function PublicPaymentLink() {
  const [paymentData] = useState<PaymentLinkData>({
    title: "Invoice #001",
    description: "Payment for consulting services rendered in January 2024",
    amount: "0.5",
    currency: "ETH",
    blockchain: "ethereum",
    recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f8f2b",
    expiresAt: "2024-02-15",
    remainingPayments: 5,
    totalPayments: 10,
    views: 234,
  });

  const [payerData, setPayerData] = useState({
    email: "",
    walletAddress: "",
  });

  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [isExpired] = useState(false);

  const handlePayerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayerData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    setPaymentStatus("processing");
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus("success");
    }, 2000);
  };

  const isPaymentAvailable = !isExpired && paymentData.remainingPayments > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Mustody</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Payment Card */}
          <Card className="p-8 mb-6">
            {/* Status Banner */}
            {isExpired && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Payment Link Expired</p>
                  <p className="text-sm text-red-700">This payment link is no longer active. Please contact the sender for a new link.</p>
                </div>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">Payment Received!</p>
                  <p className="text-sm text-green-700">Your payment has been successfully processed. Thank you!</p>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{paymentData.title}</h1>
              <p className="text-gray-600">{paymentData.description}</p>
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg mb-8 border border-blue-100">
              <p className="text-gray-600 text-sm font-medium mb-2">Amount Due</p>
              <p className="text-5xl font-bold text-gray-900">
                {paymentData.amount} <span className="text-2xl text-gray-600">{paymentData.currency}</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">On {paymentData.blockchain} network</p>
            </div>

            {/* Payment Info */}
            <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient Address</span>
                <span className="font-mono text-sm text-gray-900 break-all">{paymentData.recipientAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchain</span>
                <span className="font-semibold text-gray-900 capitalize">{paymentData.blockchain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires</span>
                <span className="font-semibold text-gray-900">{paymentData.expiresAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Slots</span>
                <span className="font-semibold text-gray-900">
                  {paymentData.remainingPayments} of {paymentData.totalPayments}
                </span>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                <span className="text-sm text-gray-600">
                  {paymentData.totalPayments - paymentData.remainingPayments} / {paymentData.totalPayments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${((paymentData.totalPayments - paymentData.remainingPayments) / paymentData.totalPayments) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Payment Form */}
          {paymentStatus !== "success" && (
            <Card className="p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>

              {isPaymentAvailable ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePayment();
                  }}
                  className="space-y-6"
                >
                  {/* Email */}
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={payerData.email}
                      onChange={handlePayerChange}
                      placeholder="your@email.com"
                      className="input"
                      required
                    />
                    <p className="form-hint">We'll send you a payment confirmation</p>
                  </div>

                  {/* Wallet Address */}
                  <div>
                    <label className="form-label">Your Wallet Address</label>
                    <input
                      type="text"
                      name="walletAddress"
                      value={payerData.walletAddress}
                      onChange={handlePayerChange}
                      placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f8f2b"
                      className="input font-mono text-sm"
                      required
                    />
                    <p className="form-hint">Your wallet will send the payment</p>
                  </div>

                  {/* Payment Method Info */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>How it works:</strong> After clicking "Pay Now", you'll be redirected to complete the payment using your {paymentData.currency} wallet.
                      The transaction will be recorded on the {paymentData.blockchain} blockchain.
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={paymentStatus === "processing"}
                    className="w-full py-3 text-lg"
                  >
                    {paymentStatus === "processing" ? "Processing Payment..." : `Pay ${paymentData.amount} ${paymentData.currency}`}
                  </Button>
                </form>
              ) : (
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-900 font-semibold mb-1">Payment Link Unavailable</p>
                  <p className="text-gray-600 text-sm">
                    {isExpired ? "This payment link has expired." : "All payment slots have been filled."}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{paymentData.views}</p>
            </Card>
            <Card className="p-6">
              <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {((paymentData.totalPayments - paymentData.remainingPayments) / paymentData.views * 100).toFixed(1)}%
              </p>
            </Card>
          </div>

          {/* Security Info */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              🔒 Powered by Mustody • Secure crypto payments • No middleman • Instant settlement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
