import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, BarChart3, Settings, Zap } from "lucide-react";

export default function ProductsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Module</h1>
          <p className="text-muted-foreground mt-2">Manage product catalog and inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Package className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Product</h3>
              <p className="text-sm text-muted-foreground">Add product</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Inventory</h3>
              <p className="text-sm text-muted-foreground">Stock levels</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Categories</h3>
              <p className="text-sm text-muted-foreground">Manage categories</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Zap className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Pricing</h3>
              <p className="text-sm text-muted-foreground">Price management</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-green-500 hover:bg-green-600">
            <Package className="w-4 h-4 mr-2" />
            New Product
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Inventory
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Categories
          </Button>
        </div>
      </Card>
    </div>
  );
}
