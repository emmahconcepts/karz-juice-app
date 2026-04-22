import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Settings, Activity, Lock } from "lucide-react";

export default function AdminEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System administration and configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Users</h3>
              <p className="text-sm text-muted-foreground">Manage users and roles</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Settings className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Settings</h3>
              <p className="text-sm text-muted-foreground">System configuration</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Activity</h3>
              <p className="text-sm text-muted-foreground">Audit logs</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-lg">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground">Access control</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Users className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
        </div>
      </Card>
    </div>
  );
}
