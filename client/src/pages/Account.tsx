import { useState, useEffect } from "react";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, ShoppingBag, UserCircle, Loader2, Package, LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AccountTab = "groups" | "orders" | "profile";

const STATUS_LABELS: Record<string, string> = {
  recebido: "Recebido",
  processando: "Processando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  aberto: "Aberto",
  fechado: "Fechado",
  pendente: "Pendente",
  pago: "Pago",
  nenhuma: "N/A",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "aberto":
    case "processando":
      return "default";
    case "fechado":
    case "entregue":
    case "pago":
      return "secondary";
    case "cancelado":
      return "destructive";
    default:
      return "outline";
  }
}

export default function Account() {
  const { data: user, isLoading: authLoading } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AccountTab>("groups");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileInitialized, setProfileInitialized] = useState(false);

  useEffect(() => {
    if (!profileInitialized && user) {
      setProfileName(user.name || "");
      setProfilePhone((user as any).phone || "");
      setProfileInitialized(true);
    }
  }, [user, profileInitialized]);

  const { data: userGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/user/groups"],
    queryFn: async () => {
      const res = await fetch("/api/user/groups", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Perfil atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel atualizar o perfil", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login?redirect=/minha-conta");
    return null;
  }

  const tabs: { key: AccountTab; label: string; icon: any }[] = [
    { key: "groups", label: "Meus Grupos", icon: Users },
    { key: "orders", label: "Meus Pedidos", icon: Package },
    { key: "profile", label: "Meus Dados", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-gradient border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/" data-testid="link-account-logo">
              <BrandLogo variant="header" />
            </Link>
            <h1 className="text-lg font-bold font-display text-white">Minha Conta</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs hidden sm:inline">{user.name}</span>
            <Button
              data-testid="button-logout-account"
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => {
                logout.mutate();
                setLocation("/");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {tabs.map((t) => (
            <Button
              key={t.key}
              data-testid={`tab-${t.key}`}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              <t.icon className="w-4 h-4 mr-1.5" />
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "groups" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Meus Grupos</h2>
            {groupsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !userGroups || userGroups.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Voce ainda nao participa de nenhum grupo.</p>
                  <Link href="/">
                    <Button size="sm" className="mt-3">Ver produtos</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              (userGroups as any[]).map((g: any) => (
                <Card key={g.memberId} data-testid={`card-user-group-${g.groupId}`}>
                  <CardContent className="p-3 flex gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                      <img
                        src={g.productImageUrl || "https://via.placeholder.com/64"}
                        alt={g.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/64"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight truncate">{g.productName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Grupo #{g.groupId} - {g.currentPeople}/{g.minPeople} participantes
                      </p>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        R$ {Number(g.groupPrice).toFixed(2)}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <Badge variant={statusVariant(g.status)} className="text-[10px]">
                          {STATUS_LABELS[g.status] || g.status}
                        </Badge>
                        {g.reserveStatus && g.reserveStatus !== "nenhuma" && (
                          <Badge variant={g.reserveStatus === "pago" ? "secondary" : "outline"} className="text-[10px]">
                            Taxa: {STATUS_LABELS[g.reserveStatus] || g.reserveStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Meus Pedidos</h2>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !userOrders || userOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Voce ainda nao fez nenhum pedido.</p>
                  <Link href="/">
                    <Button size="sm" className="mt-3">Ir as compras</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              (userOrders as any[]).map((order: any) => {
                const items = Array.isArray(order.items) ? order.items : [];
                return (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                      <CardTitle className="text-sm">
                        Pedido #{order.id}
                      </CardTitle>
                      <Badge variant={statusVariant(order.status)} className="text-[10px]">
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="truncate mr-2">{item.name} x{item.qty}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              R$ {(Number(item.price) * item.qty).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : ""}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          R$ {Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Meus Dados</h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input
                    data-testid="input-profile-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    data-testid="input-profile-phone"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(75) 99999-9999"
                  />
                </div>
                <Button
                  data-testid="button-save-profile"
                  onClick={() => updateProfile.mutate({ name: profileName.trim(), phone: profilePhone.trim() })}
                  disabled={updateProfile.isPending}
                  className="w-full"
                >
                  {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  Salvar Alteracoes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
