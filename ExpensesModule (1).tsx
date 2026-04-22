import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ExpenseCategory =
  | "general"
  | "machine_hire"
  | "vehicle_hire"
  | "utilities"
  | "ingredients"
  | "packaging_materials"
  | "wages_salaries";

const CATEGORY_META: Record<ExpenseCategory, { label: string; color: string }> = {
  general:              { label: "General",             color: "bg-blue-500/20 text-blue-400" },
  machine_hire:         { label: "Machine Hire",        color: "bg-orange-500/20 text-orange-400" },
  vehicle_hire:         { label: "Vehicle Hire",        color: "bg-purple-500/20 text-purple-400" },
  utilities:            { label: "Utilities",           color: "bg-cyan-500/20 text-cyan-400" },
  ingredients:          { label: "Ingredients",         color: "bg-green-500/20 text-green-400" },
  packaging_materials:  { label: "Packaging Materials", color: "bg-yellow-500/20 text-yellow-400" },
  wages_salaries:       { label: "Wages & Salaries",    color: "bg-pink-500/20 text-pink-400" },
};

export default function ExpensesModule() {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    amount: "",
    category: "general" as ExpenseCategory,
    accountId: "1",
    description: "",
  });

  const { data: expenses, isLoading, refetch } = trpc.expenses.getExpensesByDateRange.useQuery({
    startDate: new Date(selectedDateRange.startDate),
    endDate: new Date(selectedDateRange.endDate),
  });

  const recordExpenseMutation = trpc.expenses.recordExpense.useMutation({
    onSuccess: () => {
      toast.success("Expense recorded successfully");
      setExpenseForm({ expenseDate: new Date().toISOString().split("T")[0], amount: "", category: "general", accountId: "1", description: "" });
      setShowExpenseForm(false);
      refetch();
    },
    onError: (error) => toast.error(error.message || "Failed to record expense"),
  });

  const deleteExpenseMutation = trpc.expenses.deleteExpense.useMutation({
    onSuccess: () => { toast.success("Expense deleted"); refetch(); },
    onError: (error) => toast.error(error.message || "Failed to delete expense"),
  });

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.expenseDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    recordExpenseMutation.mutate({
      expenseDate: new Date(expenseForm.expenseDate),
      amount: expenseForm.amount,
      category: expenseForm.category,
      accountId: parseInt(expenseForm.accountId),
      description: expenseForm.description,
    });
  };

  const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
  const expensesByCategory = expenses?.reduce((acc, e) => {
    const cat = e.category as ExpenseCategory;
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amount.toString());
    return acc;
  }, {} as Record<ExpenseCategory, number>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted">Track business expenses by category</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setShowExpenseForm(true)}>
          <Plus className="w-4 h-4" /> Record Expense
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm text-muted">From</label>
              <input type="date" value={selectedDateRange.startDate}
                onChange={(e) => setSelectedDateRange({ ...selectedDateRange, startDate: e.target.value })}
                className="input-field" />
            </div>
            <div>
              <label className="text-sm text-muted">To</label>
              <input type="date" value={selectedDateRange.endDate}
                onChange={(e) => setSelectedDateRange({ ...selectedDateRange, endDate: e.target.value })}
                className="input-field" />
            </div>
            <Button className="btn-secondary" onClick={() => refetch()}>Apply Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">UGX {totalExpenses.toLocaleString()}</p>
          </CardContent>
        </Card>
        {Object.entries(expensesByCategory).map(([cat, amount]) => {
          const meta = CATEGORY_META[cat as ExpenseCategory];
          return (
            <Card key={cat}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted">{meta?.label || cat}</p>
                <p className="text-lg font-bold">UGX {amount.toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>{selectedDateRange.startDate} to {selectedDateRange.endDate}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading expenses...</p>
          ) : expenses && expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const meta = CATEGORY_META[expense.category as ExpenseCategory];
                    return (
                      <tr key={expense.id} className="border-b border-border hover:bg-card/50">
                        <td className="py-3 px-4">{new Date(expense.expenseDate).toDateString()}</td>
                        <td className="py-3 px-4">{expense.description || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${meta?.color || "bg-muted/20 text-muted"}`}>
                            {meta?.label || expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          UGX {parseFloat(expense.amount.toString()).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete this expense?")) {
                                deleteExpenseMutation.mutate({ id: expense.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No expenses recorded for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Record Expense</CardTitle>
              <button onClick={() => setShowExpenseForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Expense Date *</label>
                  <input type="date" value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Amount (UGX) *</label>
                  <input type="number" step="0.01" placeholder="0.00" value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="input-field w-full" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Category *</label>
                  <select value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as ExpenseCategory })}
                    className="input-field w-full">
                    {Object.entries(CATEGORY_META).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Payment Account</label>
                  <select value={expenseForm.accountId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, accountId: e.target.value })}
                    className="input-field w-full">
                    <option value="1">Cash Account</option>
                    <option value="2">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold">Description</label>
                  <textarea placeholder="Expense details..." value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="input-field w-full" rows={3} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="btn-primary flex-1" disabled={recordExpenseMutation.isPending}>
                    {recordExpenseMutation.isPending ? "Recording..." : "Record Expense"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowExpenseForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
