import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, TrendingUp, Mail } from "lucide-react";

export default function ReportsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Module</h1>
          <p className="text-muted-foreground mt-2">Generate and email business reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Sales Report</h3>
              <p className="text-sm text-muted-foreground">Daily/weekly sales</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <PieChart className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Income Analysis</h3>
              <p className="text-sm text-muted-foreground">Revenue breakdown</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Trends</h3>
              <p className="text-sm text-muted-foreground">Performance trends</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Mail className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-sm text-muted-foreground">Send reports</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            Sales Report
          </Button>
          <Button variant="outline">
            <PieChart className="w-4 h-4 mr-2" />
            Analysis
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Email Report
          </Button>
        </div>
      </Card>
    </div>
  );
}
