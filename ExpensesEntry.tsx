import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Tag, BarChart3, Receipt } from "lucide-react";

export default function ExpensesEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses Module</h1>
          <p className="text-muted-foreground mt-2">Track and manage business expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Expense</h3>
              <p className="text-sm text-muted-foreground">Record expense</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Tag className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Categories</h3>
              <p className="text-sm text-muted-foreground">Manage expense categories</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Analytics</h3>
              <p className="text-sm text-muted-foreground">Expense analysis</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Receipt className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Receipts</h3>
              <p className="text-sm text-muted-foreground">Attach receipts</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-red-500 hover:bg-red-600">
            <CreditCard className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline">
            <Tag className="w-4 h-4 mr-2" />
            Categories
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </Card>
    </div>
  );
}
