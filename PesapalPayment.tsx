import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CreditCard, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function PesapalPayment() {
  const [paymentType, setPaymentType] = useState<"sale" | "receivable">("sale");
  const [formData, setFormData] = useState({
    id: "",
    amount: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const { data: pesapalEnabled } = trpc.pesapal.isEnabled.useQuery();

  const initiateSalePayment = trpc.pesapal.initiateSalePayment.useMutation({
    onSuccess: (data) => {
      toast.success("Payment initiated - redirecting to PesaPal");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate payment");
      setPaymentStatus("error");
      setLoading(false);
    },
  });

  const initiateReceivablePayment = trpc.pesapal.initiateReceivablePayment.useMutation({
    onSuccess: (data) => {
      toast.success("Payment initiated - redirecting to PesaPal");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to initiate payment");
      setPaymentStatus("error");
      setLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id || !formData.amount || !formData.customerName || !formData.customerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setPaymentStatus("processing");

    const baseUrl = window.location.origin;
    const callbackUrl = `${baseUrl}/api/pesapal/callback`;
    const redirectUrl = `${baseUrl}/`;

    try {
      if (paymentType === "sale") {
        await initiateSalePayment.mutateAsync({
          saleId: parseInt(formData.id),
          amount: parseFloat(formData.amount),
          currency: "UGX",
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          callbackUrl,
          redirectUrl,
        });
      } else {
        await initiateReceivablePayment.mutateAsync({
          receivableId: parseInt(formData.id),
          amount: parseFloat(formData.amount),
          currency: "UGX",
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          callbackUrl,
          redirectUrl,
        });
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
    }
  };

  if (!pesapalEnabled?.enabled) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-lg font-semibold text-orange-900">PesaPal Not Configured</h2>
            </div>
            <p className="text-orange-800">
              The PesaPal payment gateway is not yet configured. Please contact your administrator to set up payment processing.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Online Payment</h1>
          <p className="text-muted-foreground">Process payments via PesaPal - Card, Mobile Money, Bank Transfer</p>
        </div>

        <Card className="p-6">
          {/* Payment Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">Payment Type</label>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentType("sale")}
                className={`flex-1 py-2 px-4 rounded border-2 transition-colors ${
                  paymentType === "sale"
                    ? "border-orange-500 bg-orange-50 text-orange-900"
                    : "border-border bg-background text-foreground hover:border-orange-300"
                }`}
              >
                Sale Payment
              </button>
              <button
                onClick={() => setPaymentType("receivable")}
                className={`flex-1 py-2 px-4 rounded border-2 transition-colors ${
                  paymentType === "receivable"
                    ? "border-orange-500 bg-orange-50 text-orange-900"
                    : "border-border bg-background text-foreground hover:border-orange-300"
                }`}
              >
                Invoice Payment
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {paymentType === "sale" ? "Sale ID" : "Invoice ID"} *
              </label>
              <Input
                type="number"
                placeholder={paymentType === "sale" ? "Enter Sale ID" : "Enter Invoice ID"}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Amount (UGX) *</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Customer Name *</label>
              <Input
                type="text"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Customer Email *</label>
              <Input
                type="email"
                placeholder="Enter customer email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Customer Phone</label>
              <Input
                type="tel"
                placeholder="Enter customer phone (optional)"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </div>

            {/* Payment Methods Info */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Accepted Payment Methods</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Visa & Mastercard</li>
                <li>✓ Mobile Money (MTN, Airtel, Vodafone)</li>
                <li>✓ Bank Transfer</li>
                <li>✓ E-wallets</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || paymentStatus === "processing"}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-6"
            >
              {loading || paymentStatus === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </form>

          {/* Status Messages */}
          {paymentStatus === "success" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">Payment processed successfully</span>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Payment processing failed. Please try again.</span>
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="mt-6 p-6 bg-muted">
          <h3 className="font-semibold text-foreground mb-3">About PesaPal</h3>
          <p className="text-sm text-muted-foreground mb-3">
            PesaPal is a secure online payment platform that allows you to accept payments from customers worldwide using various payment methods.
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Secure:</strong> All transactions are encrypted and PCI-DSS compliant</li>
            <li>• <strong>Fast:</strong> Instant payment processing and settlement</li>
            <li>• <strong>Reliable:</strong> 99.9% uptime guarantee</li>
            <li>• <strong>Support:</strong> 24/7 customer support available</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
