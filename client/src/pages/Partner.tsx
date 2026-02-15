import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Package, Loader2, Eye, Search, Phone, Mail, Clock,
  ShoppingCart, ExternalLink, CheckCircle2, AlertTriangle,
  Plus, Box, DollarSign, Users, Truck, Store,
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

type PartnerProduct = {
  id: number;
  name: string;
  imageUrl: string;
  originalPrice: string;
  groupPrice: string;
  nowPrice?: string | null;
  stock: number;
  saleMode: string;
  category: string;
  approved: boolean;
  active: boolean;
  createdAt?: string | null;
};

type SaleOrder = {
  id: number;
  items: OrderItem[];
  total: string | number;
  status: string;
  fulfillmentType: string;
  createdAt?: string | null;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
};

type TabType = "produtos" | "vendas" | "pedidos" | "cadastrar";

export default function Partner() {
  const { data: user, isLoading: userLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("produtos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<PartnerOrder | null>(null);
  const [selectedSale, setSelectedSale] = useState<SaleOrder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isPartner = !!user && (user.role === "parceiro" || user.role === "admin");

  const { data: orders, isLoading: ordersLoading } = useQuery<PartnerOrder[]>({
    queryKey: ["/api/partner/orders"],
    enabled: isPartner,
  });

  const { data: pickupPoint } = useQuery<PickupPointInfo>({
    queryKey: ["/api/partner/pickup-point"],
    enabled: isPartner,
  });

  const { data: products, isLoading: productsLoading } = useQuery<PartnerProduct[]>({
    queryKey: ["/api/partner/products"],
    enabled: isPartner && user?.role === "parceiro",
  });

  const { data: sales, isLoading: salesLoading } = useQuery<SaleOrder[]>({
    queryKey: ["/api/partner/sales"],
    enabled: isPartner && user?.role === "parceiro",
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: isPartner,
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

  const approvedProducts = (products || []).filter(p => p.approved);
  const pendingProducts = (products || []).filter(p => !p.approved);
  const totalSalesValue = (sales || []).reduce((sum, s) => sum + Number(s.total), 0);

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = searchTerm === "" ||
      order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter ||
      (statusFilter === "pending" && (order.status === "recebido" || order.status === "em_separacao"));
    return matchesSearch && matchesStatus;
  });

  const statusCounts = (orders || []).reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pendingOrderCount = (statusCounts["recebido"] || 0) + (statusCounts["em_separacao"] || 0);
  const readyCount = statusCounts["pronto_retirada"] || 0;
  const completedCount = statusCounts["retirado"] || 0;

  const tabs: { key: TabType; label: string; icon: typeof Box }[] = [
    { key: "produtos", label: "Meus Produtos", icon: Box },
    { key: "vendas", label: "Vendas", icon: DollarSign },
    { key: "pedidos", label: "Pedidos Retirada", icon: Package },
    { key: "cadastrar", label: "Cadastrar Produto", icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-gradient border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-white" />
            <h1 className="text-lg font-bold font-display text-white">Painel Parceiro</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70 hidden sm:block">{user.name}</span>
            <Link href="/" className="text-sm font-medium text-white/80 flex items-center gap-1">
              Ver Loja <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {pickupPoint && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-foreground" data-testid="text-partner-pickup-name">{pickupPoint.name}</p>
                  <p className="text-xs text-muted-foreground">{pickupPoint.address} - {pickupPoint.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{approvedProducts.length}</p>
              <p className="text-xs text-muted-foreground">Produtos Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingProducts.length}</p>
              <p className="text-xs text-muted-foreground">Aguardando Aprovacao</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{(sales || []).length}</p>
              <p className="text-xs text-muted-foreground">Vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">R$ {totalSalesValue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Faturamento</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              className="flex items-center gap-1.5 whitespace-nowrap"
              onClick={() => setActiveTab(tab.key)}
              data-testid={`tab-partner-${tab.key}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </Button>
          ))}
        </div>

        {activeTab === "produtos" && (
          <ProductsTab
            products={products || []}
            isLoading={productsLoading}
          />
        )}

        {activeTab === "vendas" && (
          <SalesTab
            sales={sales || []}
            isLoading={salesLoading}
            products={products || []}
            selectedSale={selectedSale}
            setSelectedSale={setSelectedSale}
          />
        )}

        {activeTab === "pedidos" && (
          <OrdersTab
            orders={orders || []}
            filteredOrders={filteredOrders}
            isLoading={ordersLoading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            pendingOrderCount={pendingOrderCount}
            readyCount={readyCount}
            completedCount={completedCount}
          />
        )}

        {activeTab === "cadastrar" && (
          <CreateProductTab
            categories={categories || []}
            toast={toast}
            queryClient={queryClient}
          />
        )}
      </div>
    </div>
  );
}

function ProductsTab({ products, isLoading }: { products: PartnerProduct[]; isLoading: boolean }) {
  const approved = products.filter(p => p.approved);
  const pending = products.filter(p => !p.approved);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Aguardando Aprovacao ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pending.map(product => (
                <ProductCardItem key={product.id} product={product} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Produtos Aprovados ({approved.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum produto cadastrado ainda</p>
              <p className="text-xs mt-1">Use a aba "Cadastrar Produto" para adicionar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {approved.map(product => (
                <ProductCardItem key={product.id} product={product} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductCardItem({ product }: { product: PartnerProduct }) {
  return (
    <div className="flex gap-3 p-3 rounded-md border border-border" data-testid={`card-partner-product-${product.id}`}>
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
            R$ {Number(product.originalPrice).toFixed(2)}
          </span>
          {product.approved ? (
            <Badge variant="outline" className="text-[10px]">Aprovado</Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-[10px]">Pendente</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">Estoque: {product.stock}</p>
      </div>
    </div>
  );
}

function SalesTab({ sales, isLoading, products, selectedSale, setSelectedSale }: {
  sales: SaleOrder[];
  isLoading: boolean;
  products: PartnerProduct[];
  selectedSale: SaleOrder | null;
  setSelectedSale: (s: SaleOrder | null) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const productIds = new Set(products.map(p => p.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          Vendas dos Meus Produtos
          <Badge variant="outline">{sales.length} pedido(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma venda registrada ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Meus Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(sale => {
                  const myItems = (Array.isArray(sale.items) ? sale.items : []).filter(item => productIds.has(item.id));
                  const myTotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
                  const isPaid = sale.status === "retirado" || sale.status === "pronto_retirada" || sale.status === "em_separacao";
                  const canDeliver = sale.status === "pronto_retirada";
                  return (
                    <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                      <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{sale.buyerName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {sale.buyerPhone || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {myItems.map((item, idx) => (
                            <p key={idx} className="text-xs">{item.quantity}x {item.name}</p>
                          ))}
                          <p className="text-xs font-semibold mt-0.5">R$ {myTotal.toFixed(2)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={ORDER_STATUS_COLORS[sale.status] || ""}>
                          {ORDER_STATUS_LABELS[sale.status] || sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {isPaid ? (
                            <Badge variant="outline" className="text-[10px] text-green-700">Pago</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-yellow-700">Pendente</Badge>
                          )}
                          {canDeliver && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] block w-fit">
                              Pode Entregar
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-view-sale-${sale.id}`}
                          onClick={() => setSelectedSale(sale)}
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

      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Venda #{selectedSale?.id}</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50">
                <h4 className="font-semibold text-sm mb-2">Dados do Comprador</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedSale.buyerName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedSale.buyerEmail}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{selectedSale.buyerPhone || "N/A"}</span>
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Status</h4>
                <Badge className={ORDER_STATUS_COLORS[selectedSale.status] || ""}>
                  {ORDER_STATUS_LABELS[selectedSale.status] || selectedSale.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Itens do Pedido</h4>
                <div className="space-y-2">
                  {(Array.isArray(selectedSale.items) ? selectedSale.items : []).map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-md border border-border">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-md object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
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
                  R$ {Number(selectedSale.total).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function OrdersTab({
  orders, filteredOrders, isLoading, searchTerm, setSearchTerm,
  statusFilter, setStatusFilter, selectedOrder, setSelectedOrder,
  pendingOrderCount, readyCount, completedCount,
}: {
  orders: PartnerOrder[];
  filteredOrders: PartnerOrder[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  selectedOrder: PartnerOrder | null;
  setSelectedOrder: (o: PartnerOrder | null) => void;
  pendingOrderCount: number;
  readyCount: number;
  completedCount: number;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")} data-testid="card-partner-pending">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-yellow-100 dark:bg-yellow-900">
              <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{pendingOrderCount}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "pronto_retirada" ? "all" : "pronto_retirada")} data-testid="card-partner-ready">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-100 dark:bg-green-900">
              <Package className="w-4 h-4 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{readyCount}</p>
              <p className="text-xs text-muted-foreground">Prontos p/ Retirada</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setStatusFilter(statusFilter === "retirado" ? "all" : "retirado")} data-testid="card-partner-completed">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Retirados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="text-base">Pedidos do Ponto de Retirada</CardTitle>
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

          {isLoading ? (
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
    </>
  );
}

function CreateProductTab({ categories, toast, queryClient }: { categories: any[]; toast: any; queryClient: any }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    originalPrice: "",
    groupPrice: "",
    nowPrice: "",
    stock: "100",
    category: "",
    saleMode: "grupo",
    fulfillmentType: "pickup",
    brand: "",
    weight: "",
    dimensions: "",
    specifications: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const topCategories = categories.filter((c: any) => !c.parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim() || !formData.imageUrl.trim() || !formData.originalPrice || !formData.groupPrice || !formData.category) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatorios", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/partner/products", {
        ...formData,
        originalPrice: formData.originalPrice,
        groupPrice: formData.groupPrice,
        nowPrice: formData.nowPrice || undefined,
        stock: Number(formData.stock) || 100,
      });
      toast({ title: "Produto enviado!", description: "Seu produto foi enviado para aprovacao do administrador." });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/products"] });
      setFormData({
        name: "", description: "", imageUrl: "", originalPrice: "", groupPrice: "", nowPrice: "",
        stock: "100", category: "", saleMode: "grupo", fulfillmentType: "pickup",
        brand: "", weight: "", dimensions: "", specifications: "",
      });
    } catch (err: any) {
      const msg = err?.message || "Erro ao cadastrar produto";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Cadastrar Novo Produto
        </CardTitle>
        <p className="text-xs text-muted-foreground">O produto sera enviado para aprovacao do administrador antes de ficar visivel na loja.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Nome do Produto *</Label>
              <Input
                data-testid="input-partner-product-name"
                id="prod-name"
                value={formData.name}
                onChange={e => updateField("name", e.target.value)}
                placeholder="Ex: Camiseta Polo"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-category">Categoria *</Label>
              <select
                data-testid="select-partner-product-category"
                id="prod-category"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.category}
                onChange={e => updateField("category", e.target.value)}
                required
              >
                <option value="">Selecione...</option>
                {topCategories.map((c: any) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-desc">Descricao *</Label>
            <Textarea
              data-testid="input-partner-product-desc"
              id="prod-desc"
              value={formData.description}
              onChange={e => updateField("description", e.target.value)}
              placeholder="Descreva o produto..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prod-image">URL da Imagem *</Label>
            <Input
              data-testid="input-partner-product-image"
              id="prod-image"
              value={formData.imageUrl}
              onChange={e => updateField("imageUrl", e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Preco Original (R$) *</Label>
              <Input
                data-testid="input-partner-product-price"
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalPrice}
                onChange={e => updateField("originalPrice", e.target.value)}
                placeholder="99.90"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-group-price">Preco Grupo (R$) *</Label>
              <Input
                data-testid="input-partner-product-group-price"
                id="prod-group-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.groupPrice}
                onChange={e => updateField("groupPrice", e.target.value)}
                placeholder="79.90"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-stock">Estoque</Label>
              <Input
                data-testid="input-partner-product-stock"
                id="prod-stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={e => updateField("stock", e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sale-mode">Modo de Venda</Label>
              <select
                data-testid="select-partner-sale-mode"
                id="prod-sale-mode"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.saleMode}
                onChange={e => updateField("saleMode", e.target.value)}
              >
                <option value="grupo">Compra em Grupo</option>
                <option value="agora">Compre Agora</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-fulfillment">Tipo de Entrega</Label>
              <select
                data-testid="select-partner-fulfillment"
                id="prod-fulfillment"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.fulfillmentType}
                onChange={e => updateField("fulfillmentType", e.target.value)}
              >
                <option value="pickup">Retirada</option>
                <option value="delivery">Entrega</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-brand">Marca</Label>
              <Input
                data-testid="input-partner-product-brand"
                id="prod-brand"
                value={formData.brand}
                onChange={e => updateField("brand", e.target.value)}
                placeholder="Ex: Nike"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-weight">Peso</Label>
              <Input
                id="prod-weight"
                value={formData.weight}
                onChange={e => updateField("weight", e.target.value)}
                placeholder="Ex: 500g"
              />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full" data-testid="button-partner-submit-product">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Enviar para Aprovacao
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
