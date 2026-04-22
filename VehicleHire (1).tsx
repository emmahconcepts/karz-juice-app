import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function VehicleHire() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Hire</h1>
          <p className="text-muted">Track vehicle rentals for delivery and functions</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Record Hire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Hire Records</CardTitle>
          <CardDescription>Delivery, function, and sourcing purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
