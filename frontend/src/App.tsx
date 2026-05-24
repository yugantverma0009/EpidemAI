import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";

const DiseaseMap = lazy(() => import("./pages/DiseaseMap"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Predictive = lazy(() => import("./pages/Predictive"));
const Compare = lazy(() => import("./pages/Compare"));
const WhatIf = lazy(() => import("./pages/WhatIf"));
const Reporter = lazy(() => import("./pages/Reporter"));
const GovPortal = lazy(() => import("./pages/GovPortal"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
            <Route path="/compare" element={<Compare />} />
            <Route path="/what-if" element={<WhatIf />} />
            <Route path="/reporter" element={<Reporter />} />
            <Route path="/gov-portal" element={<GovPortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
