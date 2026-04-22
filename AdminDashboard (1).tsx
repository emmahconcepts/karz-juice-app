import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, Calendar, Activity, Database, Bell, Lock, BarChart3, UserCheck } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import UserApprovalPanel from "@/components/UserApprovalPanel";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery();
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery();
  const { data: auditLog } = trpc.admin.getAuditLog.useQuery({ limit: 10 });
  const { data: recentActivity } = trpc.admin.getRecentActivity.useQuery();
  const { data: dayCloseHistory } = trpc.admin.getDayCloseHistory.useQuery({ limit: 10 });
  const { data: systemSettings } = trpc.admin.getSystemSettings.useQuery();

  // Mutations
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("User role updated"); refetchUsers(); },
    onError: (error: any) => toast.error(error.message || "Failed to update user role"),
  });

  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => { toast.success("User deactivated"); refetchUsers(); },
    onError: (error: any) => toast.error(error.message || "Failed to deactivate user"),
  });

  const closeDayMutation = trpc.admin.closeDay.useMutation({
    onSuccess: () => toast.success("Day closed successfully"),
    onError: (error: any) => toast.error(error.message || "Failed to close day"),
  });

  const backupMutation = trpc.admin.triggerBackup.useMutation({
    onSuccess: () => toast.success("Backup initiated"),
    onError: (error: any) => toast.error(error.message || "Failed to initiate backup"),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">Admin access required to view this page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">System management and configuration</p>
      </div>

      {/* System Health Summary */}
      {systemHealth && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Database", value: systemHealth.databaseStatus ?? "OK", ok: systemHealth.databaseStatus === "healthy" },
            { label: "API", value: systemHealth.apiStatus ?? "OK", ok: systemHealth.apiStatus === "healthy" },
            { label: "Users", value: users?.length ?? "—", ok: true },
            { label: "Last backup", value: systemHealth.lastBackup ? new Date(systemHealth.lastBackup).toLocaleDateString() : "Never", ok: !!systemHealth.lastBackup },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`text-lg font-semibold mt-0.5 ${c.ok ? "text-secondary" : "text-destructive"}`}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs — 6 total including new Approvals tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-1.5">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-1.5">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="dayclose" className="gap-1.5">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Day Close</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-card/50">
                      <div>
                        <p className="font-medium capitalize">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">{activity.user}</p>
                      </div>
                      <div className="text-right">
                        {activity.amount && <p className="font-medium">UGX {activity.amount.toLocaleString()}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage system users and roles</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading users…</p>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Last sign in</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b border-border hover:bg-card/50">
                          <td className="py-3 px-4 font-medium">{u.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              u.role === "admin" ? "bg-destructive/20 text-destructive" : "bg-secondary/20 text-secondary"
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{new Date(u.lastSignedIn).toDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <select
                                value={u.role}
                                onChange={e => updateRoleMutation.mutate({ userId: u.id, role: e.target.value as "admin" | "user" })}
                                className="text-xs border border-border rounded px-2 py-1 bg-background"
                              >
                                <option value="user">User</option>
                                <option value="finance">Finance</option>
                                <option value="operations">Operations</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => deactivateUserMutation.mutate({ userId: u.id })}
                              >
                                Deactivate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── NEW: User Approvals Tab ── */}
        <TabsContent value="approvals" className="space-y-4">
          <UserApprovalPanel />
        </TabsContent>

        {/* Day Close Tab */}
        <TabsContent value="dayclose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Day Close Controls</CardTitle>
              <CardDescription>Close the current day or reopen a closed day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full sm:w-auto"
                onClick={() => closeDayMutation.mutate({ date: new Date(), notes: "Admin close" })}
                disabled={closeDayMutation.isPending}
              >
                Close Today
              </Button>
              {dayCloseHistory && dayCloseHistory.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent closes</p>
                  {dayCloseHistory.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm">
                      <span>{new Date(d.closeDate).toDateString()}</span>
                      <span className="text-muted-foreground">UGX {Number(d.totalSales).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>All system transactions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog && auditLog.length > 0 ? (
                <div className="space-y-2">
                  {auditLog.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border border-border rounded-lg text-sm hover:bg-muted/20">
                      <div>
                        <p className="font-medium">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.user} · {new Date(entry.timestamp).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${entry.status === "success" ? "bg-secondary/20 text-secondary" : "bg-destructive/20 text-destructive"}`}>
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No audit entries</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Organization and business configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Organization name</label>
                      <input type="text" defaultValue={systemSettings.organizationName} className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Currency</label>
                      <input type="text" defaultValue={systemSettings.businessCurrency} className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-sm" disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Day close time</label>
                      <input type="time" defaultValue={systemSettings.dayCloseTime} className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Session timeout (s)</label>
                      <input type="number" defaultValue={systemSettings.sessionTimeout} className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-sm" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">Backup</h4>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Auto backup</p>
                        <p className="text-xs text-muted-foreground">Frequency: {systemSettings.backupFrequency}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => backupMutation.mutate()}>
                        <Database className="w-4 h-4 mr-1.5" /> Backup now
                      </Button>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <h4 className="font-medium mb-3">Notifications</h4>
                    <Button variant="outline" size="sm">
                      <Bell className="w-4 h-4 mr-1.5" /> Manage preferences
                    </Button>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1">Save settings</Button>
                    <Button variant="outline" className="flex-1">Cancel</Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">Loading settings…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
