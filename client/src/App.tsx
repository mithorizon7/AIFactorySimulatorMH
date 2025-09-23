import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AIFactory from "@/pages/AIFactory";
import { SparkTest } from "@/pages/SparkTest";
import { ErrorBoundary } from "@/components/ErrorBoundary";
// GamePauseProvider is used within AIFactory component

function Router() {
  return (
    <Switch>
      <Route path="/" component={AIFactory} />
      <Route path="/spark-test" component={SparkTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
