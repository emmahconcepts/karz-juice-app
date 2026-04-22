import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard, LogOut, PanelLeft, ShoppingCart, Cake, DollarSign,
  AlertCircle, Wrench, Truck, Package, Receipt, FileText, BarChart3,
  Settings, Gift, CreditCard, TrendingDown, Smartphone, Printer, Bell,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";

const menuItems = [
  // ── Core ─────────────────────────────────────────────────────────────────
  { icon: LayoutDashboard, label: "Dashboard",          path: "/",                    group: "core" },
  { icon: ShoppingCart,   label: "Sales",               path: "/sales",               group: "core" },
  { icon: Cake,           label: "Functions",           path: "/functions",           group: "core" },
  { icon: DollarSign,     label: "Accounts",            path: "/accounts",            group: "core" },
  { icon: AlertCircle,    label: "Expenses",            path: "/expenses",            group: "core" },
  // ── Operations ───────────────────────────────────────────────────────────
  { icon: Wrench,         label: "Machine Hire",        path: "/machine-hire",        group: "ops" },
  { icon: Truck,          label: "Vehicle Hire",        path: "/vehicle-hire",        group: "ops" },
  { icon: Package,        label: "Products",            path: "/products",            group: "ops" },
  { icon: Gift,           label: "Packages",            path: "/packages",            group: "ops" },
  // ── Intelligence ─────────────────────────────────────────────────────────
  { icon: Receipt,        label: "Receipts (OCR)",      path: "/receipts",            group: "intel" },
  { icon: CreditCard,     label: "Client Receipts",     path: "/client-receipts",     group: "intel" },
  { icon: Printer,        label: "Receipt Printing",    path: "/receipt-printing",    group: "intel" },
  { icon: FileText,       label: "Statements",          path: "/statements",          group: "intel" },
  { icon: BarChart3,      label: "Reports",             path: "/reports",             group: "intel" },
  // ── Finance ───────────────────────────────────────────────────────────────
  { icon: DollarSign,     label: "Receivables",         path: "/receivables",         group: "finance" },
  { icon: DollarSign,     label: "Payables",            path: "/payables",            group: "finance" },
  { icon: TrendingDown,   label: "Drawings",            path: "/drawings",            group: "finance", adminOnly: true },
  { icon: DollarSign,     label: "Custom Accounts",     path: "/custom-accounts",     group: "finance", adminOnly: true },
  // ── Payments ──────────────────────────────────────────────────────────────
  { icon: Smartphone,     label: "MTN Mobile Money",    path: "/mtn",                 group: "payments" },
  { icon: CreditCard,     label: "PesaPal Payment",     path: "/pesapal-payment",     group: "payments" },
  // ── System ────────────────────────────────────────────────────────────────
  { icon: Bell,           label: "Notifications",       path: "/notification-settings", group: "system" },
  { icon: Settings,       label: "Admin",               path: "/admin",               group: "system", adminOnly: true },
];

const GROUP_LABELS: Record<string, string> = {
  core: "Core", ops: "Operations", intel: "Intelligence",
  finance: "Finance", payments: "Payments", system: "System",
};

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold tracking-tight text-center">Sign in to continue</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (w: number) => void }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const onUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const visibleItems = menuItems.filter(item =>
    !item.adminOnly || user?.role === "admin" || user?.role === "finance"
  );

  // Group items
  const groups = ["core", "ops", "intel", "finance", "payments", "system"];

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-14 justify-center">
            <div className="flex items-center gap-3 px-2 w-full">
              <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors shrink-0" aria-label="Toggle navigation">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: "linear-gradient(135deg, #FF9800, #0B6623)" }}>KJ</div>
                  <span className="font-bold tracking-tight truncate text-sm">Karz Juice</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {groups.map(group => {
              const items = visibleItems.filter(i => i.group === group);
              if (!items.length) return null;
              return (
                <div key={group}>
                  {!isCollapsed && (
                    <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {GROUP_LABELS[group]}
                    </div>
                  )}
                  <SidebarMenu className="px-2 pb-1">
                    {items.map(item => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-9 transition-all font-normal">
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </div>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || "—"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /><span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {!isCollapsed && (
          <div className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors" onMouseDown={() => setIsResizing(true)} style={{ zIndex: 50 }} />
        )}
      </div>

      <SidebarInset>
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 gap-3">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <span className="text-sm text-muted-foreground hidden sm:block">{activeMenuItem?.label ?? ""}</span>
          </div>
          <div className="flex-1 flex justify-end max-w-sm ml-auto">
            <GlobalSearch />
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
