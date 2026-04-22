import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Users, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  finance: "bg-secondary/20 text-secondary",
  operations: "bg-amber-500/20 text-amber-500",
  user: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-secondary",
  rejected: "text-destructive",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });
}

interface ApprovalUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvalId?: number;
  rejectionReason?: string | null;
}

export default function UserApprovalPanel() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: usersData, isLoading, refetch } = trpc.admin?.getPendingUsers?.useQuery?.() ?? { data: [], isLoading: false, refetch: () => {} };

  const approveMutation = trpc.admin?.approveUser?.useMutation?.({
    onSuccess: (_, vars: any) => {
      toast.success("User approved successfully");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve user"),
  });

  const rejectMutation = trpc.admin?.rejectUser?.useMutation?.({
    onSuccess: () => {
      toast.success("User rejected");
      setRejectingId(null);
      setRejectReason("");
      refetch();
    },
    onError: (e: any) => toast.error(e.message || "Failed to reject user"),
  });

  const users: ApprovalUser[] = usersData ?? [];
  const filtered = filter === "all" ? users : users.filter(u => u.approvalStatus === filter);

  const pendingCount = users.filter(u => u.approvalStatus === "pending").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Users size={16} /> User Approvals
          </h2>
          {pendingCount > 0 && (
            <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-0.5 rounded-full font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(["pending", "approved", "rejected", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-muted-foreground">
            <Users size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No {filter === "all" ? "" : filter} users</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const StatusIcon = STATUS_ICON[u.approvalStatus];
            return (
              <Card key={u.id} className={u.approvalStatus === "pending" ? "border-amber-500/20" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {(u.name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{u.name || "Unnamed"}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                            {u.role}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${STATUS_COLORS[u.approvalStatus]}`}>
                            <StatusIcon size={11} /> {u.approvalStatus}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                        <p className="text-xs text-muted-foreground">Registered {formatDate(u.createdAt)}</p>
                        {u.approvalStatus === "rejected" && u.rejectionReason && (
                          <p className="text-xs text-destructive mt-0.5">Reason: {u.rejectionReason}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {u.approvalStatus === "pending" && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-secondary border-secondary/30 hover:bg-secondary/10 text-xs h-7 px-2"
                          onClick={() => approveMutation?.mutate?.({ userId: u.id })}
                          disabled={approveMutation?.isPending}
                        >
                          <CheckCircle size={12} className="mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-7 px-2"
                          onClick={() => { setRejectingId(u.id); setRejectReason(""); }}
                          disabled={rejectMutation?.isPending}
                        >
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Reject reason input */}
                  {rejectingId === u.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection (optional)"
                        className="flex-1 px-3 py-1.5 rounded-md border border-border bg-background text-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-7 px-2"
                        onClick={() => rejectMutation?.mutate?.({ userId: u.id, reason: rejectReason })}
                        disabled={rejectMutation?.isPending}
                      >
                        {rejectMutation?.isPending ? <Loader2 size={11} className="animate-spin" /> : "Confirm"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setRejectingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
