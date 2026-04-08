import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AppSidebar } from "./components/AppSidebar";
import { Dashboard } from "./pages/Dashboard";
import { NeoTracker } from "./pages/NeoTracker";
import { ObjectCatalog } from "./pages/ObjectCatalog";
import { ImageExplorer } from "./pages/ImageExplorer";
import { Toaster } from "@/components/ui/toaster";

function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <div className="text-center">
        <div className="font-display text-6xl text-muted-foreground mb-4">404</div>
        <div className="font-mono text-xs text-muted-foreground">SECTOR NOT FOUND</div>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Router hook={useHashLocation}>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/neo-tracker" component={NeoTracker} />
            <Route path="/catalog" component={ObjectCatalog} />
            <Route path="/images" component={ImageExplorer} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  );
}
