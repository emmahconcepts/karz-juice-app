import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, TrendingDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

function fmtUGX(n: number | string) {
  return `UGX ${Number(n).toLocaleString()}`;
}

export default function DrawingsAccountModule() {
  const { user } = useAuth();
  const isAdminOrFinance = user?.role === "admin" || user?.role === "finance";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ withdrawalAmount: "", withdrawalDate: new Date().toISOString().split("T")[0], description: "" });

  const { data: drawings, isLoading, refetch } = trpc.drawings?.getDrawings?.useQuery?.() ?? { data: [], isLoading: false, refetch: () => {} };

  const createMutation = trpc.drawings?.createDrawing?.useMutation?.({
    onSuccess: () => {
      toast.success("Withdrawal recorded");
      setForm({ withdrawalAmount: "", withdrawalDate: new Date().toISOString().split("T")[0], description: "" });
      setShowForm(false);
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to record withdrawal"),
  });

  const total = (drawings ?? []).reduce((s: number, d: any) => s + Number(d.withdrawalAmount), 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.withdrawalAmount || Number(form.withdrawalAmount) <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }
    createMutation?.mutate?.({
      withdrawalAmount: form.withdrawalAmount,
      withdrawalDate: new Date(form.withdrawalDate),
      description: form.description || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingDown size={22} className="text-primary" /> Drawings Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track owner withdrawals — classified as Equity</p>
        </div>
        {isAdminOrFinance && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={14} className="mr-1" /> Record Withdrawal
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">Total Drawings (All Time)</p>
            <p className="text-2xl font-bold text-destructive mt-1">{fmtUGX(total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Account type: Equity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-destructive mt-1">
              {fmtUGX((drawings ?? []).filter((d: any) => {
                const m = new Date(d.withdrawalDate).getMonth();
                return m === new Date().getMonth();
              }).reduce((s: number, d: any) => s + Number(d.withdrawalAmount), 0))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{(drawings ?? []).length} total entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Record Owner Withdrawal</CardTitle>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount (UGX) *</label>
                  <input type="number" min="1" value={form.withdrawalAmount}
                    onChange={e => setForm(f => ({ ...f, withdrawalAmount: e.target.value }))}
                    placeholder="0" className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <input type="date" value={form.withdrawalDate}
                    onChange={e => setForm(f => ({ ...f, withdrawalDate: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description / Purpose</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Personal use, owner salary, etc." rows={2}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={createMutation?.isPending}>
                  {createMutation?.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                  Record Withdrawal
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Withdrawal History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : !(drawings ?? []).length ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingDown size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No withdrawals recorded yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Description</th>
                  <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(drawings ?? []).map((d: any) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3">{new Date(d.withdrawalDate).toDateString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.description || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-destructive">{fmtUGX(d.withdrawalAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-sm">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-destructive">{fmtUGX(total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
