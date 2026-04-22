import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, MapPin, DollarSign, FileText } from "lucide-react";

export default function VehicleHireEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Hire</h1>
          <p className="text-muted-foreground mt-2">Manage vehicle rentals for delivery and functions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <Car className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Hire</h3>
              <p className="text-sm text-muted-foreground">Record vehicle rental</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Routes</h3>
              <p className="text-sm text-muted-foreground">Track delivery routes</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Costs</h3>
              <p className="text-sm text-muted-foreground">Manage hire costs</p>
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

      <Card className="p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            <Car className="w-4 h-4 mr-2" />
            New Hire
          </Button>
          <Button variant="outline">
            <MapPin className="w-4 h-4 mr-2" />
            Routes
          </Button>
          <Button variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            Costs
          </Button>
        </div>
      </Card>
    </div>
  );
}
