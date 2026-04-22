import { Card } from "@/components/ui/card";
import { Smartphone, RefreshCw, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
export default function MtnEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">MTN Mobile Money</h1><p className="text-muted-foreground mt-2">Sync and reconcile MTN Mobile Money transactions automatically</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: RefreshCw, color: "orange", title: "Sync Transactions", desc: "Fetch latest MTN transactions" },
          { icon: CheckCircle, color: "green", title: "Matched", desc: "View reconciled transactions" },
          { icon: AlertCircle, color: "red", title: "Unmatched", desc: "Review pending matches" },
          { icon: BarChart3, color: "blue", title: "Reconciliation", desc: "View reconciliation status" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><Smartphone className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">MTN Mobile Money Integration</h2><p className="text-muted-foreground">Automatically sync and reconcile MTN MoMo transactions against your receivables and sales records.</p></div></Card>
    </div>
  );
}
