import { useProducts } from "@/hooks/use-products";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Loader2, Users, ShoppingBag, User, LogOut, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";
import logoImg from "@assets/49ECF8D6-8EFD-4DE3-B65C-335066A661D2_1771048499776.png";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { CATEGORIES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [saleMode, setSaleMode] = useState<"grupo" | "agora">("grupo");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [bannerIdx, setBannerIdx] = useState(0);

  const { data: user } = useAuth();
  const logout = useLogout();

  const { data: banners } = useQuery({
    queryKey: ["/api/banners", "active"],
    queryFn: async () => {
      const res = await fetch("/api/banners?active=true");
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["/api/videos", "active"],
    queryFn: async () => {
      const res = await fetch("/api/videos?active=true");
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const activeBanners = (banners ?? []) as any[];
  const activeVideos = (videos ?? []) as any[];

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

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
            <Link href="/">
              <img
                data-testid="img-brand-logo"
                src={logoImg}
                alt="Compra Junto Formosa"
                decoding="async"
                className="logo-header"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </Link>

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
                  className="relative text-white"
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
                  <Link href="/minha-conta">
                    <Button
                      data-testid="button-account"
                      variant="ghost"
                      size="icon"
                      className="text-white"
                    >
                      <UserCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Button
                    data-testid="button-logout"
                    variant="ghost"
                    size="icon"
                    className="text-white"
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
                    className="text-white"
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
                    : "text-white/60 border-transparent border-b-[3px]"
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
                    : "text-white/60 border-transparent border-b-[3px]"
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
                      : "bg-card text-foreground/70 border border-border"
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
        {activeBanners.length > 0 && (
          <div className="mb-6 relative rounded-md overflow-hidden" data-testid="banner-carousel">
            <div className="relative aspect-[3/1] sm:aspect-[4/1] bg-muted">
              {activeBanners.map((banner: any, i: number) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${i === bannerIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  {banner.linkUrl ? (
                    <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </a>
                  ) : (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
              ))}
            </div>
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={() => setBannerIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1"
                  data-testid="button-banner-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setBannerIdx((prev) => (prev + 1) % activeBanners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1"
                  data-testid="button-banner-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {activeBanners.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setBannerIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? "bg-white scale-125" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

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

        {activeVideos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Videos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeVideos.map((video: any) => (
                <div key={video.id} className="rounded-md overflow-hidden bg-card border border-border" data-testid={`video-${video.id}`}>
                  <div className="aspect-video">
                    <iframe
                      src={video.embedUrl}
                      title={video.title || "Video"}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {video.title && (
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
