import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Download, Plus, X } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ReportsModule() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: "daily" as "daily" | "weekly" | "monthly",
    reportDate: new Date().toISOString().split("T")[0],
    recipientEmail: "",
    includeCharts: true,
    includeSummary: true,
  });

  // Queries
  const { data: reports, isLoading, refetch } = trpc.reports.getReports.useQuery({
    limit: 50,
    offset: 0,
  });

  // Mutations
  const generateReportMutation = trpc.reports.generateReport.useMutation({
    onSuccess: () => {
      toast.success("Report generated successfully");
      setReportForm({
        reportType: "daily",
        reportDate: new Date().toISOString().split("T")[0],
        recipientEmail: "",
        includeCharts: true,
        includeSummary: true,
      });
      setShowReportForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate report");
    },
  });

  const sendEmailMutation = trpc.reports.sendReport.useMutation({
    onSuccess: () => {
      toast.success("Report sent via email");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send email");
    },
  });

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.recipientEmail) {
      toast.error("Recipient email is required");
      return;
    }

    generateReportMutation.mutate({
      reportType: reportForm.reportType,
      dateRange: {
        start: new Date(reportForm.reportDate),
        end: new Date(reportForm.reportDate),
      },
      includeDetails: reportForm.includeCharts,
    });
  };

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "Daily Summary",
      weekly: "Weekly Summary",
      monthly: "Monthly Summary",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Email</h1>
          <p className="text-muted">Generate and send automated reports</p>
        </div>
        <Button className="btn-primary gap-2" onClick={() => setShowReportForm(true)}>
          <Plus className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:bg-card/50 cursor-pointer transition">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Daily Summary</h3>
            <p className="text-xs text-muted">Sales, expenses, and profit</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-card/50 cursor-pointer transition">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Weekly Summary</h3>
            <p className="text-xs text-muted">7-day overview</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-card/50 cursor-pointer transition">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Monthly Summary</h3>
            <p className="text-xs text-muted">Full month analysis</p>
          </CardContent>
        </Card>
        <Card className="hover:bg-card/50 cursor-pointer transition">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Custom Report</h3>
            <p className="text-xs text-muted">Build your own</p>
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Recent reports and email history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted text-center py-8">Loading reports...</p>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report: any) => (
                <div key={report.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{getReportTypeLabel(report.reportType)}</h4>
                      <p className="text-sm text-muted">
                        Generated: {new Date(report.generatedDate).toDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        report.emailSent ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"
                      }`}>
                        {report.emailSent ? "Sent" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Report Summary */}
                  <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-muted/10 rounded text-sm">
                    <div>
                      <p className="text-xs text-muted">Total Sales</p>
                      <p className="font-semibold">UGX {parseFloat(report.totalSales?.toString() || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Total Expenses</p>
                      <p className="font-semibold">UGX {parseFloat(report.totalExpenses?.toString() || "0").toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Net Profit</p>
                      <p className="font-semibold text-secondary">
                        UGX {(parseFloat(report.totalSales?.toString() || "0") - parseFloat(report.totalExpenses?.toString() || "0")).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" className="btn-outline gap-2 flex-1">
                      <Download className="w-3 h-3" />
                      Download PDF
                    </Button>
                    {!report.emailSent && (
                      <Button
                        size="sm"
                        className="btn-secondary gap-2 flex-1"
                        disabled={!reportForm.recipientEmail}
                        onClick={() => {
                          if (!reportForm.recipientEmail) {
                            toast.error("Please enter a recipient email address");
                            return;
                          }
                          sendEmailMutation.mutate({ reportId: report.id, recipients: [reportForm.recipientEmail] });
                        }}
                      >
                        <Mail className="w-3 h-3" />
                        Send Email
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted text-center py-8">No reports generated yet</p>
          )}
        </CardContent>
      </Card>

      {/* Report Generation Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generate Report</CardTitle>
              <button onClick={() => setShowReportForm(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateReport} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Report Type *</label>
                  <select
                    value={reportForm.reportType}
                    onChange={(e) => setReportForm({ ...reportForm, reportType: e.target.value as any })}
                    className="input-field w-full"
                  >
                    <option value="daily_summary">Daily Summary</option>
                    <option value="weekly_summary">Weekly Summary</option>
                    <option value="monthly_summary">Monthly Summary</option>
                    <option value="custom">Custom Report</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold">Report Date *</label>
                  <input
                    type="date"
                    value={reportForm.reportDate}
                    onChange={(e) => setReportForm({ ...reportForm, reportDate: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Recipient Email *</label>
                  <input
                    type="email"
                    placeholder="owner@karzjuice.com"
                    value={reportForm.recipientEmail}
                    onChange={(e) => setReportForm({ ...reportForm, recipientEmail: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Report Contents</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="summary"
                      checked={reportForm.includeSummary}
                      onChange={(e) => setReportForm({ ...reportForm, includeSummary: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="summary" className="text-sm">
                      Include Summary
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="charts"
                      checked={reportForm.includeCharts}
                      onChange={(e) => setReportForm({ ...reportForm, includeCharts: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor="charts" className="text-sm">
                      Include Charts
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="btn-primary flex-1" disabled={generateReportMutation.isPending}>
                    {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
                  </Button>
                  <Button type="button" className="btn-outline flex-1" onClick={() => setShowReportForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Reporting Information */}
      <Card className="bg-muted/10 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Automated Email Reporting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>✓ Generate daily, weekly, or monthly reports</p>
          <p>✓ Include sales summaries, expense breakdowns, and profit analysis</p>
          <p>✓ Send reports directly to email with PDF attachments</p>
          <p>✓ Track report generation and email delivery history</p>
          <p>✓ Customize report contents (charts, summaries, details)</p>
        </CardContent>
      </Card>
    </div>
  );
}
