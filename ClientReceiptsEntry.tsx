import { Card } from "@/components/ui/card";
import { CreditCard, Plus, QrCode, Mail, Printer } from "lucide-react";
export default function ClientReceiptsEntry() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Client Receipts</h1><p className="text-muted-foreground mt-2">Generate official receipts with QR verification codes</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Plus, color: "orange", title: "New Receipt", desc: "Generate a client receipt" },
          { icon: QrCode, color: "green", title: "QR Verify", desc: "Verify receipt authenticity" },
          { icon: Mail, color: "blue", title: "Email Receipt", desc: "Send receipt by email" },
          { icon: Printer, color: "purple", title: "Print", desc: "Print or export as PDF" },
        ].map(({ icon: Icon, color, title, desc }) => (
          <Card key={title} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <div className={`p-3 bg-${color}-500/10 rounded-lg`}><Icon className={`w-6 h-6 text-${color}-500`} /></div>
              <div><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{desc}</p></div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6"><div className="text-center py-8"><CreditCard className="w-16 h-16 text-orange-500 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Official Receipt Generation</h2><p className="text-muted-foreground">Every receipt includes a unique QR code. Customers scan to verify authenticity at /receipt/:token</p></div></Card>
    </div>
  );
}
