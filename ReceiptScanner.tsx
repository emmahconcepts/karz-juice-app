/**
 * Receipt Scanner Landing Page
 * Entry point for customers to scan QR codes from receipts
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRScanner } from "@/components/QRScanner";
import { QrCode, ArrowRight } from "lucide-react";

export function ReceiptScanner() {
  const [showScanner, setShowScanner] = useState(false);
  const [, setLocation] = useLocation();

  const handleScan = (token: string) => {
    // Navigate to receipt details page
    setLocation(`/receipt/${token}`);
  };

  if (showScanner) {
    return (
      <QRScanner
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Karz Juice Receipt Portal
          </h1>
          <p className="text-lg text-gray-600">
            Scan the QR code on your receipt to view details and download invoices
          </p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden shadow-lg mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 text-center">
            <QrCode className="w-20 h-20 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl font-bold mb-2">Scan Receipt QR Code</h2>
            <p className="text-orange-100 mb-6">
              Use your phone camera to scan the QR code printed on your receipt
            </p>
            <Button
              onClick={() => setShowScanner(true)}
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Start Scanning
            </Button>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What you can do:
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Receipt Details</p>
                  <p className="text-sm text-gray-600">
                    See your receipt number, date, amount, and payment method
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Download Invoice</p>
                  <p className="text-sm text-gray-600">
                    Get a PDF copy of your receipt for your records
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Share Receipt</p>
                  <p className="text-sm text-gray-600">
                    Easily share receipt details with others
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-green-600 font-bold text-sm">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">No Login Required</p>
                  <p className="text-sm text-gray-600">
                    Access your receipt instantly with just a QR code scan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* How it works */}
        <Card className="p-8 bg-blue-50 border-blue-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How it works:
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Get your receipt</p>
                <p className="text-sm text-gray-600">
                  Look for the QR code on your Karz Juice receipt
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Click &quot;Start Scanning&quot;</p>
                <p className="text-sm text-gray-600">
                  Allow camera access when prompted
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Point at QR code</p>
                <p className="text-sm text-gray-600">
                  Position the QR code within the scanning frame
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">View your receipt</p>
                <p className="text-sm text-gray-600">
                  See all details and download your invoice
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Alternative: Manual entry */}
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">
            Don&apos;t have a QR code? You can still scan using the button above.
          </p>
          <Button
            onClick={() => setShowScanner(true)}
            variant="outline"
            size="lg"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan QR Code
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
