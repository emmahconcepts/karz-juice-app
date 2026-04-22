import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, Calendar, Activity, Database, Bell, Lock, BarChart3 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Queries
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.admin.getUsers.useQuery();
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery();
  const { data: auditLog } = trpc.admin.getAuditLog.useQuery({ limit: 10 });
  const { data: recentActivity } = trpc.admin.getRecentActivity.useQuery();
  const { data: dayCloseHistory } = trpc.admin.getDayCloseHistory.useQuery({ limit: 10 });
  const { data: systemSettings } = trpc.admin.getSystemSettings.useQuery();

  // Mutations
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const deactivateUserMutation = trpc.admin.deactivateUser.useMutation({
    onSuccess: () => {
      toast.success("User deactivated");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to deactivate user");
    },
  });

  const closeDayMutation = trpc.admin.closeDay.useMutation({
    onSuccess: () => {
      toast.success("Day closed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to close day");
    },
  });

  const backupMutation = trpc.admin.triggerBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup initiated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initiate backup");
    },
  });

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted">Admin access required to view this page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted">System administration and user management</p>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">System Status</p>
                  <p className="text-2xl font-bold text-secondary">{systemHealth.status}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted">Database</p>
                <p className="text-lg font-semibold">{systemHealth.database.status}</p>
                <p className="text-xs text-muted">{systemHealth.database.responseTime}ms</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted">API Uptime</p>
                <p className="text-lg font-semibold">{systemHealth.api.uptime}%</p>
                <p className="text-xs text-muted">{systemHealth.api.requestsPerSecond} req/s</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted">Storage</p>
                <p className="text-lg font-semibold">{systemHealth.storage.percentage}%</p>
                <p className="text-xs text-muted">{systemHealth.storage.used} / {systemHealth.storage.available}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="dayclose" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Day Close</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
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
                        <p className="font-semibold capitalize">{activity.description}</p>
                        <p className="text-sm text-muted">{activity.user}</p>
                      </div>
                      <div className="text-right">
                        {activity.amount && <p className="font-semibold">UGX {activity.amount.toLocaleString()}</p>}
                        <p className="text-xs text-muted">{new Date(activity.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">No recent activity</p>
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
              <Button className="btn-primary gap-2" size="sm">
                <Users className="w-4 h-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-muted text-center py-8">Loading users...</p>
              ) : users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-left py-3 px-4">Last Sign In</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u: any) => (
                        <tr key={u.id} className="border-b border-border hover:bg-card/50">
                          <td className="py-3 px-4 font-semibold">{u.name}</td>
                          <td className="py-3 px-4 text-muted">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.role === "admin" ? "bg-destructive/20 text-destructive" : "bg-secondary/20 text-secondary"
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted text-xs">{new Date(u.lastSignedIn).toDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  updateRoleMutation.mutate({ userId: u.id, role: e.target.value as "admin" | "user" })
                                }
                                className="input-field text-xs py-1"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                              <Button
                                size="sm"
                                className="btn-outline text-xs"
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
                <p className="text-muted text-center py-8">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Day Close Tab */}
        <TabsContent value="dayclose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Day Close Management</CardTitle>
              <CardDescription>Close days and view close history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="btn-primary gap-2 w-full" onClick={() => closeDayMutation.mutate({ date: new Date() })}>
                <Calendar className="w-4 h-4" />
                Close Today
              </Button>

              <div className="border-t border-border pt-4">
                <h4 className="font-semibold mb-4">Close History</h4>
                {dayCloseHistory && dayCloseHistory.length > 0 ? (
                  <div className="space-y-3">
                    {dayCloseHistory.map((close: any) => (
                      <div key={close.id} className="p-4 border border-border rounded-lg hover:bg-card/50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{new Date(close.closedDate).toDateString()}</p>
                            <p className="text-sm text-muted">Closed by: {close.closedBy}</p>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-secondary/20 text-secondary">
                            {close.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted">Sales</p>
                            <p className="font-semibold">UGX {close.totalSales.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted">Expenses</p>
                            <p className="font-semibold">UGX {close.totalExpenses.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted">Profit</p>
                            <p className="font-semibold text-secondary">UGX {close.netProfit.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-8">No close history</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track all system activities and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLog && auditLog.length > 0 ? (
                <div className="space-y-3">
                  {auditLog.map((log: any) => (
                    <div key={log.id} className="p-3 border border-border rounded-lg hover:bg-card/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{log.action}</p>
                          <p className="text-sm text-muted">{log.userName} • {log.resourceType}</p>
                        </div>
                        <p className="text-xs text-muted">{new Date(log.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-muted">{log.details}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">No audit logs</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {systemSettings && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">Organization Name</label>
                      <input type="text" defaultValue={systemSettings.organizationName} className="input-field w-full mt-2" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Currency</label>
                      <input type="text" defaultValue={systemSettings.businessCurrency} className="input-field w-full mt-2" disabled />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">Day Close Time</label>
                      <input type="time" defaultValue={systemSettings.dayCloseTime} className="input-field w-full mt-2" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Session Timeout (seconds)</label>
                      <input type="number" defaultValue={systemSettings.sessionTimeout} className="input-field w-full mt-2" />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold mb-3">Backup Settings</h4>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold">Auto Backup</p>
                        <p className="text-sm text-muted">Frequency: {systemSettings.backupFrequency}</p>
                      </div>
                      <Button className="btn-secondary gap-2" onClick={() => backupMutation.mutate()}>
                        <Database className="w-4 h-4" />
                        Backup Now
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="font-semibold mb-3">Notifications</h4>
                    <Button className="btn-outline gap-2">
                      <Bell className="w-4 h-4" />
                      Manage Preferences
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="btn-primary flex-1">Save Settings</Button>
                    <Button className="btn-outline flex-1">Cancel</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
