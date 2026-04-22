import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ReceivablesModule() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    invoiceAmount: "",
    amountPaid: "",
    dueDate: new Date().toISOString().split("T")[0],
    eventReference: "",
  });

  const { data: receivables, isLoading, refetch } = trpc.receivables.getReceivables.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: summary } = trpc.receivables.getReceivablesSummary.useQuery();

  const createMutation = trpc.receivables.createReceivable.useMutation({
    onSuccess: () => {
      toast.success("Receivable created successfully");
      setFormData({
        clientName: "",
        invoiceAmount: "",
        amountPaid: "",
        dueDate: new Date().toISOString().split("T")[0],
        eventReference: "",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create receivable");
    },
  });

  const deleteMutation = trpc.receivables.deleteReceivable.useMutation({
    onSuccess: () => {
      toast.success("Receivable deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete receivable");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.invoiceAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      clientName: formData.clientName,
      invoiceAmount: parseFloat(formData.invoiceAmount),
      amountPaid: parseFloat(formData.amountPaid) || 0,
      dueDate: new Date(formData.dueDate),
      eventReference: formData.eventReference || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-secondary/20 text-secondary";
      case "partial":
        return "bg-accent/20 text-accent";
      case "overdue":
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
          <h1 className="text-3xl font-bold">Accounts Receivable</h1>
          <p className="text-muted mt-1">Track money owed by clients</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Receivable
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">UGX {summary?.totalInvoiced.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">UGX {summary?.totalPaid.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">UGX {summary?.totalOutstanding.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{summary?.overdue || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Receivable</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Client Name *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Amount *</label>
                  <input
                    type="number"
                    value={formData.invoiceAmount}
                    onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount Paid</label>
                  <input
                    type="number"
                    value={formData.amountPaid}
                    onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Event Reference</label>
                <input
                  type="text"
                  value={formData.eventReference}
                  onChange={(e) => setFormData({ ...formData, eventReference: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="Event reference (optional)"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Receivable"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Receivables List */}
      <Card>
        <CardHeader>
          <CardTitle>Receivables</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading...</p>
          ) : receivables && receivables.length > 0 ? (
            <div className="space-y-3">
              {receivables.map((ar: any) => (
                <div key={ar.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{ar.clientName}</h4>
                      <p className="text-sm text-muted">{ar.eventReference || "No event reference"}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ar.status)}`}>
                      {ar.status.charAt(0).toUpperCase() + ar.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted">Invoice Amount</p>
                      <p className="font-semibold">UGX {parseFloat(ar.invoiceAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted">Amount Paid</p>
                      <p className="font-semibold text-secondary">UGX {parseFloat(ar.amountPaid).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted">Balance</p>
                      <p className="font-semibold text-accent">UGX {parseFloat(ar.balanceRemaining).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted">Due Date</p>
                      <p className="font-semibold">{new Date(ar.dueDate).toDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 text-destructive"
                      onClick={() => deleteMutation.mutate({ id: ar.id })}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No receivables yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
