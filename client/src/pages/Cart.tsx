import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, LogIn, Loader2, CheckCircle, MapPin, Truck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseApiError } from "@/lib/error-utils";
import { Footer } from "@/components/Footer";

interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  price: string | number;
  qty: number;
  fulfillmentType?: string;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [orderFulfillment, setOrderFulfillment] = useState<string | null>(null);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState<number | null>(null);
  const { data: user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedCart = localStorage.getItem("fsa_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("fsa_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const updateQty = (productId: number, delta: number) => {
    const newCart = cart.map((item) => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeItem = (productId: number) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    saveCart(newCart);
  };

  const total = cart.reduce((acc, item) => acc + Number(item.price) * item.qty, 0);

  const fulfillmentTypes = useMemo(() => {
    const types = new Set(cart.map((item) => item.fulfillmentType || "delivery"));
    return types;
  }, [cart]);

  const isMixed = fulfillmentTypes.size > 1;
  const cartFulfillmentType = isMixed ? null : (fulfillmentTypes.values().next().value || "delivery");

  const { data: pickupPoints } = useQuery({
    queryKey: ["/api/pickup-points", "active"],
    queryFn: async () => {
      const res = await fetch("/api/pickup-points?active=true", { credentials: "include" });
      return await res.json();
    },
    enabled: cartFulfillmentType === "pickup",
  });

  useEffect(() => {
    if (pickupPoints && (pickupPoints as any[]).length > 0 && !selectedPickupPointId) {
      setSelectedPickupPointId((pickupPoints as any[])[0].id);
    }
  }, [pickupPoints, selectedPickupPointId]);

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          qty: item.qty,
          fulfillmentType: item.fulfillmentType || "delivery",
        })),
        total: total.toFixed(2),
        fulfillmentType: cartFulfillmentType,
        pickupPointId: cartFulfillmentType === "pickup" ? selectedPickupPointId : null,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setOrderSuccess(data.id);
      setOrderFulfillment(data.fulfillmentType || cartFulfillmentType);
      saveCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleCheckout = () => {
    if (!user) {
      setLocation("/login?redirect=/carrinho");
      return;
    }
    if (isMixed) {
      toast({ title: "Carrinho misto", description: "Remova os itens de retirada ou entrega para continuar.", variant: "destructive" });
      return;
    }
    if (cartFulfillmentType === "pickup" && !selectedPickupPointId) {
      toast({ title: "Selecione um ponto de retirada", variant: "destructive" });
      return;
    }
    if (cartFulfillmentType === "delivery" && user && !user.addressStreet) {
      toast({ title: "Endereco necessario", description: "Cadastre seu endereco em Minha Conta antes de finalizar.", variant: "destructive" });
      return;
    }
    createOrder.mutate();
  };

  const removeByFulfillment = (type: string) => {
    const newCart = cart.filter((item) => (item.fulfillmentType || "delivery") !== type);
    saveCart(newCart);
  };

  if (orderSuccess) {
    const selectedPoint = (pickupPoints as any[])?.find((p: any) => p.id === selectedPickupPointId);
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-primary/10 p-6 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h2 data-testid="text-order-success" className="text-2xl font-bold mb-2 text-foreground">
            Pedido #{orderSuccess} recebido!
          </h2>
          <p className="text-muted-foreground mb-4 text-sm max-w-sm">
            Seu pedido foi registrado com sucesso. Em breve entraremos em contato para confirmar os detalhes.
          </p>

          {orderFulfillment === "pickup" && selectedPoint && (
            <Card className="mb-4 max-w-sm w-full">
              <CardContent className="p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Ponto de Retirada</span>
                </div>
                <p className="text-sm font-medium">{selectedPoint.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPoint.address}</p>
                {selectedPoint.hours && <p className="text-xs text-muted-foreground">{selectedPoint.hours}</p>}
              </CardContent>
            </Card>
          )}
          {orderFulfillment === "delivery" && (
            <Card className="mb-4 max-w-sm w-full">
              <CardContent className="p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Entrega no endereco</span>
                </div>
                <p className="text-xs text-muted-foreground">Sera enviado para o endereco cadastrado na sua conta.</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/minha-conta">
              <Button data-testid="button-view-orders" variant="outline">
                Ver meus pedidos
              </Button>
            </Link>
            <Link href="/">
              <Button data-testid="button-back-to-store">
                Voltar para a Loja
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-primary/10 p-6 rounded-full mb-4">
            <ShoppingBag className="w-12 h-12 text-primary" />
          </div>
          <h2 data-testid="text-empty-cart" className="text-2xl font-bold mb-2 text-foreground">
            Seu carrinho esta vazio
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">Que tal adicionar alguns produtos?</p>
          <Link href="/">
            <Button data-testid="button-back-to-store" size="lg" className="font-bold">
              Voltar para a Loja
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto p-4 pb-32 w-full">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Meu Carrinho</h1>
      </div>

      {isMixed && (
        <Card className="mb-4 border-destructive/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-foreground mb-1">Carrinho com tipos diferentes</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Seu carrinho tem produtos de retirada e entrega. Para finalizar, mantenha apenas um tipo.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" data-testid="button-keep-pickup" onClick={() => removeByFulfillment("delivery")}>
                    <MapPin className="w-3.5 h-3.5 mr-1" /> Manter so retirada
                  </Button>
                  <Button size="sm" variant="outline" data-testid="button-keep-delivery" onClick={() => removeByFulfillment("pickup")}>
                    <Truck className="w-3.5 h-3.5 mr-1" /> Manter so entrega
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {cart.map((item) => (
          <Card key={item.productId} data-testid={`card-cart-item-${item.productId}`}>
            <CardContent className="p-3 flex gap-3">
              <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <img
                  src={item.imageUrl || "https://via.placeholder.com/200x200?text=Produto"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=Produto";
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold leading-tight text-sm text-foreground">{item.name}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-primary font-bold text-sm">R$ {Number(item.price).toFixed(2)}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 gap-0.5">
                      {(item.fulfillmentType || "delivery") === "delivery" ? (
                        <><Truck className="w-2.5 h-2.5" /> Entrega</>
                      ) : (
                        <><MapPin className="w-2.5 h-2.5" /> Retirada</>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center border border-border rounded-md">
                    <Button
                      data-testid={`button-decrease-${item.productId}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQty(item.productId, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-7 text-center text-sm font-medium">{item.qty}</span>
                    <Button
                      data-testid={`button-increase-${item.productId}`}
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQty(item.productId, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    data-testid={`button-remove-${item.productId}`}
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cartFulfillmentType === "pickup" && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Ponto de Retirada</span>
            </div>
            {!pickupPoints || (pickupPoints as any[]).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum ponto de retirada disponivel no momento.</p>
            ) : (
              <div className="space-y-2">
                {(pickupPoints as any[]).map((pt: any) => (
                  <label
                    key={pt.id}
                    data-testid={`radio-pickup-${pt.id}`}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedPickupPointId === pt.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="pickup-point"
                      checked={selectedPickupPointId === pt.id}
                      onChange={() => setSelectedPickupPointId(pt.id)}
                      className="mt-1 accent-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">{pt.name}</p>
                      <p className="text-xs text-muted-foreground">{pt.address}</p>
                      {pt.hours && <p className="text-xs text-muted-foreground">{pt.hours}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {cartFulfillmentType === "delivery" && user && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Entrega no endereco</span>
            </div>
            {user.addressStreet ? (
              <div>
                <p className="text-sm">{user.addressStreet}, {user.addressNumber}</p>
                <p className="text-xs text-muted-foreground">{user.addressDistrict} - {user.addressCity}/{user.addressState}</p>
                <p className="text-xs text-muted-foreground">CEP: {user.addressCep}</p>
                <Link href="/minha-conta">
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs mt-1">Alterar endereco</Button>
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Voce precisa cadastrar um endereco antes de finalizar.</p>
                <Link href="/minha-conta">
                  <Button size="sm" variant="outline" data-testid="button-add-address">Cadastrar endereco</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-3">
          <span className="text-base font-medium text-muted-foreground">Total:</span>
          <span data-testid="text-cart-total" className="text-xl font-bold text-primary">
            R$ {total.toFixed(2)}
          </span>
        </div>
        <Button
          data-testid="button-checkout"
          className="w-full font-bold"
          size="lg"
          onClick={handleCheckout}
          disabled={createOrder.isPending || isMixed}
        >
          {createOrder.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : !user ? (
            <LogIn className="w-4 h-4 mr-1.5" />
          ) : null}
          {user ? "Finalizar Pedido" : "Fazer login para finalizar"}
        </Button>
      </div>
      </div>
      <Footer />
    </div>
  );
}
