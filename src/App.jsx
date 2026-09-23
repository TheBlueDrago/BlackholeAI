import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Splash from '@/components/Splash';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Billing from '@/pages/Billing';
import ThankYou from '@/pages/ThankYou';
import Plans from '@/pages/Plans';
import PromoSuccess from '@/pages/PromoSuccess';
import SiteView from '@/pages/SiteView';
import Buy from '@/pages/Buy';
import Report from '@/pages/Report';
import { Terms, Privacy } from '@/pages/Legal';
import Showcase from '@/pages/Showcase';
import { captureReferral } from '@/lib/referral';

// Remember an invite code (?ref=) from whatever page the link opened.
captureReferral();
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import { WorkspaceShell, ChatWorkspace, CodeWorkspace } from '@/components/WorkspaceShell';
import DesignerWorkspace from '@/components/DesignerWorkspace';
import DesignerDashboard from '@/pages/chat/DesignerDashboard';
import { PlansView, MonitorView, PromosView, SettingsView } from '@/pages/chat/Views';
import GamesFront from '@/pages/chat/GamesFront';
import GamesDesignerWorkspace from '@/components/GamesDesignerWorkspace';
import GameView from '@/pages/chat/GameView';
import BlackholeBrowser from '@/pages/chat/BlackholeBrowser';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route path="/ThankYou" element={<ThankYou />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/site/:name" element={<SiteView />} />
      <Route path="/buy" element={<Buy />} />
      <Route path="/report" element={<Report />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/showcase" element={<Showcase />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/chat" element={<Chat />}>
          <Route element={<WorkspaceShell />}>
            <Route index element={<ChatWorkspace />} />
            <Route path="code" element={<CodeWorkspace />} />
          </Route>
          <Route path="designer" element={<DesignerDashboard />} />
          <Route path="designer/build" element={<DesignerWorkspace />} />
          <Route path="browser" element={<BlackholeBrowser />} />
          <Route path="games" element={<GamesFront />} />
          <Route path="game-designer" element={<GamesDesignerWorkspace />} />
          <Route path="game/:name" element={<GameView />} />
          <Route path="plans" element={<PlansView />} />
          <Route path="monitor" element={<MonitorView />} />
          <Route path="promos" element={<PromosView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
        <Route path="/billing" element={<Billing />} />
        <Route path="/promo-success" element={<PromoSuccess />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Splash />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App