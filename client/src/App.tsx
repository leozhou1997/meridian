import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DealDetail from "./pages/DealDetail";
import Stakeholders from "./pages/Stakeholders";
import Transcripts from "./pages/Transcripts";
import AskMeridian from "./pages/AskMeridian";
import KnowledgeBase from "./pages/KnowledgeBase";
import AdminPlayground from "./pages/AdminPlayground";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NewDeal from "./pages/NewDeal";
import Deals from "./pages/Deals";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { LanguageProvider } from "./contexts/LanguageContext";

function ProtectedRoute({ component: Component, fullScreen = false }: { component: React.ComponentType; fullScreen?: boolean }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (fullScreen) {
    return <Component />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

/* Home route: Landing for guests, Dashboard for authenticated users */
function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

/* Scroll to top on route change */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={HomeRoute} />
      {/* Keep /landing as an explicit route so it's always accessible */}
      <Route path="/landing" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/deals">
        <ProtectedRoute component={Deals} />
      </Route>
      <Route path="/deal/new">
        <ProtectedRoute component={NewDeal} fullScreen />
      </Route>
      <Route path="/deal/:id">
        <ProtectedRoute component={DealDetail} />
      </Route>
      <Route path="/stakeholders">
        <ProtectedRoute component={Stakeholders} />
      </Route>
      <Route path="/deal-room">
        <ProtectedRoute component={Transcripts} />
      </Route>
      {/* Redirect old route */}
      <Route path="/transcripts">
        <Redirect to="/deal-room" />
      </Route>
      <Route path="/ask">
        <ProtectedRoute component={AskMeridian} />
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute component={KnowledgeBase} />
      </Route>
      <Route path="/admin/playground">
        <ProtectedRoute component={AdminPlayground} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute component={Onboarding} fullScreen />
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
