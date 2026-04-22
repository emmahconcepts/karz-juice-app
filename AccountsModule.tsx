import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AccountsModule() {
  const { data: accounts, isLoading } = trpc.dashboard.getAccountBalances.useQuery();

  // Group accounts by type
  const accountsByType = accounts?.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>) || {};

  // Calculate totals
  const totalAssets = accounts
    ?.filter(a => a.type === "asset")
    .reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) || 0;

  const totalLiabilities = accounts
    ?.filter(a => a.type === "liability")
    .reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) || 0;

  const totalEquity = accounts
    ?.filter(a => a.type === "equity")
    .reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) || 0;

  const totalIncome = accounts
    ?.filter(a => a.type === "income")
    .reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) || 0;

  const totalExpenses = accounts
    ?.filter(a => a.type === "expense")
    .reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0) || 0;

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: "bg-green-500/20 text-green-400",
      liability: "bg-red-500/20 text-red-400",
      equity: "bg-blue-500/20 text-blue-400",
      income: "bg-emerald-500/20 text-emerald-400",
      expense: "bg-orange-500/20 text-orange-400",
    };
    return colors[type] || "bg-muted/20 text-muted";
  };

  const getTypeIcon = (type: string) => {
    if (type === "asset" || type === "income") {
      return <TrendingUp className="w-4 h-4" />;
    }
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts & Finance</h1>
          <p className="text-muted">Double-entry ledger system</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Assets</p>
            <p className="text-2xl font-bold text-green-400">UGX {totalAssets.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Liabilities</p>
            <p className="text-2xl font-bold text-red-400">UGX {totalLiabilities.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Equity</p>
            <p className="text-2xl font-bold text-blue-400">UGX {totalEquity.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Income</p>
            <p className="text-2xl font-bold text-emerald-400">UGX {totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Expenses</p>
            <p className="text-2xl font-bold text-orange-400">UGX {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounting Equation Check */}
      <Card className="border-accent/50">
        <CardHeader>
          <CardTitle className="text-sm">Accounting Equation</CardTitle>
          <CardDescription>Assets = Liabilities + Equity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-muted">Assets</p>
              <p className="text-xl font-bold">UGX {totalAssets.toLocaleString()}</p>
            </div>
            <p className="text-2xl font-bold text-muted">=</p>
            <div className="text-center">
              <p className="text-xs text-muted">Liabilities + Equity</p>
              <p className="text-xl font-bold">UGX {(totalLiabilities + totalEquity).toLocaleString()}</p>
            </div>
            <div className="ml-4">
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? (
                <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-xs font-semibold">✓ Balanced</span>
              ) : (
                <span className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-xs font-semibold">⚠ Unbalanced</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart of Accounts by Type */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted text-center">Loading accounts...</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(accountsByType).map(([type, typeAccounts]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-xs font-semibold ${getTypeColor(type)}`}>
                  {getTypeIcon(type)}
                  {type.toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Code</th>
                      <th className="text-left py-3 px-4 font-semibold">Account Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-right py-3 px-4 font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeAccounts?.map((account) => (
                      <tr key={account.id} className="border-b border-border hover:bg-card/50">
                        <td className="py-3 px-4 font-mono text-xs font-semibold">{account.code}</td>
                        <td className="py-3 px-4">{account.name}</td>
                        <td className="py-3 px-4 capitalize text-xs text-muted">{account.category.replace("_", " ")}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          UGX {parseFloat(account.balance.toString()).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Ledger Information */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Double-Entry Ledger System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>✓ Every transaction is recorded in at least two accounts (debit and credit)</p>
          <p>✓ Total debits always equal total credits</p>
          <p>✓ Accounts are organized by type: Assets, Liabilities, Equity, Income, Expenses</p>
          <p>✓ All transactions maintain the accounting equation: Assets = Liabilities + Equity</p>
        </CardContent>
      </Card>
    </div>
  );
}
