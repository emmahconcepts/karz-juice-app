import { Card } from "@/components/ui/card";
import { Bell, Mail, Settings, Clock } from "lucide-react";
export default function NotificationsEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Notifications</h1><p className="text-muted-foreground mt-2">Configure email alerts for reconciliation, payments, and business events</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Settings, color: "orange", title: "SMTP Settings", desc: "Configure email server" },
          { icon: Bell, color: "green", title: "Preferences", desc: "Set notification triggers" },
          { icon: Clock, color: "blue", title: "Scheduled", desc: "Daily and weekly summaries" },
          { icon: Mail, color: "purple", title: "History", desc: "View sent notifications" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><Bell className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Email Notification System</h2><p className="text-muted-foreground">Get automatic alerts for unmatched transactions, payment failures, and daily reconciliation summaries.</p></div></Card>
    </div>
  );
}
