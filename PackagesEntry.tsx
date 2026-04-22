import { Card } from "@/components/ui/card";
import { Gift, Plus, Tag, BarChart3, Star } from "lucide-react";
export default function PackagesEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Packages</h1><p className="text-muted-foreground mt-2">Manage special juice bundles for events and celebrations</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Plus, color: "orange", title: "Create Package", desc: "Add a new juice bundle" },
          { icon: Tag, color: "green", title: "Active Packages", desc: "View and edit live packages" },
          { icon: Star, color: "purple", title: "Event Packages", desc: "Birthday, Wedding, Corporate" },
          { icon: BarChart3, color: "blue", title: "Package Sales", desc: "Revenue by package type" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><Gift className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Package Management</h2><p className="text-muted-foreground">Create and manage special juice packages for events, birthdays, weddings, and corporate functions.</p></div></Card>
    </div>
  );
}
