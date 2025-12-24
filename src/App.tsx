import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
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
import ApiKeyManagementPage from "./pages/ApiKeyManagementPage";
import { Homepage } from "./pages/Homepage";
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/landing" component={LandingPage} />
      <Route path="/login" component={LoginMUI} />
      <Route path="/register" component={RegisterMUI} />
      <Route path="/dashboard" component={() => <ProtectedRoute><DashboardMUI /></ProtectedRoute>} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/api-keys" component={ApiKeyManagementPage} />
      <Route path="/api-keys-old" component={ApiKeysManagementMUI} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/tenant-admin/dashboard" component={TenantAdminDashboard} />
      <Route path="/tenant-user/dashboard" component={TenantUserDashboard} />
      <Route path="/company" component={CompanyManagement} />
      <Route path="/users" component={UserManagement} />
      <Route path="/payment-links" component={PaymentLinksManagement} />
      <Route path="/payment-links/create" component={CreatePaymentLink} />
      <Route path="/payment/:id" component={PublicPaymentLink} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/tenant-request" component={TenantRequest} />
      <Route path="/invitation/:token" component={InvitationRegister} />
      <Route path="/audit-logs" component={AuditLogs} />
      <Route path="/messaging" component={MessagingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </MuiThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
