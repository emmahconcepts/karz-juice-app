/**
 * Notification Settings — Fully wired to tRPC
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Mail, Settings, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function NotificationSettings() {
  const [activeTab, setActiveTab] = useState("preferences");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [preferences, setPreferences] = useState({
    dailySummaryEnabled: true, dailySummaryTime: "09:00",
    paymentFailureAlertEnabled: true, paymentFailureAlertDelay: 5,
    unmatchedTransactionAlertEnabled: true, unmatchedTransactionThreshold: 10,
    disputeNotificationEnabled: true, recipientEmails: [] as string[],
  });

  const [smtpConfig, setSmtpConfig] = useState({
    smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "",
    smtpFromEmail: "", smtpFromName: "Karz Juice", useTLS: true,
  });

  const [testEmail, setTestEmail] = useState("");

  // Load current preferences
  const prefQuery = trpc.notifications.getPreferences.useQuery();
  const smtpQuery = trpc.notifications.getSMTPConfig.useQuery();

  useEffect(() => {
    if (prefQuery.data) setPreferences(prev => ({ ...prev, ...prefQuery.data }));
  }, [prefQuery.data]);

  useEffect(() => {
    if (smtpQuery.data) setSmtpConfig(prev => ({ ...prev, ...smtpQuery.data }));
  }, [smtpQuery.data]);

  const updatePrefsMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => { toast.success("Preferences saved"); setIsSaving(false); },
    onError: (e: any) => { toast.error(e.message || "Failed to save"); setIsSaving(false); },
  });

  const updateSMTPMutation = trpc.notifications.updateSMTPConfig.useMutation({
    onSuccess: () => { toast.success("SMTP configuration saved"); setIsSaving(false); },
    onError: (e: any) => { toast.error(e.message || "Failed to save"); setIsSaving(false); },
  });

  const testEmailMutation = trpc.notifications.sendTestEmail.useMutation({
    onSuccess: () => toast.success("Test email sent! Check your inbox."),
    onError: (e: any) => toast.error(e.message || "Failed to send test email"),
  });

  const handleSavePreferences = () => {
    setIsSaving(true);
    updatePrefsMutation.mutate({
      dailySummaryEnabled: preferences.dailySummaryEnabled,
      dailySummaryTime: preferences.dailySummaryTime,
      paymentFailureAlertEnabled: preferences.paymentFailureAlertEnabled,
      paymentFailureAlertDelay: preferences.paymentFailureAlertDelay,
      unmatchedTransactionAlertEnabled: preferences.unmatchedTransactionAlertEnabled,
      unmatchedTransactionThreshold: preferences.unmatchedTransactionThreshold,
      disputeNotificationEnabled: preferences.disputeNotificationEnabled,
      recipientEmails: preferences.recipientEmails,
    });
  };

  const handleSaveSMTP = () => {
    setIsSaving(true);
    updateSMTPMutation.mutate({
      smtpHost: smtpConfig.smtpHost, smtpPort: smtpConfig.smtpPort,
      smtpUser: smtpConfig.smtpUser, smtpPassword: smtpConfig.smtpPassword,
      smtpFromEmail: smtpConfig.smtpFromEmail, smtpFromName: smtpConfig.smtpFromName,
      useTLS: smtpConfig.useTLS,
    });
  };

  const inp = (cls = "") => `w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${cls}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Notifications</h1>
        <p className="text-muted-foreground mt-2">Configure email alerts for reconciliation summaries and payment failures</p>
      </div>

      {successMessage && (
        <Alert className="border-secondary/50 bg-secondary/10">
          <CheckCircle className="h-4 w-4 text-secondary" />
          <AlertDescription className="text-secondary">{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preferences">Notification Preferences</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Daily Reconciliation Summary</CardTitle><CardDescription>Receive a daily email summary of all reconciliation activities</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Daily Summary</Label>
                <Switch checked={preferences.dailySummaryEnabled} onCheckedChange={v => setPreferences(p => ({ ...p, dailySummaryEnabled: v }))} />
              </div>
              {preferences.dailySummaryEnabled && (
                <div className="space-y-2">
                  <Label>Send at (HH:MM)</Label>
                  <input type="time" value={preferences.dailySummaryTime} onChange={e => setPreferences(p => ({ ...p, dailySummaryTime: e.target.value }))} className={inp("max-w-xs")} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Payment Failure Alerts</CardTitle><CardDescription>Get notified when a payment fails</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Payment Failure Alerts</Label>
                <Switch checked={preferences.paymentFailureAlertEnabled} onCheckedChange={v => setPreferences(p => ({ ...p, paymentFailureAlertEnabled: v }))} />
              </div>
              {preferences.paymentFailureAlertEnabled && (
                <div className="space-y-2">
                  <Label>Alert Delay (minutes)</Label>
                  <input type="number" min="1" max="60" value={preferences.paymentFailureAlertDelay} onChange={e => setPreferences(p => ({ ...p, paymentFailureAlertDelay: parseInt(e.target.value) }))} className={inp("max-w-xs")} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Unmatched Transaction Alerts</CardTitle><CardDescription>Alert when too many transactions remain unmatched</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Unmatched Alerts</Label>
                <Switch checked={preferences.unmatchedTransactionAlertEnabled} onCheckedChange={v => setPreferences(p => ({ ...p, unmatchedTransactionAlertEnabled: v }))} />
              </div>
              {preferences.unmatchedTransactionAlertEnabled && (
                <div className="space-y-2">
                  <Label>Alert threshold (# of unmatched)</Label>
                  <input type="number" min="1" value={preferences.unmatchedTransactionThreshold} onChange={e => setPreferences(p => ({ ...p, unmatchedTransactionThreshold: parseInt(e.target.value) }))} className={inp("max-w-xs")} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dispute Notifications</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Notify on new disputes</Label>
                <Switch checked={preferences.disputeNotificationEnabled} onCheckedChange={v => setPreferences(p => ({ ...p, disputeNotificationEnabled: v }))} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSavePreferences} disabled={isSaving || updatePrefsMutation.isPending}>
            {(isSaving || updatePrefsMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </TabsContent>

        {/* SMTP Tab */}
        <TabsContent value="smtp" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-4 h-4" /> SMTP Server</CardTitle><CardDescription>Configure your outgoing mail server for notifications</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SMTP Host</Label><input value={smtpConfig.smtpHost} onChange={e => setSmtpConfig(p => ({ ...p, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" className={inp()} /></div>
                <div className="space-y-2"><Label>Port</Label><input type="number" value={smtpConfig.smtpPort} onChange={e => setSmtpConfig(p => ({ ...p, smtpPort: parseInt(e.target.value) }))} className={inp()} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Username</Label><input value={smtpConfig.smtpUser} onChange={e => setSmtpConfig(p => ({ ...p, smtpUser: e.target.value }))} placeholder="you@example.com" className={inp()} /></div>
                <div className="space-y-2"><Label>Password</Label><input type="password" value={smtpConfig.smtpPassword} onChange={e => setSmtpConfig(p => ({ ...p, smtpPassword: e.target.value }))} placeholder="••••••••" className={inp()} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>From Email</Label><input value={smtpConfig.smtpFromEmail} onChange={e => setSmtpConfig(p => ({ ...p, smtpFromEmail: e.target.value }))} placeholder="noreply@karzjuice.app" className={inp()} /></div>
                <div className="space-y-2"><Label>From Name</Label><input value={smtpConfig.smtpFromName} onChange={e => setSmtpConfig(p => ({ ...p, smtpFromName: e.target.value }))} placeholder="Karz Juice" className={inp()} /></div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Use TLS</Label>
                <Switch checked={smtpConfig.useTLS} onCheckedChange={v => setSmtpConfig(p => ({ ...p, useTLS: v }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> Send Test Email</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" className={inp("flex-1")} />
                <Button variant="outline" onClick={() => testEmailMutation.mutate({ email: testEmail })} disabled={!testEmail || testEmailMutation.isPending}>
                  {testEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Test"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveSMTP} disabled={isSaving || updateSMTPMutation.isPending}>
            {(isSaving || updateSMTPMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save SMTP Configuration
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
