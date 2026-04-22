import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, FileText } from "lucide-react";

export default function FunctionsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Functions Module</h1>
          <p className="text-muted-foreground mt-2">Manage events, weddings, and function bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 rounded-lg">
              <Calendar className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold">New Function</h3>
              <p className="text-sm text-muted-foreground">Create event booking</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Attendees</h3>
              <p className="text-sm text-muted-foreground">Manage guest list</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Payments</h3>
              <p className="text-sm text-muted-foreground">Track function payments</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Invoices</h3>
              <p className="text-sm text-muted-foreground">Generate function invoices</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-pink-500 hover:bg-pink-600">
            <Calendar className="w-4 h-4 mr-2" />
            New Event
          </Button>
          <Button variant="outline">
            <Users className="w-4 h-4 mr-2" />
            View Events
          </Button>
          <Button variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            Payments
          </Button>
        </div>
      </Card>
    </div>
  );
}
