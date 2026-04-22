import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cog, Truck, DollarSign, FileText } from "lucide-react";

export default function MachineHireEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machine Hire</h1>
          <p className="text-muted-foreground mt-2">Manage external machine rentals and costs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <Cog className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Hire</h3>
              <p className="text-sm text-muted-foreground">Record machine rental</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Truck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Owners</h3>
              <p className="text-sm text-muted-foreground">Manage machine owners</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Payments</h3>
              <p className="text-sm text-muted-foreground">Track payments to owners</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Reports</h3>
              <p className="text-sm text-muted-foreground">Hire analytics</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-indigo-500/10 to-blue-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-indigo-500 hover:bg-indigo-600">
            <Cog className="w-4 h-4 mr-2" />
            New Hire
          </Button>
          <Button variant="outline">
            <Truck className="w-4 h-4 mr-2" />
            Owners
          </Button>
          <Button variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </Button>
        </div>
      </Card>
    </div>
  );
}
