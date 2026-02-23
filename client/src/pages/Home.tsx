import { useProducts } from "@/hooks/use-products";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Loader2, Users, ShoppingBag, User, LogOut, ChevronRight, UserCircle, Grid3X3, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";
import { NotificationBell } from "@/components/NotificationBell";
import { FilterSidebar, MobileFilterBar } from "@/components/FilterSidebar";
import { Skeleton } from "@/components/ui/skeleton";

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
};

const BannerSection = memo(({ banners, currentIndex, setIndex }: any) => {
  if (!banners?.length) return null;
  return (
    <section className="mb-6 rounded-xl overflow-hidden shadow-lg relative aspect-[21/9] sm:aspect-[24/7] bg-muted">
      <AnimatePresence mode="wait">
        <motion.div
          key={banners[currentIndex].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <img
            src={banners[currentIndex].imageUrl}
            alt={banners[currentIndex].title || "Banner"}
            className="w-full h-full object-cover"
            loading="eager"
            width="1200"
            height="400"
          />
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-white w-4" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [saleMode, setSaleMode] = useState<"grupo" | "agora">("grupo");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<number[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  const [, navigate] = useLocation();
  const { data: user } = useAuth();
  const logout = useLogout();

  const { data: topCategories = [] } = useQuery<CategoryItem[]>({
    queryKey: ["/api/categories", "top"],
    staleTime: 1000 * 60 * 10,
  });

  const { data: subcategories = [] } = useQuery<CategoryItem[]>({
    queryKey: ["/api/categories", "sub", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const res = await fetch(`/api/categories?parentId=${selectedCategoryId}`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: selectedCategoryId !== null,
    staleTime: 1000 * 60 * 5,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["/api/banners", "active"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: sponsorBanners = [] } = useQuery({
    queryKey: ["/api/sponsor-banners"],
    staleTime: 1000 * 60 * 5,
  });

  const sidebarSponsors = sponsorBanners.filter((b: any) => b.position === "sidebar");
  const cats = topCategories as CategoryItem[];
  const selectedCategoryName = selectedCategoryId
    ? cats.find((c) => c.id === selectedCategoryId)?.name ?? "Categoria"
    : "Todos";

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("fsa_cart");
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const count = cart.reduce((acc: number, item: any) => acc + item.qty, 0);
          setCartCount(count);
        } catch { setCartCount(0); }
      } else { setCartCount(0); }
    };
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } finally { setSuggestionsLoading(false); }
    }, 350);
  }, []);

  const { data: products = [], isLoading } = useProducts({
    search: searchTerm,
    saleMode,
    categoryId: selectedCategoryId ?? undefined,
    subcategoryId: selectedSubcategoryId ?? undefined,
    brand: filterBrand || undefined,
    minPrice: filterMinPrice ? Number(filterMinPrice) : undefined,
    maxPrice: filterMaxPrice ? Number(filterMaxPrice) : undefined,
    filterOptionIds: selectedFilterOptions.length > 0 ? selectedFilterOptions : undefined,
  });

  const handleSelectCategory = useCallback((catId: number | null) => {
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    setShowAllCategories(false);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setFilterBrand("");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setSelectedFilterOptions([]);
  }, []);

  const toggleFilterOption = useCallback((id: number) => {
    setSelectedFilterOptions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node) &&
          searchMobileRef.current && !searchMobileRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="brand-gradient sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/">
              <BrandLogo size="header" className="h-8 sm:h-10 w-auto" />
            </Link>

            <div className="relative flex-1 max-w-md hidden sm:block" ref={searchRef}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 pr-8 bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:bg-white/25 h-10 rounded-full"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto overflow-x-hidden">
                  {suggestionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    suggestions.map((item: any) => (
                      <button
                        key={item.id}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50 transition-colors border-b last:border-0"
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchTerm("");
                          navigate(`/produto/${item.id}`);
                        }}
                      >
                        <div className="w-10 h-10 bg-muted rounded flex-shrink-0">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">R$ {Number(item.groupPrice || item.nowPrice || 0).toFixed(2)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link href="/carrinho">
                <Button variant="ghost" size="icon" className="relative text-white h-9 w-9">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-[#D4A62A] text-[#1F2937] text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full border border-white">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href={user ? "/minha-conta" : "/login"}>
                <Button variant="ghost" size="icon" className="text-white h-9 w-9">
                  <UserCircle className="w-5 h-5" />
                </Button>
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="hidden sm:block">
                  <Badge className="bg-[#D4A62A] text-[#1F2937] cursor-pointer">Admin</Badge>
                </Link>
              )}
            </div>
          </div>

          <div className="sm:hidden mt-2" ref={searchMobileRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 pr-8 bg-white/15 border-white/20 text-white placeholder:text-white/60 h-10 rounded-full"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((item: any) => (
                    <button
                      key={item.id}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left border-b last:border-0"
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchTerm("");
                        navigate(`/produto/${item.id}`);
                      }}
                    >
                      <div className="w-8 h-8 bg-muted rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-sm">{item.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex">
            <button
              onClick={() => setSaleMode("grupo")}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-[3px] ${saleMode === "grupo" ? "text-white border-[#D4A62A]" : "text-white/60 border-transparent"}`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Compra em Grupo
            </button>
            <button
              onClick={() => setSaleMode("agora")}
              className={`flex-1 py-3 text-sm font-bold transition-all border-b-[3px] ${saleMode === "agora" ? "text-white border-[#D4A62A]" : "text-white/60 border-transparent"}`}
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              Compre Agora
            </button>
          </div>
        </div>

        <div className="bg-background border-b shadow-sm overflow-x-auto hide-scrollbar">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2">
            <button
              onClick={() => handleSelectCategory(null)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCategoryId === null ? "bg-primary text-white" : "bg-white border text-foreground/70 hover:bg-gray-50"}`}
            >
              Todos
            </button>
            {cats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${selectedCategoryId === cat.id ? "bg-primary text-white" : "bg-white border text-foreground/70 hover:bg-gray-50"}`}
              >
                {cat.name}
              </button>
            ))}
            {cats.length > 5 && (
              <button onClick={() => setShowAllCategories(true)} className="p-1.5 text-muted-foreground"><Grid3X3 className="w-4 h-4" /></button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-64 hidden lg:block">
            <FilterSidebar
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              selectedBrand={filterBrand}
              onSelectBrand={setFilterBrand}
              minPrice={filterMinPrice}
              maxPrice={filterMaxPrice}
              onMinPriceChange={setFilterMinPrice}
              onMaxPriceChange={setFilterMaxPrice}
              selectedFilterOptions={selectedFilterOptions}
              onToggleFilterOption={toggleFilterOption}
              onClearAllFilters={handleClearAllFilters}
              saleMode={saleMode}
              searchTerm={searchTerm}
              isFiltering={true}
            />
            {sidebarSponsors.length > 0 && (
              <div className="mt-8 space-y-4 sticky top-40">
                <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">Patrocinadores</p>
                {sidebarSponsors.map((s: any) => (
                  <a key={s.id} href={s.linkUrl || "#"} className="block rounded-lg overflow-hidden border shadow-sm transition-transform hover:scale-[1.02]">
                    <img src={s.imageUrl} alt={s.name} className="w-full h-auto" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0 space-y-6">
            <MobileFilterBar
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={handleSelectCategory}
              selectedBrand={filterBrand}
              onSelectBrand={setFilterBrand}
              minPrice={filterMinPrice}
              maxPrice={filterMaxPrice}
              onMinPriceChange={setFilterMinPrice}
              onMaxPriceChange={setFilterMaxPrice}
              selectedFilterOptions={selectedFilterOptions}
              onToggleFilterOption={toggleFilterOption}
              onClearAllFilters={handleClearAllFilters}
              saleMode={saleMode}
              searchTerm={searchTerm}
              isFiltering={true}
            />

            {!searchTerm && !selectedCategoryId && <BannerSection banners={banners} currentIndex={bannerIdx} setIndex={setBannerIdx} />}

            {selectedCategoryId && subcategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                <button
                  onClick={() => setSelectedSubcategoryId(null)}
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold ${selectedSubcategoryId === null ? "bg-[#D4A62A] text-[#1F2937]" : "bg-white border text-foreground/60"}`}
                >
                  Todas
                </button>
                {subcategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubcategoryId(sub.id)}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-bold ${selectedSubcategoryId === sub.id ? "bg-[#D4A62A] text-[#1F2937]" : "bg-white border text-foreground/60"}`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            <div ref={productsRef} className="scroll-mt-40">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {selectedCategoryName}
                  <Badge variant="secondary" className="font-normal">{products.length}</Badge>
                </h2>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border p-3 space-y-3">
                      <Skeleton className="aspect-square w-full rounded-md" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                  <Button variant="link" onClick={handleClearAllFilters}>Limpar filtros</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {products.map((p: any) => (
                    <ProductCard key={p.id} product={p} saleMode={saleMode} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={showAllCategories} onOpenChange={setShowAllCategories}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Categorias</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {cats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`p-3 rounded-lg border text-sm text-left ${selectedCategoryId === cat.id ? "bg-primary/10 border-primary font-bold" : "bg-card"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
