import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginMUI from "./pages/LoginMUI";
import RegisterMUI from "./pages/RegisterMUI";
import DashboardMUI from "./pages/DashboardMUI";
import VerifyEmail from "./pages/VerifyEmail";
import ApiKeysManagementMUI from "./pages/ApiKeysManagementMUI";
import AdminLogin from "./pages/AdminLogin";
import CompanyManagement from "./pages/CompanyManagement";
import UserManagement from "./pages/UserManagement";
import AdminDashboard from "./pages/AdminDashboard";
import TenantAdminDashboard from "./pages/TenantAdminDashboard";
import TenantUserDashboard from "./pages/TenantUserDashboard";
import PaymentLinksManagement from "./pages/PaymentLinksManagement";
import CreatePaymentLink from "./pages/CreatePaymentLink";
import PublicPaymentLink from "./pages/PublicPaymentLink";
import AuthCallback from "./pages/AuthCallback";
import TenantRequest from "./pages/TenantRequest";
import InvitationRegister from "./pages/InvitationRegister";
import AuditLogs from "./pages/AuditLogs";
import MessagingPage from "./pages/MessagingPage";
import { Homepage } from "./pages/Homepage";
import { useAuth } from "@/_core/hooks/useAuth";
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';

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
    if (!user) return Homepage;
    return DashboardMUI;
  };

  const DashboardComponent = getDashboard();

  return (
    <Switch>
      <Route path="/login" component={LoginMUI} />
      <Route path="/register" component={RegisterMUI} />
      <Route path="/tenant-request" component={TenantRequest} />
      <Route path="/invitation/:token" component={InvitationRegister} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/auth/callback" component={AuthCallback} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/companies" component={CompanyManagement} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      {/* User Routes */}
      <Route path="/" component={DashboardComponent} />
      <Route path="/dashboard" component={DashboardMUI} />
      <Route path="/api-keys" component={ApiKeysManagementMUI} />
      <Route path="/audit-logs" component={AuditLogs} />
      <Route path="/messaging" component={MessagingPage} />
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
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
