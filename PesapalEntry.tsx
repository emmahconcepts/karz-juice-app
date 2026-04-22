import { Card } from "@/components/ui/card";
import { CreditCard, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
export default function PesapalEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">PesaPal Payments</h1><p className="text-muted-foreground mt-2">Accept card and mobile money payments via PesaPal gateway</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CreditCard, color: "orange", title: "New Payment", desc: "Initiate a payment request" },
          { icon: DollarSign, color: "green", title: "Receivables", desc: "Pay outstanding invoices" },
          { icon: CheckCircle, color: "blue", title: "Completed", desc: "View successful payments" },
          { icon: AlertCircle, color: "red", title: "Failed", desc: "Investigate failed payments" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><CreditCard className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">PesaPal Payment Gateway</h2><p className="text-muted-foreground">Accept Visa, Mastercard, Airtel Money, and MTN MoMo payments. Supports Uganda, Kenya, and Tanzania.</p></div></Card>
    </div>
  );
}
