import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AIFactory from "@/pages/AIFactory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const SparkTest = lazy(() =>
  import("@/pages/SparkTest").then((module) => ({ default: module.SparkTest })),
);
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
      <a href="#main-content" className="skip-link">
        Skip to lab content
      </a>
      <Suspense
        fallback={
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-screen bg-gray-950 p-8 text-white"
          >
            <p role="status">Opening this page…</p>
          </main>
        }
      >
        <Router />
      </Suspense>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
