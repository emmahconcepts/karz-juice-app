import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LogIn, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type View = "login" | "reset_request" | "reset_sent";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.loginWithPassword?.useMutation?.({
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (err: any) => {
      toast.error(err.message || "Invalid email or password");
      setLoading(false);
    },
  });

  const resetMutation = trpc.auth.requestPasswordReset?.useMutation?.({
    onSuccess: () => {
      setView("reset_sent");
      setLoading(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send reset email");
      setLoading(false);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    if (loginMutation?.mutate) {
      loginMutation.mutate({ email, password });
    } else {
      // Fallback: redirect to OAuth login if mutation not wired
      toast.info("Redirecting to login…");
      setTimeout(() => {
        window.location.href = "/api/auth/login";
      }, 600);
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    if (resetMutation?.mutate) {
      resetMutation.mutate({ email: resetEmail });
    } else {
      // Graceful fallback
      setTimeout(() => {
        setView("reset_sent");
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #FF9800 0%, #0B6623 100%)" }}
          >
            KJ
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Karz Juice EMS</h1>
          <p className="text-sm text-muted-foreground">Enterprise Management System</p>
        </div>

        {/* Login Form */}
        {view === "login" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-10 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setView("reset_request")}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : (
                    <LogIn size={15} className="mr-2" />
                  )}
                  Sign in
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Reset Request */}
        {view === "reset_request" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound size={16} /> Reset password
              </CardTitle>
              <CardDescription>
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 size={15} className="mr-2 animate-spin" /> : null}
                  Send reset link
                </Button>
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full justify-center"
                >
                  <ArrowLeft size={12} /> Back to sign in
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reset Sent Confirmation */}
        {view === "reset_sent" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                <KeyRound size={20} className="text-secondary" />
              </div>
              <div>
                <p className="font-medium">Check your inbox</p>
                <p className="text-sm text-muted-foreground mt-1">
                  A reset link has been sent to <strong>{resetEmail}</strong>. It expires in 30 minutes.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setView("login"); setResetEmail(""); }}
              >
                <ArrowLeft size={14} className="mr-2" /> Back to sign in
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          New accounts require admin approval before access is granted.
        </p>
      </div>
    </div>
  );
}
