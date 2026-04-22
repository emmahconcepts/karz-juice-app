import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Statements() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statements</h1>
          <p className="text-muted">Bank and Mobile Money statement reconciliation</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Upload Statement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement Uploads</CardTitle>
          <CardDescription>Matched and unmatched transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
