import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Tag, BarChart3 } from "lucide-react";

export default function CustomAccountsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Custom Accounts</h1>
          <p className="text-muted-foreground mt-2">Create and manage custom chart of accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Plus className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Account</h3>
              <p className="text-sm text-muted-foreground">Create custom account</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Tag className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Classifications</h3>
              <p className="text-sm text-muted-foreground">Account types</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Balances</h3>
              <p className="text-sm text-muted-foreground">Account balances</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Settings</h3>
              <p className="text-sm text-muted-foreground">Account configuration</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-purple-500 hover:bg-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            New Account
          </Button>
          <Button variant="outline">
            <Tag className="w-4 h-4 mr-2" />
            Classifications
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Balances
          </Button>
        </div>
      </Card>
    </div>
  );
}
