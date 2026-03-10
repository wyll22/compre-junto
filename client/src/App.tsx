import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, memo, lazy, Suspense } from "react";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const Admin = lazy(() => import("@/pages/Admin"));
const Cart = lazy(() => import("@/pages/Cart"));
const Login = lazy(() => import("@/pages/Login"));
const Account = lazy(() => import("@/pages/Account"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Termos = lazy(() => import("@/pages/Termos"));
const TrocasReembolsos = lazy(() => import("@/pages/TrocasReembolsos"));
const Entregas = lazy(() => import("@/pages/Entregas"));
const Contato = lazy(() => import("@/pages/Contato"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const BlogList = lazy(() => import("@/pages/Blog").then((module) => ({ default: module.BlogList })));
const BlogPost = lazy(() => import("@/pages/Blog").then((module) => ({ default: module.BlogPost })));
const Partner = lazy(() => import("@/pages/Partner"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((module) => ({ default: module.Toaster })),
);
const WhatsAppFloat = lazy(() => import("@/components/WhatsAppFloat"));
const HelpFloat = lazy(() => import("@/components/help/HelpFloat"));

function getVisitorId() {
  let id = localStorage.getItem("cjf_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cjf_visitor_id", id);
  }
  return id;
}

const VisitTracker = memo(function VisitTracker() {
  const [location] = useLocation();
  const lastTracked = useRef("");

  useEffect(() => {
    if (location === lastTracked.current) return;
    lastTracked.current = location;

    const timer = setTimeout(() => {
      const visitorId = getVisitorId();
      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, page: location, referrer: document.referrer || "" }),
        credentials: "include",
      }).catch(() => {});
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  return null;
});

function Router() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" aria-live="polite" />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/admin" component={Admin} />
        <Route path="/checkout" component={Cart} />
        <Route path="/carrinho" component={Cart} />
        <Route path="/login" component={Login} />
        <Route path="/cadastro" component={Login} />
        <Route path="/register" component={Login} />
        <Route path="/produto/:id" component={ProductDetail} />
        <Route path="/minha-conta" component={Account} />
        <Route path="/privacidade" component={Privacidade} />
        <Route path="/termos" component={Termos} />
        <Route path="/trocas-e-reembolsos" component={TrocasReembolsos} />
        <Route path="/entregas" component={Entregas} />
        <Route path="/contato" component={Contato} />
        <Route path="/blog" component={BlogList} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/parceiro" component={Partner} />
        <Route path="/notificacoes" component={Notifications} />
        <Route path="/grupos" component={Home} />
        <Route path="/compre-agora" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisitTracker />
        <Router />
        <Suspense fallback={null}>
          <Toaster />
          <WhatsAppFloat />
          <HelpFloat />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
