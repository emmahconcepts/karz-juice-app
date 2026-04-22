import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Functions() {
  const { data: functions, isLoading } = trpc.functions.getAllFunctions.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Functions (Events)</h1>
          <p className="text-muted">Manage wedding and event contracts</p>
        </div>
        <Button className="btn-primary gap-2">
          <Plus className="w-4 h-4" />
          New Function
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Functions</CardTitle>
          <CardDescription>Each function has its own account</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted">Loading functions...</p>
          ) : functions && functions.length > 0 ? (
            <div className="space-y-4">
              {functions.map((func) => (
                <div key={func.id} className="p-4 bg-card rounded-lg border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{func.clientName}</p>
                      <p className="text-sm text-muted">{func.eventType}</p>
                      <p className="text-xs text-muted mt-1">Event: {new Date(func.eventDate).toDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">UGX {parseFloat(func.contractAmount.toString()).toLocaleString()}</p>
                      <span className={`alert-badge mt-2 ${
                        func.status === "paid" ? "bg-secondary/20 text-secondary" : 
                        func.status === "partial" ? "bg-accent/20 text-accent" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {func.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted">Deposit Paid</p>
                        <p className="font-semibold">UGX {parseFloat(func.depositPaid.toString()).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted">Balance</p>
                        <p className="font-semibold text-destructive">UGX {parseFloat(func.balanceRemaining.toString()).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <Button size="sm" className="btn-secondary">Record Payment</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No functions recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
