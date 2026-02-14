import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, ShoppingCart, MapPin, Truck } from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { JoinGroupDialog } from "./JoinGroupDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLocation, Link } from "wouter";

interface ProductCardProps {
  product: any;
  saleMode: "grupo" | "agora";
}

function isOpenStatus(status: unknown) {
  const s = String(status ?? "").toLowerCase().trim();
  return s === "aberto" || s === "open";
}

export function ProductCard({ product, saleMode }: ProductCardProps) {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem("fsa_cart");
    let cart = [];
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch {
        cart = [];
      }
    }

    const price = product.nowPrice || product.originalPrice;

    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: price,
        qty: 1,
        fulfillmentType: product.fulfillmentType || "delivery",
      });
    }

    localStorage.setItem("fsa_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    toast({ title: "Adicionado!", description: `${product.name} foi adicionado ao carrinho.` });
  };

  const handleJoinGroup = () => {
    if (!user) {
      setLocation("/login?redirect=/");
      return;
    }
    setIsJoinDialogOpen(true);
  };

  const { data: groups, isLoading } = useGroups(
    saleMode === "grupo" ? { productId: product.id } : undefined,
  );

  const availableGroup = useMemo(() => {
    if (saleMode !== "grupo") return undefined;
    const list = (groups ?? []) as any[];
    const openGroups = list.filter((g) => isOpenStatus(g?.status));
    openGroups.sort((a, b) => Number(b?.currentPeople ?? 0) - Number(a?.currentPeople ?? 0));
    return openGroups[0];
  }, [groups, saleMode]);

  const hasOpenGroup = !!availableGroup;

  const originalPrice = Number(product.originalPrice);
  const groupPrice = Number(product.groupPrice);
  const nowPrice = product.nowPrice ? Number(product.nowPrice) : originalPrice;

  const displayPrice = saleMode === "grupo" ? groupPrice : nowPrice;
  const savings = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);

  const currentPeople = hasOpenGroup ? Number(availableGroup.currentPeople ?? 0) : 0;
  const minPeople = product.minPeople;
  const peopleLeft = Math.max(0, minPeople - currentPeople);
  const progressPercent = minPeople > 0 ? (currentPeople / minPeople) * 100 : 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        data-testid={`card-product-${product.id}`}
        className="group relative bg-card rounded-md border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-visible"
      >
        {savings > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-destructive text-destructive-foreground font-bold px-1.5 py-0.5 text-[10px]">
              -{savings}%
            </Badge>
          </div>
        )}

        <Link href={`/produto/${product.id}`} className="block">
          <div className="aspect-square w-full overflow-hidden bg-muted relative rounded-t-md cursor-pointer">
            <img
              src={product.imageUrl || "https://via.placeholder.com/400x400?text=Sem+Imagem"}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=Sem+Imagem";
              }}
            />
          </div>
        </Link>

        <div className="p-3 flex-1 flex flex-col">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {product.category}
            </span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 gap-0.5">
              {product.fulfillmentType === "delivery" ? (
                <><Truck className="w-2.5 h-2.5" /> Entrega</>
              ) : (
                <><MapPin className="w-2.5 h-2.5" /> Retirada</>
              )}
            </Badge>
          </div>

          <Link href={`/produto/${product.id}`} className="block">
            <h3 className="font-display font-semibold text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem] text-foreground hover:text-primary transition-colors cursor-pointer">
              {product.name}
            </h3>
          </Link>

          <div className="mt-auto space-y-2">
            <div>
              <span className="text-xs text-muted-foreground line-through">
                R$ {originalPrice.toFixed(2)}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary tracking-tight">
                  R$ {displayPrice.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-primary/80 font-medium">
                {saleMode === "grupo" ? "Preco em grupo" : "Preco individual"}
              </span>
            </div>

            {saleMode === "grupo" && (
              isLoading ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-1.5 w-full" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              ) : (
                <div className="space-y-2">
                  {hasOpenGroup ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="flex items-center gap-0.5 text-primary">
                          <Users className="w-3 h-3" />
                          Grupo aberto
                        </span>
                        <span className="text-muted-foreground">
                          {currentPeople}/{minPeople}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">
                        Faltam {peopleLeft}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Seja o primeiro!</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Min. {minPeople} pessoas | Faltam {peopleLeft}
                      </span>
                    </div>
                  )}

                  <Button
                    data-testid={`button-join-group-${product.id}`}
                    onClick={handleJoinGroup}
                    className="w-full font-bold"
                    size="sm"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5" />
                    Entrar no grupo
                  </Button>
                </div>
              )
            )}

            {saleMode === "agora" && (
              <Button
                data-testid={`button-add-cart-${product.id}`}
                onClick={handleAddToCart}
                className="w-full font-bold"
                size="sm"
              >
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Adicionar ao carrinho
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {saleMode === "grupo" && (
        <JoinGroupDialog
          isOpen={isJoinDialogOpen}
          onClose={() => setIsJoinDialogOpen(false)}
          product={product}
          existingGroup={availableGroup}
          user={user}
        />
      )}
    </>
  );
}
