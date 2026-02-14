import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, LogIn, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  price: string | number;
  qty: number;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
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

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          price: item.price,
          qty: item.qty,
        })),
        total: total.toFixed(2),
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setOrderSuccess(data.id);
      saveCart([]);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (err: any) => {
      const msg = err?.message || "Erro ao criar pedido";
      let parsed = msg;
      try {
        parsed = JSON.parse(msg.split(":").slice(1).join(":").trim()).message || msg;
      } catch {}
      toast({ title: "Erro", description: parsed, variant: "destructive" });
    },
  });

  const handleCheckout = () => {
    if (!user) {
      setLocation("/login?redirect=/carrinho");
      return;
    }
    createOrder.mutate();
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-primary/10 p-6 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
        <h2 data-testid="text-order-success" className="text-2xl font-bold mb-2 text-foreground">
          Pedido #{orderSuccess} recebido!
        </h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-sm">
          Seu pedido foi registrado com sucesso. Em breve entraremos em contato para confirmar os detalhes.
        </p>
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
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
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
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-foreground">Meu Carrinho</h1>
      </div>

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
                  <p className="text-primary font-bold text-sm">R$ {Number(item.price).toFixed(2)}</p>
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
          disabled={createOrder.isPending}
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
  );
}
