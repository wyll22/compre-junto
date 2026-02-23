import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ShoppingCart, Users, Clock, MapPin, Truck,
  Minus, Plus, Loader2, Package, ShieldCheck, Info, Weight, Ruler, Tag, AlertTriangle,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/use-auth";
import { useGroups } from "@/hooks/use-groups";
import { useToast } from "@/hooks/use-toast";
import { JoinGroupDialog } from "@/components/JoinGroupDialog";
import { Footer } from "@/components/Footer";

function RelatedProducts({ productId, saleMode, categoryId }: { productId: number; saleMode: string; categoryId?: number }) {
  const { data: related, isLoading } = useQuery<any[]>({
    queryKey: ["/api/products", productId, "related", saleMode],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/related?limit=8&mode=${saleMode}`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: !!productId && !!categoryId,
  });

  const { data: openGroups } = useQuery<any[]>({
    queryKey: ["/api/groups", "open", categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/groups?status=aberto`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: saleMode === "grupo" && !!categoryId,
  });

  const relatedGroups = useMemo(() => {
    if (!openGroups || !categoryId) return [];
    return openGroups
      .filter((g: any) => g.productCategoryId === categoryId && g.productId !== productId)
      .slice(0, 6);
  }, [openGroups, categoryId, productId]);

  const items = related || [];
  if (items.length === 0 && relatedGroups.length === 0 && !isLoading) return null;

  return (
    <div className="px-4 md:px-6 py-6 border-t border-border">
      {saleMode === "grupo" && relatedGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Grupos Abertos Parecidos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {relatedGroups.map((group: any) => (
              <Link key={group.id} href={`/produto/${group.productId}`}>
                <Card className="hover-elevate overflow-visible" data-testid={`card-related-group-${group.id}`}>
                  <CardContent className="p-3">
                    {group.productImageUrl && (
                      <img
                        src={group.productImageUrl}
                        alt={group.productName || "Produto"}
                        className="w-full aspect-square object-cover rounded-md mb-2"
                        loading="lazy"
                        width="200"
                        height="200"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=Sem+Imagem"; }}
                      />
                    )}
                    <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{group.productName}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs text-primary font-bold">
                        R$ {Number(group.productGroupPrice || 0).toFixed(2)}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {group.currentPeople}/{group.minPeople}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {saleMode === "grupo" ? "Produtos Relacionados" : "Voce tambem pode gostar"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item: any) => {
              const price = saleMode === "grupo"
                ? Number(item.groupPrice || item.originalPrice)
                : Number(item.nowPrice || item.originalPrice);
              const origPrice = Number(item.originalPrice);
              const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
              return (
                <Link key={item.id} href={`/produto/${item.id}`}>
                  <Card className="hover-elevate overflow-visible" data-testid={`card-related-product-${item.id}`}>
                    <CardContent className="p-0">
                      <div className="relative">
                        {discount > 0 && (
                          <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground text-[10px]">
                            -{discount}%
                          </Badge>
                        )}
                        <img
                          src={item.imageUrl || "https://via.placeholder.com/200x200?text=Sem+Imagem"}
                          alt={item.name}
                          className="w-full aspect-square object-cover rounded-t-md"
                          loading="lazy"
                          width="200"
                          height="200"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x200?text=Sem+Imagem"; }}
                        />
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">{item.name}</p>
                        {discount > 0 && (
                          <span className="text-xs text-muted-foreground line-through">R$ {origPrice.toFixed(2)}</span>
                        )}
                        <p className="text-sm font-bold text-primary">R$ {price.toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function isOpenStatus(status: unknown) {
  const s = String(status ?? "").toLowerCase().trim();
  return s === "aberto" || s === "open";
}

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? Number(params.id) : null;
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const { data: product, isLoading, error } = useQuery<any>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("Produto nao encontrado");
      return await res.json();
    },
    enabled: !!productId,
  });

  const saleMode = product?.saleMode === "agora" ? "agora" : "grupo";

  const { data: groups } = useGroups(
    saleMode === "grupo" && product ? { productId: product.id } : undefined,
  );

  const availableGroup = useMemo(() => {
    if (saleMode !== "grupo") return undefined;
    const list = (groups ?? []) as any[];
    const openGroups = list.filter((g) => isOpenStatus(g?.status));
    openGroups.sort((a, b) => Number(b?.currentPeople ?? 0) - Number(a?.currentPeople ?? 0));
    return openGroups[0];
  }, [groups, saleMode]);

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem("fsa_cart");
    let cart: any[] = [];
    if (savedCart) {
      try { cart = JSON.parse(savedCart); } catch { cart = []; }
    }

    const price = product.nowPrice || product.originalPrice;
    const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        price,
        qty,
        fulfillmentType: product.fulfillmentType || "delivery",
      });
    }

    localStorage.setItem("fsa_cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    toast({ title: "Adicionado!", description: `${qty}x ${product.name} adicionado ao carrinho.` });
  };

  const handleJoinGroup = () => {
    if (!user) {
      setLocation(`/login?redirect=/produto/${productId}`);
      return;
    }
    setIsJoinDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </Link>
          <BrandLogo size="header" />
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6 w-full">
          <Skeleton className="w-full aspect-square rounded-md mb-4" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <Link href="/">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </Link>
          <BrandLogo size="header" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-sm mx-4">
            <CardContent className="py-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h2 className="font-bold text-foreground mb-1">Produto nao encontrado</h2>
              <p className="text-sm text-muted-foreground mb-4">Esse produto pode ter sido removido ou o link esta incorreto.</p>
              <Link href="/">
                <Button size="sm" data-testid="button-back-home">Voltar ao inicio</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const originalPrice = Number(product.originalPrice);
  const groupPrice = Number(product.groupPrice);
  const nowPrice = product.nowPrice ? Number(product.nowPrice) : originalPrice;
  const displayPrice = saleMode === "grupo" ? groupPrice : nowPrice;
  const savings = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);

  const hasOpenGroup = !!availableGroup;
  const currentPeople = hasOpenGroup ? Number(availableGroup.currentPeople ?? 0) : 0;
  const minPeople = product.minPeople;
  const peopleLeft = Math.max(0, minPeople - currentPeople);
  const progressPercent = minPeople > 0 ? (currentPeople / minPeople) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/">
          <ArrowLeft className="w-5 h-5 text-primary-foreground" data-testid="button-back" />
        </Link>
        <BrandLogo size="header" />
        <div className="ml-auto">
          <Link href="/carrinho">
            <Button variant="ghost" size="icon" className="text-primary-foreground" data-testid="button-cart-header">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full">
        <div className="md:grid md:grid-cols-2 md:gap-6 md:p-6">
          <div className="relative">
            {savings > 0 && (
              <div className="absolute top-3 left-3 z-10">
                <Badge className="bg-destructive text-destructive-foreground font-bold text-xs">
                  -{savings}%
                </Badge>
              </div>
            )}
            <img
              src={product.imageUrl || "https://via.placeholder.com/600x600?text=Sem+Imagem"}
              alt={product.name}
              className="w-full aspect-square object-cover md:rounded-md"
              data-testid="img-product"
              loading="eager"
              width="600"
              height="600"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x600?text=Sem+Imagem";
              }}
            />
          </div>

          <div className="p-4 md:p-0 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {product.category}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                  {product.fulfillmentType === "delivery" ? (
                    <><Truck className="w-3 h-3" /> Entrega</>
                  ) : (
                    <><MapPin className="w-3 h-3" /> Retirada</>
                  )}
                </Badge>
              </div>
              <h1 className="text-xl font-display font-bold text-foreground" data-testid="text-product-name">
                {product.name}
              </h1>
            </div>

            {product.stock <= 0 && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <span className="text-sm font-medium text-destructive">Produto esgotado</span>
              </div>
            )}

            {product.stock > 0 && product.stock <= 5 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-md p-3">
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Ultimas {product.stock} unidades!</span>
              </div>
            )}

            {product.brand && (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Marca: <strong className="text-foreground">{product.brand}</strong></span>
              </div>
            )}

            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Descricao</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>
            )}

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground line-through">
                    R$ {originalPrice.toFixed(2)}
                  </span>
                  {savings > 0 && (
                    <Badge variant="secondary" className="text-xs">Economia de {savings}%</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                    R$ {displayPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-primary/80 font-medium">
                  {saleMode === "grupo" ? "Preco em grupo" : "Preco individual"}
                </p>

                {saleMode === "grupo" && groupPrice < nowPrice && (
                  <p className="text-xs text-muted-foreground">
                    Compre Agora por R$ {nowPrice.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>

            {saleMode === "grupo" && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {hasOpenGroup ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Users className="w-4 h-4" />
                          Grupo aberto
                        </span>
                        <span className="text-muted-foreground">
                          {currentPeople}/{minPeople} pessoas
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Faltam {peopleLeft} {peopleLeft === 1 ? "pessoa" : "pessoas"} para fechar o grupo
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Nenhum grupo aberto. Seja o primeiro! Min. {minPeople} pessoas.</span>
                    </div>
                  )}

                  <Button
                    data-testid="button-join-group"
                    onClick={handleJoinGroup}
                    className="w-full font-bold"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Entrar no grupo
                  </Button>
                </CardContent>
              </Card>
            )}

            {saleMode === "agora" && (
              <div className="space-y-3">
                {product.stock > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Quantidade:</span>
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          data-testid="button-qty-minus"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-medium text-foreground" data-testid="text-qty">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQty(Math.min(product.stock, qty + 1))}
                          disabled={qty >= product.stock}
                          data-testid="button-qty-plus"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-muted-foreground">({product.stock} disponiveis)</span>
                    </div>

                    <Button
                      data-testid="button-add-cart"
                      onClick={handleAddToCart}
                      className="w-full font-bold"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Adicionar ao carrinho - R$ {(displayPrice * qty).toFixed(2)}
                    </Button>
                  </>
                ) : (
                  <Button disabled className="w-full font-bold" data-testid="button-out-of-stock">
                    Produto esgotado
                  </Button>
                )}
              </div>
            )}

            {(product.specifications || product.weight || product.dimensions) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary" />
                    Especificacoes Tecnicas
                  </h3>
                  <div className="space-y-2 text-sm">
                    {product.brand && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Marca:</span>
                        <span className="text-foreground font-medium">{product.brand}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Peso:</span>
                        <span className="text-foreground font-medium">{product.weight}</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex items-center gap-2">
                        <Ruler className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Dimensoes:</span>
                        <span className="text-foreground font-medium">{product.dimensions}</span>
                      </div>
                    )}
                    {product.specifications && (
                      <div className="pt-1 border-t border-border">
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.specifications}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Compra segura. Seus dados estao protegidos.</span>
            </div>
          </div>
        </div>

        <RelatedProducts productId={product.id} saleMode={saleMode} categoryId={product.categoryId} />
      </main>

      <Footer />

      {saleMode === "grupo" && (
        <JoinGroupDialog
          isOpen={isJoinDialogOpen}
          onClose={() => setIsJoinDialogOpen(false)}
          product={product}
          existingGroup={availableGroup}
          user={user}
        />
      )}
    </div>
  );
}
