import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function VehicleHireModule() {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [showHireForm, setShowHireForm] = useState(false);
  const [hireForm, setHireForm] = useState({
    vehicleOwnerName: "",
    purpose: "delivery" as "delivery" | "function" | "sourcing",
    hirePeriodStart: new Date().toISOString().split("T")[0],
    hirePeriodEnd: "",
    cost: "",
    fuelIncluded: false,
    paymentMethod: "cash" as "cash" | "mobile_money",
  });

  // Queries
  const { data: vehicleHires, isLoading, refetch } = trpc.vehicleHire.getVehicleHiresByDateRange.useQuery({
    startDate: new Date(selectedDateRange.startDate),
    endDate: new Date(selectedDateRange.endDate),
  });

  // Mutations
  const recordHireMutation = trpc.vehicleHire.recordVehicleHire.useMutation({
    onSuccess: () => {
      toast.success("Vehicle hire recorded successfully");
      setHireForm({
        vehicleOwnerName: "",
        purpose: "delivery",
        hirePeriodStart: new Date().toISOString().split("T")[0],
        hirePeriodEnd: "",
        cost: "",
        fuelIncluded: false,
        paymentMethod: "cash",
      });
      setShowHireForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record vehicle hire");
    },
  });

  const handleRecordHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.vehicleOwnerName || !hireForm.cost) {
      toast.error("Please fill in all required fields");
      return;
    }

    recordHireMutation.mutate({
      vehicleOwnerName: hireForm.vehicleOwnerName,
      purpose: hireForm.purpose,
      hirePeriodStart: new Date(hireForm.hirePeriodStart),
      hirePeriodEnd: hireForm.hirePeriodEnd ? new Date(hireForm.hirePeriodEnd) : undefined,
      cost: hireForm.cost,
      fuelIncluded: hireForm.fuelIncluded,
      paymentMethod: hireForm.paymentMethod,
    });
  };

  const totalCost = vehicleHires?.reduce((sum, h) => sum + parseFloat(h.cost.toString()), 0) || 0;

  const hiresByPurpose = vehicleHires?.reduce((acc, h) => {
    if (!acc[h.purpose]) acc[h.purpose] = 0;
    acc[h.purpose] += 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getPurposeColor = (purpose: string) => {
    const colors: Record<string, string> = {
      delivery: "bg-blue-500/20 text-blue-400",
      function: "bg-purple-500/20 text-purple-400",
      sourcing: "bg-orange-500/20 text-orange-400",
    };
    return colors[purpose] || "bg-muted/20 text-muted";
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      delivery: "Delivery",
      function: "Function",
      sourcing: "Sourcing",
    };
    return labels[purpose] || purpose;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Hire</h1>
          <p className="text-muted">Track vehicle rentals for delivery, functions, and sourcing</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setShowHireForm(true)}>
          <Plus className="w-4 h-4" />
          Record Hire
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm text-muted">From</label>
              <input
                type="date"
                value={selectedDateRange.startDate}
                onChange={(e) => setSelectedDateRange({ ...selectedDateRange, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm text-muted">To</label>
              <input
                type="date"
                value={selectedDateRange.endDate}
                onChange={(e) => setSelectedDateRange({ ...selectedDateRange, endDate: e.target.value })}
                className="input-field"
              />
            </div>
            <Button className="btn-secondary" onClick={() => refetch()}>
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Cost</p>
            <p className="text-2xl font-bold text-destructive">UGX {totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        {Object.entries(hiresByPurpose).map(([purpose, count]) => (
          <Card key={purpose}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted">{getPurposeLabel(purpose)}</p>
              <p className="text-2xl font-bold">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vehicle Hires Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Hire Records</CardTitle>
          <CardDescription>
            {selectedDateRange.startDate} to {selectedDateRange.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading vehicle hires...</p>
          ) : vehicleHires && vehicleHires.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Owner</th>
                    <th className="text-left py-3 px-4 font-semibold">Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold">Period</th>
                    <th className="text-left py-3 px-4 font-semibold">Fuel</th>
                    <th className="text-right py-3 px-4 font-semibold">Cost</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleHires.map((hire) => (
                    <tr key={hire.id} className="border-b border-border hover:bg-card/50">
                      <td className="py-3 px-4 font-semibold">{hire.vehicleOwnerName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getPurposeColor(hire.purpose)}`}>
                          {getPurposeLabel(hire.purpose)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(hire.hirePeriodStart).toDateString()}
                        {hire.hirePeriodEnd && ` - ${new Date(hire.hirePeriodEnd).toDateString()}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          hire.fuelIncluded ? "bg-secondary/20 text-secondary" : "bg-muted/20 text-muted"
                        }`}>
                          {hire.fuelIncluded ? "Included" : "Not Included"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">UGX {parseFloat(hire.cost.toString()).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          hire.paymentMethod === "cash" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        }`}>
                          {hire.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" className="btn-outline gap-1 text-destructive">
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No vehicle hires recorded for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Hire Form Modal */}
      {showHireForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Record Vehicle Hire</CardTitle>
              <button onClick={() => setShowHireForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordHire} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Vehicle Owner Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., ABC Taxi Service"
                    value={hireForm.vehicleOwnerName}
                    onChange={(e) => setHireForm({ ...hireForm, vehicleOwnerName: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Purpose *</label>
                  <select
                    value={hireForm.purpose}
                    onChange={(e) => setHireForm({ ...hireForm, purpose: e.target.value as "delivery" | "function" | "sourcing" })}
                    className="input-field w-full"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="function">Function</option>
                    <option value="sourcing">Sourcing</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">Start Date *</label>
                    <input
                      type="date"
                      value={hireForm.hirePeriodStart}
                      onChange={(e) => setHireForm({ ...hireForm, hirePeriodStart: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">End Date</label>
                    <input
                      type="date"
                      value={hireForm.hirePeriodEnd}
                      onChange={(e) => setHireForm({ ...hireForm, hirePeriodEnd: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Cost (UGX) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={hireForm.cost}
                    onChange={(e) => setHireForm({ ...hireForm, cost: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fuelIncluded"
                    checked={hireForm.fuelIncluded}
                    onChange={(e) => setHireForm({ ...hireForm, fuelIncluded: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="fuelIncluded" className="text-sm font-semibold">
                    Fuel Included
                  </label>
                </div>

                <div>
                  <label className="text-sm font-semibold">Payment Method *</label>
                  <select
                    value={hireForm.paymentMethod}
                    onChange={(e) => setHireForm({ ...hireForm, paymentMethod: e.target.value as "cash" | "mobile_money" })}
                    className="input-field w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={recordHireMutation.isPending}>
                    {recordHireMutation.isPending ? "Recording..." : "Record Hire"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowHireForm(false)}>
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
