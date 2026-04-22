import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function OCRModule() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [ocrResult, setOCRResult] = useState<any>(null);

  const [confirmForm, setConfirmForm] = useState({
    vendor: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "general" as "general" | "machine_hire" | "vehicle_hire" | "utilities" | "ingredients",
    description: "",
  });

  // Queries
  const { data: scannedReceipts, isLoading, refetch } = trpc.ocr.getScannedReceipts.useQuery({
    limit: 50,
    offset: 0,
  });

  // Mutations
  const scanReceiptMutation = trpc.ocr.uploadReceipt.useMutation({
    onSuccess: (result: any) => {
      setOCRResult(result);
      setConfirmForm({
        vendor: result.vendor || "",
        amount: result.amount || "",
        date: result.date || new Date().toISOString().split("T")[0],
        category: "general",
        description: result.description || "",
      });
      setShowConfirmForm(true);
      toast.success("Receipt scanned successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to scan receipt");
    },
  });

  const confirmOCRMutation = trpc.ocr.confirmReceipt.useMutation({
    onSuccess: () => {
      toast.success("Receipt data confirmed and recorded");
      setSelectedFile(null);
      setOCRResult(null);
      setShowConfirmForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to confirm receipt");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);

    // Upload receipt file
    scanReceiptMutation.mutate({
      fileName: file.name,
      fileUrl: `file://${file.name}`,
      fileType: file.type as "image/jpeg" | "image/png" | "application/pdf",
    });
  };

  const handleConfirmOCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmForm.amount) {
      toast.error("Amount is required");
      return;
    }

    confirmOCRMutation.mutate({
      receiptId: ocrResult.id,
      vendor: confirmForm.vendor,
      amount: parseFloat(confirmForm.amount),
      date: new Date(confirmForm.date),
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "bg-secondary/20 text-secondary";
    if (confidence >= 0.7) return "bg-accent/20 text-accent";
    return "bg-destructive/20 text-destructive";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Receipt OCR</h1>
          <p className="text-muted">Scan receipts and invoices with AI-powered OCR</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-muted mb-4" />
            <p className="text-lg font-semibold mb-2">Upload Receipt Image</p>
            <p className="text-sm text-muted mb-6">PNG, JPG, or PDF (max 16MB)</p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button className="btn-primary gap-2">
                <Upload className="w-4 h-4" />
                Select File
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Scanned Receipts List */}
      <Card>
        <CardHeader>
          <CardTitle>Scanned Receipts</CardTitle>
          <CardDescription>Recently scanned and confirmed receipts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading receipts...</p>
          ) : scannedReceipts && scannedReceipts.length > 0 ? (
            <div className="space-y-4">
              {scannedReceipts.map((receipt) => (
                <div key={receipt.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{receipt.vendor}</h4>
                      <p className="text-sm text-muted">{new Date(receipt.uploadedDate).toDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">UGX {parseFloat(receipt.amount.toString()).toLocaleString()}</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${
                        receipt.status === "confirmed" ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"
                      }`}>
                        {receipt.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* OCR Confidence Scores */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-muted/10 rounded">
                      <p className="text-muted">Vendor</p>
                      <p className={`font-semibold ${getConfidenceColor(receipt.confidence.vendor)}`}>
                        {(receipt.confidence.vendor * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-2 bg-muted/10 rounded">
                      <p className="text-muted">Amount</p>
                      <p className={`font-semibold ${getConfidenceColor(receipt.confidence.amount)}`}>
                        {(receipt.confidence.amount * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-2 bg-muted/10 rounded">
                      <p className="text-muted">Date</p>
                      <p className={`font-semibold ${getConfidenceColor(receipt.confidence.date)}`}>
                        {(receipt.confidence.date * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No receipts scanned yet</p>
          )}
        </CardContent>
      </Card>

      {/* OCR Confirmation Modal */}
      {showConfirmForm && ocrResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background">
              <CardTitle>Confirm OCR Data</CardTitle>
              <button onClick={() => setShowConfirmForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmOCR} className="space-y-6">
                {/* OCR Confidence Indicators */}
                <div className="bg-muted/10 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">OCR Confidence Scores</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      {ocrResult.vendorConfidence >= 0.8 ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-accent" />
                      )}
                      <div>
                        <p className="text-xs text-muted">Vendor</p>
                        <p className="font-semibold text-sm">{(ocrResult.vendorConfidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ocrResult.amountConfidence >= 0.8 ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-accent" />
                      )}
                      <div>
                        <p className="text-xs text-muted">Amount</p>
                        <p className="font-semibold text-sm">{(ocrResult.amountConfidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {ocrResult.dateConfidence >= 0.8 ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-accent" />
                      )}
                      <div>
                        <p className="text-xs text-muted">Date</p>
                        <p className="font-semibold text-sm">{(ocrResult.dateConfidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Vendor *</label>
                    <input
                      type="text"
                      value={confirmForm.vendor}
                      onChange={(e) => setConfirmForm({ ...confirmForm, vendor: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Amount (UGX) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={confirmForm.amount}
                      onChange={(e) => setConfirmForm({ ...confirmForm, amount: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Date *</label>
                    <input
                      type="date"
                      value={confirmForm.date}
                      onChange={(e) => setConfirmForm({ ...confirmForm, date: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Category *</label>
                    <select
                      value={confirmForm.category}
                      onChange={(e) => setConfirmForm({ ...confirmForm, category: e.target.value as any })}
                      className="input-field w-full"
                    >
                      <option value="general">General</option>
                      <option value="machine_hire">Machine Hire</option>
                      <option value="vehicle_hire">Vehicle Hire</option>
                      <option value="utilities">Utilities</option>
                      <option value="ingredients">Ingredients</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <textarea
                    value={confirmForm.description}
                    onChange={(e) => setConfirmForm({ ...confirmForm, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={confirmOCRMutation.isPending}>
                    {confirmOCRMutation.isPending ? "Confirming..." : "Confirm & Record"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowConfirmForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
