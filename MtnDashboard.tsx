/**
 * MTN Mobile Money Dashboard — Complete Implementation with receivable selection
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock, TrendingUp, DollarSign, X } from "lucide-react";

// ── Receivable picker dialog ────────────────────────────────────────────────
function ReconcileDialog({
  txn,
  onConfirm,
  onClose,
}: {
  txn: any;
  onConfirm: (receivableId: number) => void;
  onClose: () => void;
}) {
  const { data: receivables } = trpc.receivables.getReceivables.useQuery({ limit: 50, offset: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Match to Receivable</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Payer</span><span className="font-medium">{txn.payerName || txn.payerPhoneNumber}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{Number(txn.amount).toLocaleString()} {txn.currency}</span></div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Select the matching receivable:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {!receivables?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">No open receivables found</p>
            ) : receivables.filter(r => r.status !== "paid").map((r: any) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${selectedId === r.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/30"}`}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{r.clientName}</span>
                  <span className="text-primary font-bold">UGX {Number(r.balanceRemaining).toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Due {new Date(r.dueDate).toDateString()} · {r.status}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-border">
          <Button className="flex-1" onClick={() => selectedId && onConfirm(selectedId)} disabled={!selectedId}>Confirm Match</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

export default function MtnDashboard() {
  const [syncStartDate, setSyncStartDate] = useState(new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0]);
  const [syncEndDate, setSyncEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reconcileTarget, setReconcileTarget] = useState<any>(null);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.mtn.getStatus.useQuery();
  const { data: unmatchedTxns, isLoading: unmatchedLoading, refetch: refetchUnmatched } = trpc.mtn.getUnmatchedTransactions.useQuery({ limit: 20 });
  const { data: history, isLoading: historyLoading } = trpc.mtn.getTransactionHistory.useQuery({ startDate: new Date(syncStartDate), endDate: new Date(syncEndDate), limit: 100 });
  const { data: balance } = trpc.mtn.getAccountBalance.useQuery();

  const syncMutation = trpc.mtn.syncTransactions.useMutation({
    onSuccess: (r) => { toast.success(`Sync complete: ${r.matched} matched, ${r.unmatched} unmatched`); refetchStatus(); refetchUnmatched(); },
    onError: (e: any) => toast.error(e.message || "Sync failed"),
  });

  const reconcileMutation = trpc.mtn.manuallyReconcile.useMutation({
    onSuccess: () => { toast.success("Transaction reconciled"); setReconcileTarget(null); refetchStatus(); refetchUnmatched(); },
    onError: (e: any) => toast.error(e.message || "Reconciliation failed"),
  });

  const disputeMutation = trpc.mtn.reportDispute.useMutation({
    onSuccess: () => { toast.success("Dispute reported"); refetchStatus(); refetchUnmatched(); },
    onError: (e: any) => toast.error(e.message || "Failed to report dispute"),
  });

  const statusCards = [
    { label: "Total Transactions", value: status?.totalTransactions ?? 0, icon: TrendingUp, color: "text-primary" },
    { label: "Matched", value: status?.matched ?? 0, icon: CheckCircle2, color: "text-secondary" },
    { label: "Unmatched", value: status?.unmatched ?? 0, icon: Clock, color: "text-amber-400" },
    { label: "Disputed", value: status?.disputed ?? 0, icon: AlertCircle, color: "text-destructive" },
  ];

  if (statusLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {reconcileTarget && (
        <ReconcileDialog
          txn={reconcileTarget}
          onConfirm={(receivableId) => reconcileMutation.mutate({ mtnTransactionId: reconcileTarget.mtnTransactionId, receivableId })}
          onClose={() => setReconcileTarget(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">MTN Mobile Money</h1>
          <p className="text-muted-foreground mt-1">
            {status?.lastSync ? `Last sync: ${new Date(status.lastSync).toLocaleString()}` : "No sync yet"}
          </p>
        </div>
        <Button onClick={() => syncMutation.mutate({ startDate: new Date(syncStartDate), endDate: new Date(syncEndDate), autoReconcile: true })} disabled={syncMutation.isPending}>
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {syncMutation.isPending ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance */}
      {balance && (
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-secondary" />
            <div>
              <p className="text-xs text-muted-foreground">MTN Account Balance</p>
              <p className="text-2xl font-bold text-secondary">{balance.balance.toLocaleString()} {balance.currency}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="unmatched" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unmatched">Unmatched ({status?.unmatched ?? 0})</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="settings">Sync Settings</TabsTrigger>
        </TabsList>

        {/* Unmatched */}
        <TabsContent value="unmatched">
          <Card>
            <CardHeader><CardTitle>Unmatched Transactions</CardTitle></CardHeader>
            <CardContent>
              {unmatchedLoading ? (
                <div className="flex justify-center h-32"><Loader2 className="size-6 animate-spin text-primary self-center" /></div>
              ) : unmatchedTxns?.length ? (
                <div className="space-y-3">
                  {unmatchedTxns.map((txn: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex-1">
                        <p className="font-medium">{txn.payerName || txn.payerPhoneNumber}</p>
                        <p className="text-xs text-muted-foreground font-mono">{txn.mtnTransactionId}</p>
                        <p className="text-xs text-muted-foreground">{new Date(txn.transactionDate).toLocaleString()}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold text-primary">{Number(txn.amount).toLocaleString()} {txn.currency}</p>
                        <Badge variant="outline" className="text-xs mt-1">{txn.status}</Badge>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => setReconcileTarget(txn)}>Match</Button>
                        <Button size="sm" variant="outline" className="text-xs text-destructive border-destructive/30"
                          onClick={() => disputeMutation.mutate({ mtnTransactionId: txn.mtnTransactionId, reason: "other", description: "Needs review" })}>
                          Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-secondary opacity-60" />
                  <p>All transactions are matched!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center h-32"><Loader2 className="size-6 animate-spin text-primary self-center" /></div>
              ) : history?.length ? (
                <div className="space-y-2">
                  {history.map((txn: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border/50">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{txn.payerName || txn.payerPhoneNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(txn.transactionDate).toLocaleString()}</p>
                      </div>
                      <div className="text-right mr-4">
                        <p className="font-bold">{Number(txn.amount).toLocaleString()} {txn.currency}</p>
                        <Badge variant="outline" className={`text-xs mt-1 ${txn.reconciliationStatus==="matched"||txn.reconciliationStatus==="confirmed" ? "text-secondary border-secondary/30" : txn.reconciliationStatus==="disputed" ? "text-destructive border-destructive/30" : ""}`}>
                          {txn.reconciliationStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground"><p>No transactions in this date range</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Sync Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Start Date</label>
                  <input type="date" value={syncStartDate} onChange={e => setSyncStartDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">End Date</label>
                  <input type="date" value={syncEndDate} onChange={e => setSyncEndDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm" />
                </div>
              </div>
              <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> MTN Mobile Money integration requires API credentials.
                  Configure your MTN API keys in Admin → Settings to enable automatic transaction syncing.
                </p>
              </div>
              <Button onClick={() => syncMutation.mutate({ startDate: new Date(syncStartDate), endDate: new Date(syncEndDate), autoReconcile: true })} disabled={syncMutation.isPending}>
                {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Run Sync for Selected Range
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
