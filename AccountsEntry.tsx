import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, BookOpen, Settings } from "lucide-react";

export default function AccountsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts & Finance</h1>
          <p className="text-muted-foreground mt-2">Manage chart of accounts and financial records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Cash Account</h3>
              <p className="text-sm text-muted-foreground">Cash transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Mobile Money</h3>
              <p className="text-sm text-muted-foreground">Mobile money transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Ledger</h3>
              <p className="text-sm text-muted-foreground">View accounting ledger</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Balance</h3>
              <p className="text-sm text-muted-foreground">Account balances</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Wallet className="w-4 h-4 mr-2" />
            View Accounts
          </Button>
          <Button variant="outline">
            <BookOpen className="w-4 h-4 mr-2" />
            Ledger
          </Button>
          <Button variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Balance Sheet
          </Button>
        </div>
      </Card>
    </div>
  );
}
