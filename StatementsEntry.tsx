import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Unlink } from "lucide-react";

export default function StatementsEntry() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statements Module</h1>
          <p className="text-muted-foreground mt-2">Upload and reconcile bank and mobile money statements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Upload</h3>
              <p className="text-sm text-muted-foreground">Upload statement file</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Matched</h3>
              <p className="text-sm text-muted-foreground">Reconciled transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Unlink className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Unmatched</h3>
              <p className="text-sm text-muted-foreground">Pending reconciliation</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">History</h3>
              <p className="text-sm text-muted-foreground">Statement history</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Upload className="w-4 h-4 mr-2" />
            Upload Statement
          </Button>
          <Button variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Matched
          </Button>
          <Button variant="outline">
            <Unlink className="w-4 h-4 mr-2" />
            Unmatched
          </Button>
        </div>
      </Card>
    </div>
  );
}
