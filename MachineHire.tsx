import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MachineHire() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Machine Hire</h1>
          <p className="text-muted">Track external machine rentals</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Record Hire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Hire Records</CardTitle>
          <CardDescription>Daily and per-job machine costs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
