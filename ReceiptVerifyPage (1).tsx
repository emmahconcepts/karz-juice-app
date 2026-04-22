import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function formatUGX(n: string | number) {
  return `UGX ${Number(n).toLocaleString()}`;
}
function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
};

export default function ReceiptVerifyPage() {
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract receipt number from URL path: /verify/:receiptNumber
    const parts = window.location.pathname.split("/");
    const rn = parts[parts.length - 1];
    if (!rn) {
      setError("No receipt number provided");
      setLoading(false);
      return;
    }
    setReceiptNumber(rn);

    // Fetch via public API endpoint
    fetch(`/api/verify-receipt/${rn}`)
      .then(r => {
        if (!r.ok) throw new Error("Receipt not found");
        return r.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Receipt could not be verified");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mx-auto"
            style={{ background: "linear-gradient(135deg, #FF9800 0%, #0B6623 100%)" }}>
            KJ
          </div>
          <h1 className="text-lg font-semibold">Karz Juice</h1>
          <p className="text-sm text-muted-foreground">Receipt Verification</p>
        </div>

        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center py-10 gap-3">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verifying receipt…</p>
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card className="border-destructive/40">
            <CardContent className="flex flex-col items-center py-10 gap-3 text-center">
              <XCircle size={40} className="text-destructive" />
              <div>
                <p className="font-medium text-destructive">Receipt not found</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This QR code may be invalid or the receipt may have been voided.
                  Contact Karz Juice if you believe this is an error.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && data && (
          <Card className="border-secondary/40">
            <CardContent className="pt-6 space-y-4">
              {/* Verified banner */}
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary rounded-lg px-4 py-3">
                <CheckCircle size={20} />
                <div>
                  <p className="font-medium text-sm">Receipt verified</p>
                  <p className="text-xs opacity-80">This is an authentic Karz Juice receipt</p>
                </div>
              </div>

              {/* Receipt details */}
              <div className="space-y-2 text-sm">
                <Row label="Receipt number" value={data.receiptNumber} highlight />
                <Row label="Client" value={data.clientName} />
                {data.eventReference && <Row label="Event reference" value={data.eventReference} />}
                <Row label="Amount paid" value={formatUGX(data.amountPaid)} bold />
                <Row label="Payment method" value={METHOD_LABELS[data.paymentMethod] || data.paymentMethod} />
                <Row label="Date issued" value={formatDate(data.receiptDate)} />
                <Row label="Issued by" value={data.issuedByName || "Karz Juice Staff"} />
              </div>

              <div className="border-t border-border pt-3 text-xs text-muted-foreground text-center">
                Karz Juice · Fresh • Natural • Made in Uganda
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-right font-${bold ? "semibold" : "normal"} ${highlight ? "font-mono text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}
