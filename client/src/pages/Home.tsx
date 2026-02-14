import { useProducts } from "@/hooks/use-products";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Loader2, Users, ShoppingBag, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { CATEGORIES } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [saleMode, setSaleMode] = useState<"grupo" | "agora">("grupo");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const { data: user } = useAuth();
  const logout = useLogout();

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("fsa_cart");
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const count = cart.reduce((acc: number, item: any) => acc + item.qty, 0);
          setCartCount(count);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

  const { data: products, isLoading, error } = useProducts({
    category: selectedCategory,
    search: searchTerm,
    saleMode: saleMode,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="brand-gradient sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1
              data-testid="text-brand-name"
              className="text-lg md:text-xl font-display font-bold text-white tracking-tight whitespace-nowrap"
            >
              Compra Junto Formosa
            </h1>

            <div className="relative flex-1 max-w-md hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                data-testid="input-search"
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 rounded-md bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Link href="/carrinho">
                <Button
                  data-testid="button-cart"
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:bg-white/15"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#D4A62A] text-[#1F2937] text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center gap-1">
                  <span className="text-white/80 text-xs hidden md:inline">{user.name.split(" ")[0]}</span>
                  <Button
                    data-testid="button-logout"
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/15"
                    onClick={() => logout.mutate()}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                  {user.role === "admin" && (
                    <Link href="/admin">
                      <Badge className="bg-[#D4A62A] text-[#1F2937] text-[10px] cursor-pointer">
                        Admin
                      </Badge>
                    </Link>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    data-testid="button-login"
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/15"
                  >
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="sm:hidden mt-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                data-testid="input-search-mobile"
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 rounded-md bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:bg-white/25"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              <button
                data-testid="button-mode-grupo"
                onClick={() => setSaleMode("grupo")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all border-b-3 ${
                  saleMode === "grupo"
                    ? "text-white border-[#D4A62A] border-b-[3px]"
                    : "text-white/60 border-transparent border-b-[3px] hover:text-white/80"
                }`}
              >
                <Users className="w-4 h-4" />
                Compra em Grupo
              </button>
              <button
                data-testid="button-mode-agora"
                onClick={() => setSaleMode("agora")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all border-b-3 ${
                  saleMode === "agora"
                    ? "text-white border-[#D4A62A] border-b-[3px]"
                    : "text-white/60 border-transparent border-b-[3px] hover:text-white/80"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Compre Agora
              </button>
            </div>
          </div>
        </div>

        <div className="bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-2 py-3 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  data-testid={`button-category-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-foreground/70 border border-border hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {saleMode === "grupo" && (
          <div className="mb-6 rounded-md brand-gradient p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Economize comprando em grupo
              </h2>
              <p className="text-white/85 text-sm mb-4">
                Junte-se a outros compradores e desbloqueie precos de atacado. Quanto mais gente, menor o preco!
              </p>
            </div>
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-display font-bold text-foreground">
              {searchTerm ? `Resultados para "${searchTerm}"` : selectedCategory}
            </h2>
            <span className="text-xs text-muted-foreground">
              {products?.length || 0} produtos
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Carregando produtos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-card rounded-md border border-border">
              <p className="text-destructive font-medium text-sm">Erro ao carregar produtos.</p>
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-md border border-dashed border-border">
              <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">Nenhum produto encontrado</h3>
              <p className="text-muted-foreground text-sm">Tente buscar por outro termo ou categoria.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
            >
              <AnimatePresence>
                {products?.map((product: any) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    saleMode={saleMode}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
