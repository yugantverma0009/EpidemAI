import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";

const DiseaseMap = lazy(() => import("./pages/DiseaseMap.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Alerts = lazy(() => import("./pages/Alerts.tsx"));
const Predictive = lazy(() => import("./pages/Predictive.tsx"));
const Solutions = lazy(() => import("./pages/Solutions.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background"><div className="text-muted-foreground">Loading…</div></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/disease-map" element={<DiseaseMap />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/predictive" element={<Predictive />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
