import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
