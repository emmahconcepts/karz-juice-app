import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Package, ToggleLeft, ToggleRight, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const PACKAGE_TYPES = ["Birthday Package", "Wedding Package", "Women Care Package", "Kids Party Package", "Corporate Package", "Custom"];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-secondary/20 text-secondary",
  inactive: "bg-muted text-muted-foreground",
};

function formatUGX(amount: string | number) {
  return `UGX ${Number(amount).toLocaleString()}`;
}

export default function PackagesModule() {
  const { user } = useAuth();
  const isAdminOrFinance = user?.role === "admin" || user?.role === "finance";

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState("");
  const [formData, setFormData] = useState({
    packageName: "",
    description: "",
    price: "",
    includedItems: [] as string[],
    status: "active" as "active" | "inactive",
  });

  const { data: packages, isLoading, refetch } = trpc.packages?.getPackages?.useQuery?.() ?? { data: [], isLoading: false, refetch: () => {} };

  const createMutation = trpc.packages?.createPackage?.useMutation?.({
    onSuccess: () => { toast.success("Package created"); resetForm(); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to create package"),
  });

  const updateMutation = trpc.packages?.updatePackage?.useMutation?.({
    onSuccess: () => { toast.success("Package updated"); resetForm(); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update package"),
  });

  const deleteMutation = trpc.packages?.deletePackage?.useMutation?.({
    onSuccess: () => { toast.success("Package deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to delete package"),
  });

  const toggleMutation = trpc.packages?.togglePackageStatus?.useMutation?.({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message || "Failed to update status"),
  });

  function resetForm() {
    setFormData({ packageName: "", description: "", price: "", includedItems: [], status: "active" });
    setNewItem("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(pkg: any) {
    setFormData({
      packageName: pkg.packageName,
      description: pkg.description || "",
      price: pkg.price.toString(),
      includedItems: pkg.includedItems || [],
      status: pkg.status,
    });
    setEditingId(pkg.id);
    setShowForm(true);
  }

  function addItem() {
    if (!newItem.trim()) return;
    setFormData(f => ({ ...f, includedItems: [...f.includedItems, newItem.trim()] }));
    setNewItem("");
  }

  function removeItem(i: number) {
    setFormData(f => ({ ...f, includedItems: f.includedItems.filter((_, idx) => idx !== i) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.packageName || !formData.price) {
      toast.error("Package name and price are required");
      return;
    }
    const payload = {
      packageName: formData.packageName,
      description: formData.description,
      price: formData.price,
      includedItems: formData.includedItems,
      status: formData.status,
    };
    if (editingId) {
      updateMutation?.mutate?.({ id: editingId, ...payload });
    } else {
      createMutation?.mutate?.(payload);
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Package size={22} className="text-primary" /> Packages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage special juice bundles and event packages</p>
        </div>
        {isAdminOrFinance && (
          <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
            <Plus size={14} className="mr-1" /> Add Package
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total packages", value: packages?.length ?? 0 },
          { label: "Active", value: packages?.filter((p: any) => p.status === "active").length ?? 0 },
          { label: "Inactive", value: packages?.filter((p: any) => p.status === "inactive").length ?? 0 },
          {
            label: "Avg price",
            value: packages?.length
              ? formatUGX(Math.round(packages.reduce((s: number, p: any) => s + Number(p.price), 0) / packages.length))
              : "—",
          },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-semibold mt-0.5">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{editingId ? "Edit Package" : "New Package"}</CardTitle>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Package name *</label>
                  <select
                    value={formData.packageName}
                    onChange={e => setFormData(f => ({ ...f, packageName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                  >
                    <option value="">Select or type below</option>
                    {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="text"
                    value={formData.packageName}
                    onChange={e => setFormData(f => ({ ...f, packageName: e.target.value }))}
                    placeholder="Or enter custom name"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm mt-1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Price (UGX) *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what this package includes and who it's for"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-none"
                />
              </div>

              {/* Included Items */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Included items</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                    placeholder="e.g. 20 Mango Juice Bottles"
                    className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus size={14} />
                  </Button>
                </div>
                {formData.includedItems.length > 0 && (
                  <ul className="space-y-1">
                    {formData.includedItems.map((item, i) => (
                      <li key={i} className="flex items-center justify-between text-sm bg-muted/40 px-3 py-1.5 rounded-md">
                        <span>• {item}</span>
                        <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Status</label>
                <button
                  type="button"
                  onClick={() => setFormData(f => ({ ...f, status: f.status === "active" ? "inactive" : "active" }))}
                  className="flex items-center gap-1.5 text-sm"
                >
                  {formData.status === "active"
                    ? <><ToggleRight size={18} className="text-secondary" /> <span className="text-secondary">Active</span></>
                    : <><ToggleLeft size={18} className="text-muted-foreground" /> <span className="text-muted-foreground">Inactive</span></>}
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={createMutation?.isPending || updateMutation?.isPending}>
                  {(createMutation?.isPending || updateMutation?.isPending) && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                  {editingId ? "Save changes" : "Create package"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Packages Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : !packages?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No packages yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Package</th>
                    <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
                    <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Price</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Items</th>
                    <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                    {isAdminOrFinance && <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {packages.map((pkg: any) => (
                    <tr key={pkg.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{pkg.packageName}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{pkg.description || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm">{formatUGX(pkg.price)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-muted/40 px-2 py-0.5 rounded-full text-xs">
                          {pkg.includedItems?.length ?? 0} items
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[pkg.status]}`}>
                          {pkg.status}
                        </span>
                      </td>
                      {isAdminOrFinance && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => toggleMutation?.mutate?.({ id: pkg.id, status: pkg.status === "active" ? "inactive" : "active" })}
                              title={pkg.status === "active" ? "Deactivate" : "Activate"}
                            >
                              {pkg.status === "active" ? <ToggleRight size={14} className="text-secondary" /> : <ToggleLeft size={14} />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(pkg)}>
                              <Edit2 size={13} />
                            </Button>
                            <Button
                              variant="ghost" size="sm"
                              onClick={() => {
                                if (confirm(`Delete "${pkg.packageName}"?`)) deleteMutation?.mutate?.({ id: pkg.id });
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
