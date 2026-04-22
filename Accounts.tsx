import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function Accounts() {
  const { data: accounts, isLoading } = trpc.dashboard.getAccountBalances.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Accounts & Finance</h1>
        <p className="text-muted">Double-entry ledger system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>All financial accounts and balances</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted">Loading accounts...</p>
          ) : accounts && accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Code</th>
                    <th className="text-left py-3 px-4 font-semibold">Account</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-right py-3 px-4 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-border hover:bg-card/50">
                      <td className="py-3 px-4 font-mono text-xs">{account.code}</td>
                      <td className="py-3 px-4">{account.name}</td>
                      <td className="py-3 px-4 capitalize">{account.type}</td>
                      <td className="py-3 px-4 capitalize">{account.category.replace("_", " ")}</td>
                      <td className="py-3 px-4 text-right font-semibold">UGX {parseFloat(account.balance.toString()).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No accounts configured</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
