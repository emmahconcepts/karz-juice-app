import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, BarChart3, Package, Receipt } from "lucide-react";

export default function SalesEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Module</h1>
          <p className="text-muted-foreground mt-2">Manage daily sales, products, and revenue tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Record Sale</h3>
              <p className="text-sm text-muted-foreground">Log new sales transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Manage Products</h3>
              <p className="text-sm text-muted-foreground">Add and edit products</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Daily Close</h3>
              <p className="text-sm text-muted-foreground">Close and finalize daily sales</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">View Reports</h3>
              <p className="text-sm text-muted-foreground">Sales analytics and trends</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-orange-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
          </Button>
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Products
          </Button>
          <Button variant="outline">
            <Receipt className="w-4 h-4 mr-2" />
            Close Day
          </Button>
        </div>
      </Card>
    </div>
  );
}
