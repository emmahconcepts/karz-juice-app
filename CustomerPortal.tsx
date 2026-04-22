/**
 * Customer Portal
 * Public-facing page for customers to view receipts and download invoices
 * Accessed via QR code scan from receipt
 */

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Download, Share2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function CustomerPortal() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL path (/receipt/TOKEN)
    const pathMatch = window.location.pathname.match(/\/receipt\/([^/]+)/);
    if (pathMatch && pathMatch[1]) {
      setToken(pathMatch[1]);
    } else {
      // Also check query params
      const urlParams = new URLSearchParams(window.location.search);
      const qrToken = urlParams.get("token");
      if (qrToken) {
        setToken(qrToken);
      }
    }
  }, []);

  const { data, isLoading, error } = trpc.receipts.getReceiptByQRToken.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const downloadInvoiceMutation = trpc.receipts.downloadInvoicePDF.useMutation();

  const handleDownloadInvoice = async () => {
    if (!token) return;
    try {
      downloadInvoiceMutation.mutate(
        { token },
        {
          onSuccess: (result) => {
            // Decode base64 and create blob
            const binaryString = atob(result.pdf);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: "application/pdf" });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = result.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          },
          onError: (error) => {
            alert(`Failed to download invoice: ${error.message}`);
          },
        }
      );
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleShare = async () => {
    if (!data?.receipt) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${data.receipt.receiptNumber}`,
          text: `View my receipt from Karz Juice`,
          url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Receipt Found</h1>
          <p className="text-gray-600 mb-4">
            Please scan a QR code from your Karz Juice receipt to view details.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading receipt details...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipt Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error?.message || "This receipt is no longer available or the link has expired."}
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const receipt = data.receipt;
  const receiptDate = new Date(receipt.receiptDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Receipt Card */}
        <Card className="overflow-hidden shadow-lg mb-6">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 text-center">
            <h1 className="text-3xl font-bold mb-1">Karz Juice</h1>
            <p className="text-orange-100">Receipt</p>
          </div>

          {/* Receipt Content */}
          <div className="p-6">
            {/* Receipt Number and Date */}
            <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">Receipt Number</p>
                <p className="text-2xl font-bold text-gray-900">{receipt.receiptNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {receiptDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Customer</p>
              <p className="text-lg font-semibold text-gray-900">{receipt.clientName}</p>
              {receipt.eventReference && (
                <p className="text-sm text-gray-600 mt-1">
                  Event: {receipt.eventReference}
                </p>
              )}
            </div>

            {/* Amount Section */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Amount Paid</p>
              <p className="text-4xl font-bold text-orange-600">
                {formatCurrency(Number(receipt.amountPaid))}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Payment Method: <span className="font-semibold capitalize">{receipt.paymentMethod.replace(/_/g, " ")}</span>
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Receipt Verified</span>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Issued By</p>
                <p className="text-sm font-medium text-gray-900">Karz Juice Staff</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Receipt ID</p>
                <p className="text-sm font-medium text-gray-900">{receipt.id}</p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-600 mb-6">
              <p>Thank you for your purchase!</p>
              <p className="text-xs text-gray-500 mt-1">
                Issued on {receiptDate.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <Button
            onClick={handleDownloadInvoice}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            size="lg"
          >
            Print
          </Button>
        </div>

        {/* Help Section */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Need help?</span> Contact Karz Juice support if you have any questions about this receipt.
          </p>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
