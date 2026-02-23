import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useRef, memo } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import Cart from "@/pages/Cart";
import Login from "@/pages/Login";
import Account from "@/pages/Account";
import Privacidade from "@/pages/Privacidade";
import Termos from "@/pages/Termos";
import TrocasReembolsos from "@/pages/TrocasReembolsos";
import Entregas from "@/pages/Entregas";
import Contato from "@/pages/Contato";
import ProductDetail from "@/pages/ProductDetail";
import { BlogList, BlogPost } from "@/pages/Blog";
import Partner from "@/pages/Partner";

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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/carrinho" component={Cart} />
      <Route path="/login" component={Login} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <VisitTracker />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
