import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import TenantAdminDashboard from "./pages/TenantAdminDashboard";
import TenantUserDashboard from "./pages/TenantUserDashboard";
import PaymentLinksManagement from "./pages/PaymentLinksManagement";
import CreatePaymentLink from "./pages/CreatePaymentLink";
import PublicPaymentLink from "./pages/PublicPaymentLink";
import { useAuth } from "@/_core/hooks/useAuth";

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getDashboard = () => {
    if (!user) return LandingPage;
    // Backend'den gelen user role'üne göre dashboard seç
    // Şimdilik basit bir dashboard döndür
    return TenantUserDashboard;
  };

  const DashboardComponent = getDashboard();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={DashboardComponent} />
      <Route path="/dashboard" component={DashboardComponent} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/payment-links" component={PaymentLinksManagement} />
      <Route path="/create-payment-link" component={CreatePaymentLink} />
      <Route path="/pay/:slug" component={PublicPaymentLink} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
