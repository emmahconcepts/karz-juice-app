import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function OCREntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OCR Module</h1>
          <p className="text-muted-foreground mt-2">Scan and extract data from receipts and invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Camera className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Scan Receipt</h3>
              <p className="text-sm text-muted-foreground">Capture receipt image</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Verified</h3>
              <p className="text-sm text-muted-foreground">Confirmed scans</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Review</h3>
              <p className="text-sm text-muted-foreground">Needs review</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">History</h3>
              <p className="text-sm text-muted-foreground">Scanned receipts</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Camera className="w-4 h-4 mr-2" />
            Scan Receipt
          </Button>
          <Button variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Verified
          </Button>
          <Button variant="outline">
            <AlertCircle className="w-4 h-4 mr-2" />
            Review
          </Button>
        </div>
      </Card>
    </div>
  );
}
