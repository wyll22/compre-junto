import { Product, Group } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Clock } from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { useMemo, useState } from "react";
import { JoinGroupDialog } from "./JoinGroupDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface ProductCardProps {
  product: Product;
  showBuyNow?: boolean;
}

function isOpenStatus(status: unknown) {
  const s = String(status ?? "")
    .toLowerCase()
    .trim();
  return s === "aberto" || s === "open";
}

export function ProductCard({ product, showBuyNow = false }: ProductCardProps) {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem("fsa_cart");
    let cart = [];
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (e) {
        cart = [];
      }
    }

    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        groupPrice: product.groupPrice,
        qty: 1
      });
    }

    localStorage.setItem("fsa_cart", JSON.stringify(cart));
    // Dispara evento customizado para atualizar contador no mesmo window
    window.dispatchEvent(new Event('cart-updated'));
    setLocation("/carrinho");
  };

  // ✅ NÃO filtra por status aqui (evita “sumir” grupo por status diferente)
  const { data: groups, isLoading } = useGroups({
    productId: product.id,
  } as any);

  // ✅ melhor grupo aberto (aberto/open) com mais pessoas
  const availableGroup: Group | undefined = useMemo(() => {
    const list = (groups ?? []) as any[];
    const openGroups = list.filter((g) => isOpenStatus(g?.status));
    openGroups.sort(
      (a, b) => Number(b?.currentPeople ?? 0) - Number(a?.currentPeople ?? 0),
    );
    return openGroups[0];
  }, [groups]);

  const hasOpenGroup = !!availableGroup;

  // desconto
  const savings = Math.round(
    ((Number(product.originalPrice) - Number(product.groupPrice)) /
      Number(product.originalPrice)) *
      100,
  );

  const currentPeople = hasOpenGroup
    ? Number((availableGroup as any).currentPeople ?? 0)
    : 0;

  const peopleLeft = Math.max(0, product.minPeople - currentPeople);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden"
      >
        {/* Badge desconto */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-1 text-xs shadow-md">
            -{savings}% OFF
          </Badge>
        </div>

        {/* Imagem */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Conteúdo */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="mb-1">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {product.category}
            </span>
          </div>

          <h3 className="font-display font-semibold text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>

          {/* Preços */}
          <div className="mt-auto space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-muted-foreground line-through decoration-red-400">
                R$ {Number(product.originalPrice).toFixed(2)}
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary tracking-tight">
                  R$ {Number(product.groupPrice).toFixed(2)}
                </span>
                <span className="text-[10px] text-primary/80 font-medium">
                  {showBuyNow ? "Preço individual" : "Preço em grupo"}
                </span>
              </div>
            </div>

            {/* Status grupo - Somente se NÃO for modo Buy Now */}
            {!showBuyNow && (
              isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {hasOpenGroup ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1 text-orange-600">
                          <Users className="w-3 h-3" />
                          Grupo aberto!
                        </span>
                        <span className="text-muted-foreground">
                          Mínimo {product.minPeople} pessoas
                        </span>
                      </div>

                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">
                          {currentPeople}/{product.minPeople} no grupo
                        </span>
                        <span className="text-orange-600">
                          Faltam {peopleLeft} para fechar
                        </span>
                      </div>

                      <Progress
                        value={(currentPeople / product.minPeople) * 100}
                        className="h-2 bg-orange-100"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Seja o primeiro a criar um grupo</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Mínimo {product.minPeople} pessoas
                      </div>
                      <div className="text-xs text-orange-600 font-medium">
                        Faltam {peopleLeft} para fechar
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => setIsJoinDialogOpen(true)}
                    className={`w-full font-bold shadow-md hover:shadow-lg transition-all ${
                      hasOpenGroup
                        ? "bg-primary hover:bg-orange-600 text-white"
                        : "bg-white border-2 border-primary text-primary hover:bg-orange-50"
                    }`}
                    size="lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Entrar no grupo
                  </Button>
                </div>
              )
            )}

            {showBuyNow && (
              <Button
                onClick={handleAddToCart}
                variant="default"
                className="w-full font-bold shadow-md hover:shadow-lg transition-all bg-primary hover:bg-orange-600 text-white"
                size="lg"
              >
                Comprar agora
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <JoinGroupDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        product={product}
        existingGroup={availableGroup}
      />
    </>
  );
}
