import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, DollarSign, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function FunctionsModule() {
  const [showNewFunction, setShowNewFunction] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFunctionId, setSelectedFunctionId] = useState<number | null>(null);

  // Form states
  const [functionForm, setFunctionForm] = useState({
    clientName: "",
    eventType: "Wedding",
    eventDate: "",
    contractAmount: "",
    depositPaid: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentDate: "",
    paymentMethod: "cash" as "cash" | "mobile_money",
  });

  // Queries
  const { data: functions, isLoading, refetch } = trpc.functions.getAllFunctions.useQuery();

  // Mutations
  const createFunctionMutation = trpc.functions.createFunction.useMutation({
    onSuccess: () => {
      toast.success("Function created successfully");
      setFunctionForm({ clientName: "", eventType: "Wedding", eventDate: "", contractAmount: "", depositPaid: "" });
      setShowNewFunction(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create function");
    },
  });

  const recordPaymentMutation = trpc.functions.recordFunctionPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      setPaymentForm({ amountPaid: "", paymentDate: "", paymentMethod: "cash" });
      setShowPaymentForm(false);
      setSelectedFunctionId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const handleCreateFunction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functionForm.clientName || !functionForm.contractAmount || !functionForm.eventDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    createFunctionMutation.mutate({
      clientName: functionForm.clientName,
      eventType: functionForm.eventType,
      eventDate: new Date(functionForm.eventDate),
      contractAmount: functionForm.contractAmount,
      depositPaid: functionForm.depositPaid || "0",
    });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFunctionId || !paymentForm.amountPaid || !paymentForm.paymentDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    recordPaymentMutation.mutate({
      functionId: selectedFunctionId,
      amountPaid: paymentForm.amountPaid,
      paymentDate: new Date(paymentForm.paymentDate),
      paymentMethod: paymentForm.paymentMethod,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-secondary/20 text-secondary";
      case "partial":
        return "bg-accent/20 text-accent";
      case "overdue":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-muted/20 text-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Functions & Events</h1>
          <p className="text-muted">Manage wedding and event contracts</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setShowNewFunction(true)}>
          <Plus className="w-4 h-4" />
          New Function
        </Button>
      </div>

      {/* Functions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted text-center">Loading functions...</p>
            </CardContent>
          </Card>
        ) : functions && functions.length > 0 ? (
          functions.map((func) => (
            <Card key={func.id} className="hover:bg-card/50 transition">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{func.clientName}</h3>
                    <p className="text-sm text-muted">{func.eventType} • {new Date(func.eventDate).toDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-accent">UGX {parseFloat(func.contractAmount.toString()).toLocaleString()}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(func.status)}`}>
                      {func.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-muted">Payment Progress</p>
                    <p className="text-sm font-semibold">
                      {((parseFloat(func.depositPaid.toString()) / parseFloat(func.contractAmount.toString())) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{
                        width: `${(parseFloat(func.depositPaid.toString()) / parseFloat(func.contractAmount.toString())) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/10 rounded">
                  <div>
                    <p className="text-xs text-muted">Deposit Paid</p>
                    <p className="font-semibold">UGX {parseFloat(func.depositPaid.toString()).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Balance Due</p>
                    <p className="font-semibold text-destructive">UGX {parseFloat(func.balanceRemaining.toString()).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Days Until Event</p>
                    <p className="font-semibold">
                      {Math.ceil((new Date(func.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="btn-secondary gap-2 flex-1"
                    onClick={() => {
                      setSelectedFunctionId(func.id);
                      setShowPaymentForm(true);
                    }}
                  >
                    <DollarSign className="w-4 h-4" />
                    Record Payment
                  </Button>
                  <Button className="btn-outline gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button className="btn-outline gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted text-center">No functions recorded yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Function Modal */}
      {showNewFunction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background">
              <CardTitle>Create New Function</CardTitle>
              <button onClick={() => setShowNewFunction(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFunction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Client Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., John & Jane Doe"
                      value={functionForm.clientName}
                      onChange={(e) => setFunctionForm({ ...functionForm, clientName: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Event Type *</label>
                    <select
                      value={functionForm.eventType}
                      onChange={(e) => setFunctionForm({ ...functionForm, eventType: e.target.value })}
                      className="input-field w-full"
                    >
                      <option>Wedding</option>
                      <option>Birthday</option>
                      <option>Corporate Event</option>
                      <option>Graduation</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Event Date *</label>
                    <input
                      type="date"
                      value={functionForm.eventDate}
                      onChange={(e) => setFunctionForm({ ...functionForm, eventDate: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Contract Amount (UGX) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={functionForm.contractAmount}
                      onChange={(e) => setFunctionForm({ ...functionForm, contractAmount: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Initial Deposit (UGX)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={functionForm.depositPaid}
                    onChange={(e) => setFunctionForm({ ...functionForm, depositPaid: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={createFunctionMutation.isPending}>
                    {createFunctionMutation.isPending ? "Creating..." : "Create Function"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowNewFunction(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Record Payment</CardTitle>
              <button onClick={() => setShowPaymentForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Amount Paid (UGX) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as "cash" | "mobile_money" })}
                    className="input-field w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={recordPaymentMutation.isPending}>
                    {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowPaymentForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
