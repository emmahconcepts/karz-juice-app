import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.getDailyKPIs.useQuery({
    date: selectedDate,
  });

  const { data: overdueAlerts, isLoading: alertsLoading } = trpc.dashboard.getOverdueAlerts.useQuery();

  const { data: accountBalances, isLoading: balancesLoading } = trpc.dashboard.getAccountBalances.useQuery();

  // Sample data for charts - would be replaced with real data
  const chartData = [
    { date: "Mon", sales: 4000, expenses: 2400 },
    { date: "Tue", sales: 3000, expenses: 1398 },
    { date: "Wed", sales: 2000, expenses: 9800 },
    { date: "Thu", sales: 2780, expenses: 3908 },
    { date: "Fri", sales: 1890, expenses: 4800 },
    { date: "Sat", sales: 2390, expenses: 3800 },
    { date: "Sun", sales: 3490, expenses: 4300 },
  ];

  const incomeData = [
    { name: "Daily Sales", value: kpis?.dailySales || 0, fill: "#FF9800" },
    { name: "Function Income", value: 0, fill: "#0B6623" },
  ];

  const COLORS = ["#FF9800", "#0B6623", "#D32F2F"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Organization Dashboard</h1>
          <p className="text-muted mt-2">Welcome back, {user?.name || "Admin"}</p>
        </div>
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="input-field"
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Sales */}
        <Card className="kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Daily Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value">
              {kpisLoading ? "..." : `UGX ${(kpis?.dailySales || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted mt-2">Today's revenue</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-destructive">
              {kpisLoading ? "..." : `UGX ${(kpis?.expenses || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted mt-2">Today's spending</p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className="kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-secondary">
              {kpisLoading ? "..." : `UGX ${(kpis?.grossProfit || 0).toLocaleString()}`}
            </div>
            <p className="text-xs text-muted mt-2">Net gain</p>
          </CardContent>
        </Card>

        {/* Outstanding Balances */}
        <Card className="kpi-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-accent">
              {balancesLoading ? "..." : "UGX 0"}
            </div>
            <p className="text-xs text-muted mt-2">Function balances</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Expenses Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales vs Expenses (Weekly)</CardTitle>
            <CardDescription>Revenue and spending trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A1E1B" />
                <XAxis stroke="#CFC4BC" />
                <YAxis stroke="#CFC4BC" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2A1E1B",
                    border: "1px solid #FF9800",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#FF9800"
                  strokeWidth={2}
                  dot={{ fill: "#FF9800" }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#D32F2F"
                  strokeWidth={2}
                  dot={{ fill: "#D32F2F" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income Split Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income Split</CardTitle>
            <CardDescription>Revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2A1E1B",
                    border: "1px solid #FF9800",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      {overdueAlerts && overdueAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Overdue Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueAlerts.map((func) => (
                <div
                  key={func.id}
                  className="flex justify-between items-center p-3 bg-card rounded-lg border border-border"
                >
                  <div>
                    <p className="font-semibold text-foreground">{func.clientName}</p>
                    <p className="text-sm text-muted">{func.eventType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      UGX {parseFloat(func.balanceRemaining.toString()).toLocaleString()}
                    </p>
                    <span className="alert-badge overdue">Overdue</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
