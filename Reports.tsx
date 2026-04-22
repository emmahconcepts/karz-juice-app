import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted">Automated email reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
            <CardDescription>Sales, expenses, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-primary gap-2 w-full">
              <Download className="w-4 h-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Comprehensive monthly analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="btn-primary gap-2 w-full">
              <Download className="w-4 h-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Reports</CardTitle>
          <CardDescription>Scheduled automated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
