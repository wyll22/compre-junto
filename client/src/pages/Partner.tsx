import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "wouter";
import {
  MapPin, Package, Users, Loader2, Eye, Search, Phone, Mail, Clock,
  ShoppingCart, ExternalLink, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { useState } from "react";

const ORDER_STATUS_LABELS: Record<string, string> = {
  recebido: "Recebido",
  em_separacao: "Em Separacao",
  pronto_retirada: "Pronto p/ Retirada",
  retirado: "Retirado",
  nao_retirado: "Nao Retirado",
  cancelado: "Cancelado",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  recebido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_separacao: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pronto_retirada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  retirado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  nao_retirado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
};

type PartnerOrder = {
  id: number;
  userId: number;
  items: OrderItem[];
  total: string | number;
  status: string;
  fulfillmentType: string;
  pickupPointId: number | null;
  statusChangedAt?: string | null;
  pickupDeadline?: string | null;
  createdAt?: string | null;
  userName: string;
  userEmail: string;
  userPhone: string | null;
};

type PickupPointInfo = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  hours: string | null;
};

export default function Partner() {
  const { data: user, isLoading: userLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<PartnerOrder | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery<PartnerOrder[]>({
    queryKey: ["/api/partner/orders"],
    enabled: !!user && (user.role === "parceiro" || user.role === "admin"),
  });

  const { data: pickupPoint } = useQuery<PickupPointInfo>({
    queryKey: ["/api/partner/pickup-point"],
    enabled: !!user && (user.role === "parceiro" || user.role === "admin"),
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || (user.role !== "parceiro" && user.role !== "admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="w-12 h-12 text-yellow-500" />
        <h1 className="text-xl font-bold text-foreground">Acesso Restrito</h1>
        <p className="text-muted-foreground text-center">
          Esta area e exclusiva para parceiros. Faca login com sua conta de parceiro.
        </p>
        <Link href="/login">
          <Button data-testid="link-partner-login">Fazer Login</Button>
        </Link>
      </div>
    );
  }

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = searchTerm === "" ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = (orders || []).reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pendingCount = (statusCounts["recebido"] || 0) + (statusCounts["em_separacao"] || 0);
  const readyCount = statusCounts["pronto_retirada"] || 0;
  const completedCount = statusCounts["retirado"] || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" data-testid="link-partner-logo">
              <BrandLogo size="header" />
            </Link>
            <h1 className="text-lg font-bold font-display text-white">Painel Parceiro</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-white/80 flex items-center gap-1">
            Ver Loja <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {pickupPoint && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <MapPin className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <h2 className="font-bold text-foreground" data-testid="text-partner-pickup-name">{pickupPoint.name}</h2>
                  <p className="text-sm text-muted-foreground">{pickupPoint.address} - {pickupPoint.city}</p>
                  {pickupPoint.hours && <p className="text-xs text-muted-foreground">Horario: {pickupPoint.hours}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")} data-testid="card-partner-pending">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "pronto_retirada" ? "all" : "pronto_retirada")} data-testid="card-partner-ready">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
                <Package className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{readyCount}</p>
                <p className="text-sm text-muted-foreground">Prontos p/ Retirada</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "retirado" ? "all" : "retirado")} data-testid="card-partner-completed">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Retirados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-lg">Pedidos do Ponto de Retirada</CardTitle>
            <Badge variant="outline">{filteredOrders.length} pedido(s)</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-partner-search"
                  placeholder="Buscar por nome, email ou pedido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                data-testid="select-partner-status-filter"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const items = Array.isArray(order.items) ? order.items : [];
                      return (
                        <TableRow key={order.id} data-testid={`row-partner-order-${order.id}`}>
                          <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm" data-testid={`text-order-customer-${order.id}`}>{order.userName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {order.userPhone || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{items.length} item(ns)</span>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            R$ {Number(order.total).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className={ORDER_STATUS_COLORS[order.status] || ""} data-testid={`badge-order-status-${order.id}`}>
                              {ORDER_STATUS_LABELS[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              data-testid={`button-view-order-${order.id}`}
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <h4 className="font-semibold text-sm mb-2">Dados do Cliente</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span data-testid="text-order-detail-name">{selectedOrder.userName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedOrder.userEmail}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedOrder.userPhone || "N/A"}</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Status</h4>
                <Badge className={ORDER_STATUS_COLORS[selectedOrder.status] || ""}>
                  {ORDER_STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                </Badge>
                {selectedOrder.pickupDeadline && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prazo retirada: {new Date(selectedOrder.pickupDeadline).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Itens do Pedido</h4>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-md border border-border">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-md object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-order-item-${idx}`}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  R$ {Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Pedido realizado em: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("pt-BR") : "-"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
