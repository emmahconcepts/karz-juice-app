import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function MachineHireModule() {
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const [showHireForm, setShowHireForm] = useState(false);
  const [hireForm, setHireForm] = useState({
    machineName: "",
    ownerName: "",
    costType: "daily" as "daily" | "per_job",
    hirePeriodStart: new Date().toISOString().split("T")[0],
    hirePeriodEnd: "",
    costAmount: "",
  });

  // Queries
  const { data: machineHires, isLoading, refetch } = trpc.machineHire.getMachineHiresByDateRange.useQuery({
    startDate: new Date(selectedDateRange.startDate),
    endDate: new Date(selectedDateRange.endDate),
  });

  // Mutations
  const recordHireMutation = trpc.machineHire.recordMachineHire.useMutation({
    onSuccess: () => {
      toast.success("Machine hire recorded successfully");
      setHireForm({
        machineName: "",
        ownerName: "",
        costType: "daily",
        hirePeriodStart: new Date().toISOString().split("T")[0],
        hirePeriodEnd: "",
        costAmount: "",
      });
      setShowHireForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record machine hire");
    },
  });

  const handleRecordHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.machineName || !hireForm.ownerName || !hireForm.costAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    recordHireMutation.mutate({
      machineName: hireForm.machineName,
      ownerName: hireForm.ownerName,
      costType: hireForm.costType,
      hirePeriodStart: new Date(hireForm.hirePeriodStart),
      hirePeriodEnd: hireForm.hirePeriodEnd ? new Date(hireForm.hirePeriodEnd) : undefined,
      costAmount: hireForm.costAmount,
    });
  };

  const totalCost = machineHires?.reduce((sum, h) => sum + parseFloat(h.costAmount.toString()), 0) || 0;

  const dailyHires = machineHires?.filter(h => h.costType === "daily") || [];
  const perJobHires = machineHires?.filter(h => h.costType === "per_job") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Machine Hire</h1>
          <p className="text-muted">Track external machine rentals</p>
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
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Total Cost</p>
            <p className="text-2xl font-bold text-destructive">UGX {totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Daily Hires</p>
            <p className="text-2xl font-bold">{dailyHires.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted">Per-Job Hires</p>
            <p className="text-2xl font-bold">{perJobHires.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Machine Hires Table */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Hire Records</CardTitle>
          <CardDescription>
            {selectedDateRange.startDate} to {selectedDateRange.endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading machine hires...</p>
          ) : machineHires && machineHires.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Machine</th>
                    <th className="text-left py-3 px-4 font-semibold">Owner</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Period</th>
                    <th className="text-right py-3 px-4 font-semibold">Cost</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {machineHires.map((hire) => (
                    <tr key={hire.id} className="border-b border-border hover:bg-card/50">
                      <td className="py-3 px-4 font-semibold">{hire.machineName}</td>
                      <td className="py-3 px-4">{hire.ownerName}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          hire.costType === "daily" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                        }`}>
                          {hire.costType === "daily" ? "Daily" : "Per Job"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(hire.hirePeriodStart).toDateString()}
                        {hire.hirePeriodEnd && ` - ${new Date(hire.hirePeriodEnd).toDateString()}`}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">UGX {parseFloat(hire.costAmount.toString()).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          hire.paymentStatus === "paid" ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"
                        }`}>
                          {hire.paymentStatus}
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
            <p className="text-muted text-center py-8">No machine hires recorded for this period</p>
          )}
        </CardContent>
      </Card>

      {/* Machine Hire Form Modal */}
      {showHireForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Record Machine Hire</CardTitle>
              <button onClick={() => setShowHireForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRecordHire} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Machine Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Industrial Blender"
                    value={hireForm.machineName}
                    onChange={(e) => setHireForm({ ...hireForm, machineName: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Owner Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., John's Equipment Rental"
                    value={hireForm.ownerName}
                    onChange={(e) => setHireForm({ ...hireForm, ownerName: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Cost Type *</label>
                  <select
                    value={hireForm.costType}
                    onChange={(e) => setHireForm({ ...hireForm, costType: e.target.value as "daily" | "per_job" })}
                    className="input-field w-full"
                  >
                    <option value="daily">Daily Rate</option>
                    <option value="per_job">Per Job</option>
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
                  <label className="text-sm font-semibold">Cost Amount (UGX) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={hireForm.costAmount}
                    onChange={(e) => setHireForm({ ...hireForm, costAmount: e.target.value })}
                    className="input-field w-full"
                  />
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
