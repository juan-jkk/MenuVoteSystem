// Integration with javascript_log_in_with_replit blueprint
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginForm from "@/components/LoginForm";
import Header from "@/components/Header";
import StudentDashboard from "@/components/StudentDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

function Router({ user }: { user: User }) {
  return (
    <Switch>
      <Route path="/">
        {user.role === 'staff' ? (
          <AdminDashboard />
        ) : (
          <StudentDashboard userShift={user.shift || 'morning'} />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.email || 'User';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Header 
          user={{
            name: displayName,
            role: user.role as 'staff' | 'student',
            shift: user.shift as 'morning' | 'afternoon' | 'full-time' | undefined
          }} 
          onLogout={handleLogout} 
        />
        <ThemeToggle />
      </div>
      <main>
        <Router user={user} />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
