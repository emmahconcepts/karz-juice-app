import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PayablesModule() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    amountOwed: "",
    paymentDate: new Date().toISOString().split("T")[0],
    supplierType: "",
  });

  const { data: payables, isLoading, refetch } = trpc.payables.getPayables.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: summary } = trpc.payables.getPayablesSummary.useQuery();

  const createMutation = trpc.payables.createPayable.useMutation({
    onSuccess: () => {
      toast.success("Payable created successfully");
      setFormData({
        supplierName: "",
        amountOwed: "",
        paymentDate: new Date().toISOString().split("T")[0],
        supplierType: "",
      });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create payable");
    },
  });

  const deleteMutation = trpc.payables.deletePayable.useMutation({
    onSuccess: () => {
      toast.success("Payable deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete payable");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierName || !formData.amountOwed) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({
      supplierName: formData.supplierName,
      amountOwed: parseFloat(formData.amountOwed),
      paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
      supplierType: formData.supplierType || undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-secondary/20 text-secondary";
      case "partial":
        return "bg-accent/20 text-accent";
      case "pending":
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
          <h1 className="text-3xl font-bold">Accounts Payable</h1>
          <p className="text-muted mt-1">Track money owed to suppliers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Payable
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">UGX {summary?.totalOwed.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{summary?.pending || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{summary?.partial || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-secondary">{summary?.paid || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount Owed *</label>
                  <input
                    type="number"
                    value={formData.amountOwed}
                    onChange={(e) => setFormData({ ...formData, amountOwed: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier Type</label>
                  <select
                    value={formData.supplierType}
                    onChange={(e) => setFormData({ ...formData, supplierType: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">Select type</option>
                    <option value="Fruit Supplier">Fruit Supplier</option>
                    <option value="Machine Owner">Machine Owner</option>
                    <option value="Vehicle Hire Provider">Vehicle Hire Provider</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Payment Date</label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Payable"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payables List */}
      <Card>
        <CardHeader>
          <CardTitle>Payables</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading...</p>
          ) : payables && payables.length > 0 ? (
            <div className="space-y-3">
              {payables.map((ap: any) => (
                <div key={ap.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{ap.supplierName}</h4>
                      <p className="text-sm text-muted">{ap.supplierType || "General Supplier"}</p>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(ap.status)}`}>
                      {ap.status.charAt(0).toUpperCase() + ap.status.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted">Amount Owed</p>
                      <p className="font-semibold">UGX {parseFloat(ap.amountOwed).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted">Payment Date</p>
                      <p className="font-semibold">{ap.paymentDate ? new Date(ap.paymentDate).toDateString() : "Not set"}</p>
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
                        onClick={() => deleteMutation.mutate({ id: ap.id })}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No payables yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
