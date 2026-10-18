import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import { HealthProfileProvider } from "@/components/health/HealthProfileContext";

const DiseaseMap = lazy(() => import("./pages/DiseaseMap"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Predictive = lazy(() => import("./pages/Predictive"));
const Compare = lazy(() => import("./pages/Compare"));
const WhatIf = lazy(() => import("./pages/WhatIf"));
const Reporter = lazy(() => import("./pages/Reporter"));
const GovPortal = lazy(() => import("./pages/GovPortal"));
const HealthAssistant = lazy(() => import("./pages/HealthAssistant"));
const HealthPortal = lazy(() => import("./pages/HealthPortal"));
const HealthProfile = lazy(() => import("./pages/HealthProfile"));
const HealthSchemes = lazy(() => import("./pages/HealthSchemes"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("EpidemAI page failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
        <section role="alert" className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Page error</p>
          <h1 className="mt-2 text-2xl font-bold">This page could not be displayed</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">The rest of EpidemAI is still available. Reload this page, or return to the home screen. If the issue continues, share the technical detail below.</p>
          <details className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-semibold">Technical detail</summary><pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre></details>
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Reload page</button><a href="/" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-secondary">Return home</a></div>
        </section>
      </main>;
    }
    return this.props.children;
  }
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const animation = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.22, ease: "easeOut" } };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} {...animation}>
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/disease-map" element={<DiseaseMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/predictive" element={<Predictive />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/what-if" element={<WhatIf />} />
          <Route path="/reporter" element={<Reporter />} />
          <Route path="/gov-portal" element={<GovPortal />} />
          <Route path="/health-portal" element={<HealthPortal />} />
          <Route path="/health-profile" element={<HealthProfile />} />
          <Route path="/health-schemes" element={<HealthSchemes />} />
          <Route path="/health-assistant" element={<HealthAssistant />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background"><div className="text-muted-foreground">Loading…</div></div>}>
          <AppErrorBoundary><HealthProfileProvider><AnimatedRoutes /></HealthProfileProvider></AppErrorBoundary>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
