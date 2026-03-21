import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DealDetail from "./pages/DealDetail";
import Stakeholders from "./pages/Stakeholders";
import Transcripts from "./pages/Transcripts";
import AskMeridian from "./pages/AskMeridian";
import KnowledgeBase from "./pages/KnowledgeBase";
import AppLayout from "./components/AppLayout";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/deal/:id">
        <ProtectedRoute component={DealDetail} />
      </Route>
      <Route path="/stakeholders">
        <ProtectedRoute component={Stakeholders} />
      </Route>
      <Route path="/transcripts">
        <ProtectedRoute component={Transcripts} />
      </Route>
      <Route path="/ask">
        <ProtectedRoute component={AskMeridian} />
      </Route>
      <Route path="/knowledge">
        <ProtectedRoute component={KnowledgeBase} />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
