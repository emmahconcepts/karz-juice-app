import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function StatementsModule() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showReconcileForm, setShowReconcileForm] = useState(false);
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);

  const [reconcileForm, setReconcileForm] = useState({
    reconciliationDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Queries
  const { data: statements, isLoading, refetch } = trpc.statements.getStatements.useQuery({
    limit: 50,
    offset: 0,
  });

  // Mutations
  const uploadStatementMutation = trpc.statements.uploadStatement.useMutation({
    onSuccess: () => {
      toast.success("Statement uploaded successfully");
      setSelectedFile(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload statement");
    },
  });

  const reconcileMutation = trpc.statements.reconcileStatement.useMutation({
    onSuccess: () => {
      toast.success("Statement reconciled successfully");
      setShowReconcileForm(false);
      setSelectedStatementId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reconcile statement");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("csv") && !file.type.includes("pdf") && !file.type.includes("spreadsheet")) {
      toast.error("Please select a CSV, PDF, or Excel file");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      uploadStatementMutation.mutate({
        fileName: file.name,
        fileUrl: `file://${file.name}`,
        fileType: file.type,
        accountId: 1,
        statementDate: new Date(),
      });
    };
    reader.readAsText(file);
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatementId) {
      toast.error("Please select a statement");
      return;
    }

    reconcileMutation.mutate({
      statementId: selectedStatementId,
      matchedTransactionIds: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reconciled":
        return "bg-secondary/20 text-secondary";
      case "pending":
        return "bg-accent/20 text-accent";
      case "discrepancy":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted/20 text-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bank Statements</h1>
          <p className="text-muted">Upload and reconcile bank statements</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-muted mb-4" />
            <p className="text-lg font-semibold mb-2">Upload Bank Statement</p>
            <p className="text-sm text-muted mb-6">CSV, PDF, or Excel format</p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.pdf,.xlsx,.xls"
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

      {/* Statements List */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Records</CardTitle>
          <CardDescription>Uploaded bank statements and reconciliation status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading statements...</p>
          ) : statements && statements.length > 0 ? (
            <div className="space-y-4">
              {statements.map((statement: any) => (
                <div key={statement.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{statement.fileName}</h4>
                      <p className="text-sm text-muted">
                        Uploaded: {new Date(statement.uploadDate).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(statement.status)}`}>
                        {statement.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Statement Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-muted/10 rounded">
                    <div>
                      <p className="text-xs text-muted">Opening Balance</p>
                      <p className="font-semibold">UGX {parseFloat(statement.openingBalance?.toString() || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Closing Balance</p>
                      <p className="font-semibold">UGX {parseFloat(statement.closingBalance?.toString() || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Transactions</p>
                      <p className="font-semibold">{statement.transactionCount || 0}</p>
                    </div>
                  </div>

                  {/* Reconciliation Status */}
                  {statement.status === "reconciled" && (
                    <div className="flex items-center gap-2 text-sm text-secondary mb-3">
                      <CheckCircle className="w-4 h-4" />
                      <span>Reconciled on {new Date(statement.reconciliationDate).toDateString()}</span>
                    </div>
                  )}

                  {statement.status === "discrepancy" && (
                    <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                      <AlertCircle className="w-4 h-4" />
                      <span>Discrepancy detected: UGX {parseFloat(statement.discrepancyAmount?.toString() || "0").toLocaleString()}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {statement.status !== "reconciled" && (
                    <Button
                      size="sm"
                      className="btn-secondary gap-2"
                      onClick={() => {
                        setSelectedStatementId(statement.id);
                        setShowReconcileForm(true);
                      }}
                    >
                      Reconcile
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No statements uploaded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Reconciliation Modal */}
      {showReconcileForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reconcile Statement</CardTitle>
              <button onClick={() => setShowReconcileForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReconcile} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Reconciliation Date *</label>
                  <input
                    type="date"
                    value={reconcileForm.reconciliationDate}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, reconciliationDate: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Notes</label>
                  <textarea
                    placeholder="Any discrepancies or notes..."
                    value={reconcileForm.notes}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, notes: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={reconcileMutation.isPending}>
                    {reconcileMutation.isPending ? "Reconciling..." : "Reconcile"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowReconcileForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reconciliation Information */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Bank Reconciliation Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>✓ Upload monthly bank statements in CSV, PDF, or Excel format</p>
          <p>✓ System automatically matches transactions with ledger entries</p>
          <p>✓ Identify and resolve discrepancies</p>
          <p>✓ Maintain accurate cash account balances</p>
        </CardContent>
      </Card>
    </div>
  );
}
