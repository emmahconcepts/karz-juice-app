import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit2, Trash2, RefreshCw, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const CLASSIFICATIONS = [
  { value: "revenue", label: "Revenue", color: "bg-secondary/20 text-secondary" },
  { value: "expense", label: "Expense", color: "bg-destructive/20 text-destructive" },
  { value: "asset", label: "Asset", color: "bg-accent/20 text-accent" },
  { value: "liability", label: "Liability", color: "bg-amber-500/20 text-amber-500" },
  { value: "equity", label: "Equity", color: "bg-cyan-500/20 text-cyan-500" },
];

export default function CustomAccountsModule() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedClassification, setSelectedClassification] = useState<"revenue" | "expense" | "asset" | "liability" | "equity">("expense");
  const [formData, setFormData] = useState({
    accountName: "",
    accountCode: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: accounts, isLoading, refetch } = trpc.customAccounts.getCustomAccounts.useQuery({
    limit: 100,
    offset: 0,
  });

  const { data: summary } = trpc.customAccounts.getAccountSummaryByClassification.useQuery();
  const { data: suggestedCode } = trpc.customAccounts.generateAccountCode.useQuery({
    classification: selectedClassification,
  });

  const createMutation = trpc.customAccounts.createCustomAccount.useMutation({
    onSuccess: () => {
      toast.success("Custom account created successfully");
      setFormData({ accountName: "", accountCode: "", description: "" });
      setShowForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const updateMutation = trpc.customAccounts.updateCustomAccount.useMutation({
    onSuccess: () => {
      toast.success("Account updated successfully");
      setEditingId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update account");
    },
  });

  const deleteMutation = trpc.customAccounts.deleteCustomAccount.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  // Auto-fill account code when classification changes
  useEffect(() => {
    if (suggestedCode && !formData.accountCode) {
      setFormData((prev) => ({ ...prev, accountCode: suggestedCode }));
    }
  }, [suggestedCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountName || !formData.accountCode) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if user is admin or finance
    if (user?.role !== "admin" && user?.role !== "finance") {
      toast.error("Only admin and finance users can create custom accounts");
      return;
    }

    createMutation.mutate({
      accountName: formData.accountName,
      accountCode: formData.accountCode,
      classification: selectedClassification,
      description: formData.description || undefined,
    });
  };

  const getClassificationColor = (classification: string) => {
    const found = CLASSIFICATIONS.find((c) => c.value === classification);
    return found?.color || "bg-muted/20 text-muted";
  };

  const getClassificationLabel = (classification: string) => {
    const found = CLASSIFICATIONS.find((c) => c.value === classification);
    return found?.label || classification;
  };

  const filteredAccounts = accounts?.filter((acc: any) => acc.classification === selectedClassification) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Accounts</h1>
          <p className="text-muted mt-1">Create and manage custom accounts by classification</p>
        </div>
        {(user?.role === "admin" || user?.role === "finance") && (
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Account
          </Button>
        )}
      </div>

      {/* Summary by Classification */}
      <div className="grid grid-cols-5 gap-3">
        {CLASSIFICATIONS.map((classification) => (
          <Card key={classification.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{classification.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary?.[classification.value]?.count || 0}</p>
              <p className="text-xs text-muted mt-1">
                UGX {(summary?.[classification.value]?.totalBalance || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (user?.role === "admin" || user?.role === "finance") && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Custom Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Classification Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Account Classification *</label>
                <div className="grid grid-cols-5 gap-2">
                  {CLASSIFICATIONS.map((classification) => (
                    <button
                      key={classification.value}
                      type="button"
                      onClick={() => setSelectedClassification(classification.value as any)}
                      className={`p-2 rounded-md border-2 transition-all ${
                        selectedClassification === classification.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="text-xs font-semibold">{classification.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Account Name *</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="e.g., Advertising Expense"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Account Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.accountCode}
                      onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
                      placeholder="e.g., EXP-001"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, accountCode: suggestedCode || "" })}
                      className="gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Classification Tabs */}
      <div className="flex gap-2 border-b border-border">
        {CLASSIFICATIONS.map((classification) => (
          <button
            key={classification.value}
            onClick={() => setSelectedClassification(classification.value as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedClassification === classification.value
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {classification.label}
          </button>
        ))}
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>{getClassificationLabel(selectedClassification)} Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading...</p>
          ) : filteredAccounts.length > 0 ? (
            <div className="space-y-3">
              {filteredAccounts.map((account: any) => (
                <div key={account.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{account.accountName}</h4>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getClassificationColor(account.classification)}`}>
                          {account.accountCode}
                        </span>
                      </div>
                      {account.description && <p className="text-sm text-muted">{account.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted">Balance</p>
                      <p className="text-lg font-semibold">UGX {parseFloat(account.balance).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>Status:</span>
                      {account.isActive ? (
                        <span className="flex items-center gap-1 text-secondary">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive">
                          <X className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    {(user?.role === "admin" || user?.role === "finance") && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            updateMutation.mutate({
                              id: account.id,
                              isActive: !account.isActive,
                            });
                          }}
                        >
                          {account.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-destructive"
                          onClick={() => deleteMutation.mutate({ id: account.id })}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No {getClassificationLabel(selectedClassification).toLowerCase()} accounts yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
