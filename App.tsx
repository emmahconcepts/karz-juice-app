import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard            from "./pages/Dashboard";
import Sales                from "./pages/Sales";
import FunctionsModule      from "./pages/FunctionsModule";
import AccountsModule       from "./pages/AccountsModule";
import ExpensesModule       from "./pages/ExpensesModule";
import MachineHireModule    from "./pages/MachineHireModule";
import VehicleHireModule    from "./pages/VehicleHireModule";
import OCRModule            from "./pages/OCRModule";
import StatementsModule     from "./pages/StatementsModule";
import ProductsModule       from "./pages/ProductsModule";
import ReportsModule        from "./pages/ReportsModule";
import AdminDashboard       from "./pages/AdminDashboard";
import ReceivablesModule    from "./pages/ReceivablesModule";
import PayablesModule       from "./pages/PayablesModule";
import CustomAccountsModule from "./pages/CustomAccountsModule";
import MtnDashboard          from "./pages/MtnDashboard";
import { NotificationSettings } from "./pages/NotificationSettings";
import ReceiptPrinting       from "./pages/ReceiptPrinting";
import PesapalPayment        from "./pages/PesapalPayment";
import { CustomerPortal }    from "./pages/CustomerPortal";
import { ReceiptScanner }    from "./pages/ReceiptScanner";
import LoginPage              from "./pages/LoginPage";
import PackagesModule         from "./pages/PackagesModule";
import ClientReceiptsModule   from "./pages/ClientReceiptsModule";
import ReceiptVerifyPage      from "./pages/ReceiptVerifyPage";
import DrawingsAccountModule  from "./pages/DrawingsAccountModule";
import EcommerceLanding       from "./pages/EcommerceLanding";

function DashboardRouter() {
  return (
    <Switch>
      <Route path="/"                      component={Dashboard} />
      <Route path="/sales"                 component={Sales} />
      <Route path="/functions"             component={FunctionsModule} />
      <Route path="/accounts"              component={AccountsModule} />
      <Route path="/expenses"              component={ExpensesModule} />
      <Route path="/machine-hire"          component={MachineHireModule} />
      <Route path="/vehicle-hire"          component={VehicleHireModule} />
      <Route path="/receipts"              component={OCRModule} />
      <Route path="/statements"            component={StatementsModule} />
      <Route path="/products"              component={ProductsModule} />
      <Route path="/reports"               component={ReportsModule} />
      <Route path="/receivables"           component={ReceivablesModule} />
      <Route path="/payables"              component={PayablesModule} />
      <Route path="/custom-accounts"       component={CustomAccountsModule} />
      <Route path="/admin"                 component={AdminDashboard} />
      <Route path="/packages"              component={PackagesModule} />
      <Route path="/client-receipts"       component={ClientReceiptsModule} />
      <Route path="/drawings"              component={DrawingsAccountModule} />
      <Route path="/mtn"                   component={MtnDashboard} />
      <Route path="/receipt-printing"      component={ReceiptPrinting} />
      <Route path="/pesapal-payment"       component={PesapalPayment} />
      <Route path="/notification-settings" component={NotificationSettings} />
      <Route path="/404"                   component={NotFound} />
      <Route                               component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  if (pathname === "/login")              return <LoginPage />;
  if (pathname === "/shop" || pathname.startsWith("/shop")) return <EcommerceLanding />;
  if (pathname.startsWith("/verify/"))   return <ReceiptVerifyPage />;
  if (pathname.startsWith("/receipt/"))  return <CustomerPortal />;
  if (pathname === "/scan")              return <ReceiptScanner />;
  return (
    <DashboardLayout>
      <DashboardRouter />
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router>
            <AppContent />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
