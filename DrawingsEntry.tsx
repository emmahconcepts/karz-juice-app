import { Card } from "@/components/ui/card";
import { TrendingDown, Plus, Clock, BarChart3 } from "lucide-react";
export default function DrawingsEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Drawings Account</h1><p className="text-muted-foreground mt-2">Track owner withdrawals — Equity classification</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: Plus, color: "orange", title: "Record Withdrawal", desc: "Log owner withdrawal" },
          { icon: Clock, color: "blue", title: "History", desc: "View all withdrawals" },
          { icon: BarChart3, color: "green", title: "Summary", desc: "Monthly and yearly totals" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><TrendingDown className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Drawings Account</h2><p className="text-muted-foreground">Track all owner withdrawals. Classified as Equity. Every withdrawal posts to the double-entry ledger.</p></div></Card>
    </div>
  );
}
