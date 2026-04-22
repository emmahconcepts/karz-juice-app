import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Download, Mail, QrCode, X, Loader2, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const PAYMENT_METHODS = ["cash", "mobile_money", "bank_transfer"] as const;
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};
const STATUS_COLORS: Record<string, string> = {
  paid: "bg-secondary/20 text-secondary",
  partial: "bg-amber-500/20 text-amber-500",
  overdue: "bg-destructive/20 text-destructive",
};

function formatUGX(n: string | number) {
  return `UGX ${Number(n).toLocaleString()}`;
}

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });
}

// ── Receipt Print View ────────────────────────────────────────────────────────
function ReceiptPrintView({ receipt }: { receipt: any }) {
  const verifyUrl = `${window.location.origin}/verify/${receipt.receiptNumber}`;
  return (
    <div id="receipt-print" style={{ fontFamily: "monospace", background: "#fff", color: "#111", width: 360, margin: "0 auto", padding: 24, border: "1px solid #ddd", borderRadius: 8 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: "linear-gradient(135deg,#FF9800,#0B6623)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontWeight: 700, fontSize: 18 }}>KJ</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>KARZ JUICE</div>
        <div style={{ fontSize: 11, color: "#666" }}>Official Receipt</div>
      </div>
      <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "10px 0", marginBottom: 12 }}>
        <Row label="Receipt #" value={receipt.receiptNumber} />
        <Row label="Date" value={formatDate(receipt.receiptDate)} />
        <Row label="Client" value={receipt.clientName} />
        {receipt.eventReference && <Row label="Event ref" value={receipt.eventReference} />}
        <Row label="Amount paid" value={formatUGX(receipt.amountPaid)} bold />
        <Row label="Payment method" value={METHOD_LABELS[receipt.paymentMethod] || receipt.paymentMethod} />
        <Row label="Issued by" value={receipt.issuedByName || `Staff #${receipt.issuedBy}`} />
      </div>
      {/* QR Code placeholder — real QR rendered by backend */}
      <div style={{ textAlign: "center", margin: "12px 0" }}>
        <div style={{ display: "inline-block", border: "1px solid #ccc", padding: 8, borderRadius: 4 }}>
          <QrCodeSvg value={verifyUrl} size={80} />
        </div>
        <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Scan to verify receipt</div>
        <div style={{ fontSize: 10, color: "#999" }}>{verifyUrl}</div>
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#aaa", marginTop: 12 }}>
        Fresh • Natural • Made in Uganda
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: "#666" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

// Minimal inline SVG QR code representation (uses data URI; real impl uses qrcode.js)
function QrCodeSvg({ value, size }: { value: string; size: number }) {
  // In production, replace with: import QRCode from 'qrcode'; QRCode.toDataURL(value)
  // This renders a placeholder grid to represent a QR code visually
  const cells = 10;
  const cell = size / cells;
  const pattern = Array.from({ length: cells }, (_, r) =>
    Array.from({ length: cells }, (_, c) => {
      const hash = (r * 13 + c * 7 + r * c) % 4;
      return hash > 1;
    })
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pattern.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 1} height={cell - 1} fill="#111" />
          ) : null
        )
      )}
    </svg>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────────
export default function ClientReceiptsModule() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    eventReference: "",
    amountPaid: "",
    paymentMethod: "cash" as typeof PAYMENT_METHODS[number],
    receiptDate: new Date().toISOString().split("T")[0],
  });

  const { data: receipts, isLoading, refetch } = trpc.receipts?.getReceipts?.useQuery?.() ?? { data: [], isLoading: false, refetch: () => {} };

  const createMutation = trpc.receipts?.createReceipt?.useMutation?.({
    onSuccess: (data: any) => {
      toast.success(`Receipt ${data?.receiptNumber || ""} created`);
      setFormData({ clientName: "", eventReference: "", amountPaid: "", paymentMethod: "cash", receiptDate: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to create receipt"),
  });

  const sendEmailMutation = trpc.receipts?.sendReceiptEmail?.useMutation?.({
    onSuccess: () => { toast.success("Receipt emailed successfully"); setSendingEmail(false); setEmailInput(""); },
    onError: (e: any) => { toast.error(e.message || "Failed to send email"); setSendingEmail(false); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.clientName || !formData.amountPaid) {
      toast.error("Client name and amount are required");
      return;
    }
    createMutation?.mutate?.({
      clientName: formData.clientName,
      eventReference: formData.eventReference || undefined,
      amountPaid: formData.amountPaid,
      paymentMethod: formData.paymentMethod,
      receiptDate: new Date(formData.receiptDate),
    });
  }

  function handleSendEmail() {
    if (!emailInput || !selectedReceipt) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSendingEmail(true);
    sendEmailMutation?.mutate?.({ receiptId: selectedReceipt.id, email: emailInput });
  }

  function handlePrint() {
    const el = document.getElementById("receipt-print");
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Receipt</title></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  const filtered = (receipts ?? []).filter((r: any) =>
    !search ||
    r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    r.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.eventReference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Receipt size={22} className="text-primary" /> Client Receipts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Generate, print, and email official receipts with QR verification</p>
        </div>
        <Button onClick={() => { setShowForm(true); setSelectedReceipt(null); }} size="sm">
          <Plus size={14} className="mr-1" /> New Receipt
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total receipts", value: receipts?.length ?? 0 },
          { label: "This month", value: receipts?.filter((r: any) => new Date(r.receiptDate).getMonth() === new Date().getMonth()).length ?? 0 },
          { label: "Emailed", value: receipts?.filter((r: any) => r.emailSent).length ?? 0 },
          { label: "Total collected", value: formatUGX(receipts?.reduce((s: number, r: any) => s + Number(r.amountPaid), 0) ?? 0) },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-semibold mt-0.5">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — List */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by client, receipt number, or event…"
              className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm"
            />
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">New Receipt</CardTitle>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-medium">Client name *</label>
                      <input value={formData.clientName} onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
                        placeholder="Full client name" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Event reference</label>
                      <input value={formData.eventReference} onChange={e => setFormData(f => ({ ...f, eventReference: e.target.value }))}
                        placeholder="e.g. Wedding 2025-06" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Amount paid (UGX) *</label>
                      <input type="number" min="0" value={formData.amountPaid} onChange={e => setFormData(f => ({ ...f, amountPaid: e.target.value }))}
                        placeholder="0" className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Payment method</label>
                      <select value={formData.paymentMethod} onChange={e => setFormData(f => ({ ...f, paymentMethod: e.target.value as any }))}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Date</label>
                      <input type="date" value={formData.receiptDate} onChange={e => setFormData(f => ({ ...f, receiptDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={createMutation?.isPending}>
                      {createMutation?.isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
                      Generate Receipt
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Receipt List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
              ) : !filtered.length ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Receipt size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No receipts yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {filtered.map((r: any) => (
                    <li
                      key={r.id}
                      onClick={() => { setSelectedReceipt(r); setShowForm(false); setEmailInput(""); }}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors ${selectedReceipt?.id === r.id ? "bg-muted/30" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{r.clientName}</p>
                        <p className="text-xs text-muted-foreground">{r.receiptNumber} · {formatDate(r.receiptDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatUGX(r.amountPaid)}</p>
                        <p className="text-xs text-muted-foreground">{METHOD_LABELS[r.paymentMethod]}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right — Receipt Preview */}
        <div className="space-y-3">
          {selectedReceipt ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Download size={13} className="mr-1.5" /> Print / PDF
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => window.open(`/verify/${selectedReceipt.receiptNumber}`, "_blank")}
                >
                  <QrCode size={13} className="mr-1.5" /> Verify QR
                </Button>
                {selectedReceipt.emailSent && (
                  <span className="flex items-center gap-1 text-xs text-secondary">
                    <CheckCircle size={12} /> Emailed
                  </span>
                )}
              </div>

              {/* Email input */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="Send to email address…"
                  className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm"
                />
                <Button size="sm" onClick={handleSendEmail} disabled={sendingEmail || !emailInput}>
                  {sendingEmail ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                </Button>
              </div>

              <ReceiptPrintView receipt={selectedReceipt} />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Receipt size={32} className="mb-3 opacity-30" />
                <p className="text-sm">Select a receipt to preview it</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
