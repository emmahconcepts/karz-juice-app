import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Receipts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Receipts & OCR</h1>
          <p className="text-muted">AI-powered receipt extraction and confirmation</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          Upload Receipt
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Processing</CardTitle>
          <CardDescription>Unconfirmed receipts awaiting manual review</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-center py-8">Feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
