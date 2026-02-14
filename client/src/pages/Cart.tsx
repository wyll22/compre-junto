import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  imageUrl: string;
  groupPrice: string | number;
  qty: number;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem("fsa_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Erro ao carregar carrinho", e);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("fsa_cart", JSON.stringify(newCart));
  };

  const updateQty = (productId: number, delta: number) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeItem = (productId: number) => {
    const newCart = cart.filter(item => item.productId !== productId);
    saveCart(newCart);
  };

  const total = cart.reduce((acc, item) => acc + (Number(item.groupPrice) * item.qty), 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="bg-orange-100 p-6 rounded-full mb-4">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
        <p className="text-muted-foreground mb-6">Que tal adicionar alguns produtos?</p>
        <Link href="/">
          <Button size="lg" className="font-bold">
            Voltar para a Loja
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Meu Carrinho</h1>
      </div>

      <div className="space-y-4">
        {cart.map((item) => (
          <Card key={item.productId} className="overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold leading-tight mb-1">{item.name}</h3>
                  <p className="text-primary font-bold">R$ {Number(item.groupPrice).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => updateQty(item.productId, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.qty}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => updateQty(item.productId, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-muted-foreground">Total:</span>
          <span className="text-2xl font-bold text-primary">R$ {total.toFixed(2)}</span>
        </div>
        <Button className="w-full h-12 text-lg font-bold shadow-lg" size="lg">
          Finalizar Pedido
        </Button>
      </div>
    </div>
  );
}
