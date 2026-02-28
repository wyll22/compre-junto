import { useProducts } from "@/hooks/use-products";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ShoppingCart,
  Loader2,
  Users,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
  UserCircle,
  Grid3X3,
  X,
  Store,
  Truck,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";
import { NotificationBell } from "@/components/NotificationBell";
import { FilterSidebar, MobileFilterBar } from "@/components/FilterSidebar";

type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
};

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    number | null
  >(null);
  const [saleMode, setSaleMode] = useState<"grupo" | "agora">("grupo");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<number[]>(
    [],
  );
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: user } = useAuth();
  const logout = useLogout();

  const { data: topCategories } = useQuery<CategoryItem[]>({
    queryKey: ["/api/categories", "top"],
    queryFn: async () => {
      const res = await fetch("/api/categories?parentId=null");
      if (!res.ok) return [];
      return await res.json();
    },
  });

  const { data: subcategories } = useQuery<CategoryItem[]>({
    queryKey: ["/api/categories", "sub", selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const res = await fetch(`/api/categories?parentId=${selectedCategoryId}`);
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: selectedCategoryId !== null,
  });

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

  const { data: sponsorBanners } = useQuery({
    queryKey: ["/api/sponsor-banners"],
  });

  const activeBanners = (banners ?? []) as any[];
  const activeVideos = (videos ?? []) as any[];
  const demoVideos = [
    {
      id: "demo-como-funciona",
      title: "Como funciona a Compra Junto (vídeo teste)",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      isDemo: true,
    },
    {
      id: "demo-depoimento",
      title: "Depoimento de cliente (vídeo teste)",
      embedUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
      isDemo: true,
    },
  ];
  const videosForLanding = activeVideos.length > 0 ? activeVideos : demoVideos;
  const activeSponsorBanners = (sponsorBanners ?? []) as any[];
  const sidebarSponsors = activeSponsorBanners.filter(
    (b: any) => b.position === "sidebar",
  );
  const inlineSponsors = activeSponsorBanners.filter(
    (b: any) => b.position === "inline",
  );
  const cats = (topCategories ?? []) as CategoryItem[];
  const subs = (subcategories ?? []) as CategoryItem[];

  const MOBILE_VISIBLE_COUNT = 5;
  const ofertasCat = cats.find((c) => c.slug === "ofertas");
  const nonOfertasCats = cats.filter((c) => c.slug !== "ofertas");
  const visibleCats = [
    ...nonOfertasCats.slice(
      0,
      ofertasCat ? MOBILE_VISIBLE_COUNT - 1 : MOBILE_VISIBLE_COUNT,
    ),
    ...(ofertasCat ? [ofertasCat] : []),
  ];
  const hasMoreCats = cats.length > visibleCats.length;

  const selectedCategoryName = selectedCategoryId
    ? (cats.find((c) => c.id === selectedCategoryId)?.name ?? "Categoria")
    : "Todos";
  const hasRoutesForLanding = {
    grupos: "/grupos",
    compreAgora: "/compre-agora",
  };

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
          const count = cart.reduce(
            (acc: number, item: any) => acc + item.qty,
            0,
          );
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

  const fetchSuggestions = useCallback((term: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (term.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/suggestions?q=${encodeURIComponent(term)}`,
        );
        if (!res.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        const data = await res.json();
        const normalizedSuggestions = Array.isArray(data) ? data : [];
        setSuggestions(normalizedSuggestions);
        setShowSuggestions(normalizedSuggestions.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      fetchSuggestions(value);
    },
    [fetchSuggestions],
  );

  const productsRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = useCallback(() => {
    setShowSuggestions(false);
    if (searchTerm.trim().length > 0) {
      setTimeout(() => {
        productsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [searchTerm]);

  const [location, navigate] = useLocation();
  const isHomeLanding = location === "/";

  // Mantém o modo sincronizado com a URL
  useEffect(() => {
    if (location === "/grupos") {
      setSaleMode("grupo");
      return;
    }
    if (location === "/compre-agora") {
      setSaleMode("agora");
      return;
    }
    if (location === "/") {
      setSaleMode("grupo");
    }
  }, [location]);

  const handleSuggestionClick = useCallback(
    (product: any) => {
      setShowSuggestions(false);
      setSearchTerm("");
      setSuggestions([]);
      navigate(`/produto/${product.id}`);
    },
    [navigate],
  );

  const { data: landingFeaturedProducts } = useQuery({
    queryKey: ["/api/featured-products"],
    queryFn: async () => {
      const res = await fetch("/api/featured-products");
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: isHomeLanding,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node) &&
        searchMobileRef.current &&
        !searchMobileRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const handleToggleFilterOption = useCallback((optionId: number) => {
    setSelectedFilterOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId],
    );
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setFilterBrand("");
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setSelectedFilterOptions([]);
  }, []);

  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    search: searchTerm,
    saleMode,
    categoryId: selectedCategoryId ?? undefined,
    subcategoryId: selectedSubcategoryId ?? undefined,
    brand: filterBrand || undefined,
    minPrice: filterMinPrice ? Number(filterMinPrice) : undefined,
    maxPrice: filterMaxPrice ? Number(filterMaxPrice) : undefined,
    filterOptionIds:
      selectedFilterOptions.length > 0 ? selectedFilterOptions : undefined,
  });
  const featuredProductsSource = isHomeLanding
    ? ((landingFeaturedProducts as any[])
        ?.map((item: any) => item.product)
        .filter(Boolean) ?? [])
    : (products ?? []);
  const featuredProducts = (featuredProductsSource as any[]).slice(0, 6);

  const handleSelectCategory = (catId: number | null) => {
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    setShowAllCategories(false);
  };

  const getCategoryButtonClass = (cat: CategoryItem, isSelected: boolean) => {
    if (cat.slug !== "ofertas") {
      return isSelected
        ? "bg-primary text-primary-foreground shadow-sm"
        : "bg-card text-foreground/70 border border-border";
    }

    return isSelected
      ? "bg-[#D4A62A] text-[#1F2937] border-2 border-[#8A6D1D] shadow-md ring-2 ring-[#D4A62A]/35"
      : "bg-[#FFE7A3] text-[#6B4F00] border-2 border-[#D4A62A] font-semibold shadow-sm hover:bg-[#FFD97A]";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="brand-gradient sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" data-testid="link-brand-logo">
              <BrandLogo size="header" />
            </Link>

            <div
              className="relative flex-1 max-w-md hidden sm:block"
              ref={searchRef}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                data-testid="input-search"
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 pr-8 h-11 rounded-md bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:bg-white/25 focus:border-white/40"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  data-testid="button-clear-search"
                  onClick={() => {
                    setSearchTerm("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                >
                  <X className="h-4 w-4 text-white/60 hover:text-white" />
                </button>
              )}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  {suggestionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    suggestions.map((item: any) => (
                      <button
                        key={item.id}
                        data-testid={`suggestion-${item.id}`}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover-elevate transition-colors"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.saleMode === "grupo" && item.groupPrice
                              ? `R$ ${Number(item.groupPrice).toFixed(2)}`
                              : ""}
                            {item.saleMode === "agora" && item.nowPrice
                              ? `R$ ${Number(item.nowPrice).toFixed(2)}`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] flex-shrink-0"
                        >
                          {item.saleMode === "grupo" ? "Grupo" : "Agora"}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link href="/carrinho">
                <Button
                  data-testid="button-cart"
                  variant="ghost"
                  size="icon"
                  className="relative text-white"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#D4A62A] text-[#1F2937] text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm leading-none px-0.5">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center gap-1">
                  <span className="text-white/80 text-xs hidden sm:inline mr-1">
                    Ola, {(user.displayName || user.name).split(" ")[0]}
                  </span>
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
                  {user.role === "parceiro" && (
                    <Link href="/parceiro">
                      <Badge
                        className="bg-[#D4A62A] text-[#1F2937] text-[10px] cursor-pointer"
                        data-testid="badge-partner-panel"
                      >
                        Parceiro
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

          <div className="sm:hidden mt-2" ref={searchMobileRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                data-testid="input-search-mobile"
                type="text"
                placeholder="O que voce procura?"
                className="pl-10 pr-8 h-11 rounded-md bg-white/15 border-white/20 text-white placeholder:text-white/60 focus:bg-white/25"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() =>
                  suggestions.length > 0 && setShowSuggestions(true)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  data-testid="button-clear-search-mobile"
                  onClick={() => {
                    setSearchTerm("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                >
                  <X className="h-4 w-4 text-white/60 hover:text-white" />
                </button>
              )}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                  {suggestionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    suggestions.map((item: any) => (
                      <button
                        key={item.id}
                        data-testid={`suggestion-mobile-${item.id}`}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover-elevate transition-colors"
                        onClick={() => handleSuggestionClick(item)}
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-9 h-9 object-cover rounded-md flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.saleMode === "grupo" && item.groupPrice
                              ? `R$ ${Number(item.groupPrice).toFixed(2)}`
                              : ""}
                            {item.saleMode === "agora" && item.nowPrice
                              ? `R$ ${Number(item.nowPrice).toFixed(2)}`
                              : ""}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              <button
                data-testid="button-mode-grupo"
                onClick={() => {
                  setSaleMode("grupo");
                  navigate("/grupos");
                }}
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
                onClick={() => {
                  setSaleMode("agora");
                  navigate("/compre-agora");
                }}
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

        {saleMode === "agora" && (
          <div className="bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 py-3">
                <button
                  data-testid="button-category-todos"
                  onClick={() => handleSelectCategory(null)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedCategoryId === null
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card text-foreground/70 border border-border"
                  }`}
                >
                  Todos
                </button>

                <div className="hidden sm:flex items-center gap-2 overflow-x-auto hide-scrollbar">
                  {cats.map((cat) => (
                    <button
                      key={cat.id}
                      data-testid={`button-category-${cat.slug}`}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${getCategoryButtonClass(cat, selectedCategoryId === cat.id)}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="flex sm:hidden items-center gap-2 overflow-x-auto hide-scrollbar flex-1">
                  {visibleCats.map((cat) => (
                    <button
                      key={cat.id}
                      data-testid={`button-category-${cat.slug}`}
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition-all ${getCategoryButtonClass(cat, selectedCategoryId === cat.id)}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  {hasMoreCats && (
                    <button
                      data-testid="button-ver-mais-categorias"
                      onClick={() => setShowAllCategories(true)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium bg-card text-foreground/70 border border-border flex items-center gap-1"
                    >
                      Ver mais
                      <Grid3X3 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {selectedCategoryId && subs.length > 0 && (
                <div className="flex items-center gap-2 pb-3 overflow-x-auto hide-scrollbar">
                  <button
                    data-testid="button-subcategory-all"
                    onClick={() => setSelectedSubcategoryId(null)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedSubcategoryId === null
                        ? "bg-[#D4A62A] text-[#1F2937] shadow-sm"
                        : "bg-card text-foreground/60 border border-border"
                    }`}
                  >
                    Todas
                  </button>
                  {subs.map((sub) => (
                    <button
                      key={sub.id}
                      data-testid={`button-subcategory-${sub.slug}`}
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        selectedSubcategoryId === sub.id
                          ? "bg-[#D4A62A] text-[#1F2937] shadow-sm"
                          : "bg-card text-foreground/60 border border-border"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {saleMode === "agora" && (
        <Dialog open={showAllCategories} onOpenChange={setShowAllCategories}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Categorias</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <button
                data-testid="button-modal-category-todos"
                onClick={() => handleSelectCategory(null)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium text-left transition-all ${
                  selectedCategoryId === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground/70 border border-border hover-elevate"
                }`}
              >
                Todos
              </button>
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  data-testid={`button-modal-category-${cat.slug}`}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-3 py-2.5 rounded-md text-sm font-medium text-left transition-all ${
                    selectedCategoryId === cat.id
                      ? getCategoryButtonClass(cat, true)
                      : `${getCategoryButtonClass(cat, false)} hover-elevate`
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16 w-full">
        {isHomeLanding && !searchTerm && activeBanners.length > 0 && (
          <div
            className="mb-6 relative rounded-md overflow-hidden"
            data-testid="banner-carousel"
          >
            <div className="relative aspect-[3/1] sm:aspect-[4/1] bg-muted">
              {activeBanners.map((banner: any, i: number) => (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    i === bannerIdx
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title || "Banner"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </a>
                  ) : (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setBannerIdx(
                      (prev) =>
                        (prev - 1 + activeBanners.length) %
                        activeBanners.length,
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1"
                  data-testid="button-banner-prev"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <button
                  onClick={() =>
                    setBannerIdx((prev) => (prev + 1) % activeBanners.length)
                  }
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
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === bannerIdx ? "bg-white scale-125" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!isHomeLanding && !searchTerm && saleMode === "grupo" && (
          <div className="mb-6 rounded-md brand-gradient p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-lg">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
                Economize comprando em grupo
              </h2>
              <p className="text-white/85 text-sm mb-4">
                Junte-se a outros compradores e desbloqueie precos de atacado.
                Quanto mais gente, menor o preco!
              </p>
            </div>
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>
        )}

        {isHomeLanding && !searchTerm && (
          <section className="mb-8 rounded-md border border-border bg-card p-5 md:p-6">
            <div className="flex flex-col gap-2 mb-5">
              <h2 className="text-xl font-display font-bold text-foreground">
                Como funciona
              </h2>
              <p className="text-sm text-muted-foreground">
                Aqui você escolhe entre duas formas de compra:{" "}
                <b>Compra em Grupo</b> para economizar mais, ou{" "}
                <b>Compre Agora</b> para receber com rapidez.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: <Users className="w-5 h-5 text-primary" />,
                  title: "Escolha como quer comprar",
                  description:
                    "Comece pela opção ideal: Compra em Grupo para preço menor ou Compre Agora para compra imediata.",
                },
                {
                  icon: <UserCircle className="w-5 h-5 text-primary" />,
                  title: "Se for em grupo: entre e convide",
                  description:
                    "Participe com sua conta, acompanhe o progresso e convide amigos para fechar mais rápido.",
                },
                {
                  icon: <Truck className="w-5 h-5 text-primary" />,
                  title: "Finalize e receba do seu jeito",
                  description:
                    "No Compre Agora você finaliza na hora; em ambos os casos pode retirar no ponto ou receber, conforme disponível.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="mb-2">{step.icon}</div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={hasRoutesForLanding.grupos}>
                <Button size="sm" data-testid="button-landing-ver-grupos">
                  Ver Grupos
                </Button>
              </Link>
              <Link href={hasRoutesForLanding.compreAgora}>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid="button-landing-comprar-agora"
                >
                  Comprar Agora
                </Button>
              </Link>
            </div>
          </section>
        )}

        {isHomeLanding && !searchTerm && (
          <section className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="text-xl font-display font-bold text-foreground">
                Mais vendidos
              </h2>
              <span className="text-xs text-muted-foreground">
                Seleção em destaque
              </span>
            </div>

            {featuredProducts.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
              >
                <AnimatePresence>
                  {featuredProducts.map((product: any) => (
                    <ProductCard
                      key={`featured-${product.id}`}
                      product={product}
                      saleMode={saleMode}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-card p-6 text-center">
                <Store className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Em breve, novos destaques na vitrine da Home.
                </p>
              </div>
            )}
          </section>
        )}

        {!isHomeLanding && saleMode === "agora" && (
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
            onToggleFilterOption={handleToggleFilterOption}
            onClearAllFilters={handleClearAllFilters}
            saleMode={saleMode}
            searchTerm={searchTerm}
            isFiltering={!!(searchTerm || selectedCategoryId !== null)}
          />
        )}

        {!isHomeLanding && (
          <div ref={productsRef} className="flex gap-6 items-start">
            {saleMode === "agora" && (
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
                onToggleFilterOption={handleToggleFilterOption}
                onClearAllFilters={handleClearAllFilters}
                saleMode={saleMode}
                searchTerm={searchTerm}
                isFiltering={!!(searchTerm || selectedCategoryId !== null)}
              />
            )}

            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-display font-bold text-foreground">
                  {searchTerm
                    ? `Resultados para "${searchTerm}"`
                    : selectedCategoryName}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {products?.length || 0} produtos
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                  <p className="text-muted-foreground text-sm">
                    Carregando produtos...
                  </p>
                </div>
              ) : error ? (
                <div className="text-center py-16 bg-card rounded-md border border-border">
                  <p className="text-destructive font-medium text-sm">
                    Erro ao carregar produtos.
                  </p>
                </div>
              ) : products?.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-md border border-dashed border-border">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-foreground">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Tente buscar por outro termo ou categoria.
                  </p>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4"
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

              {inlineSponsors.length > 0 && (
                <div className="mt-4 md:hidden">
                  {inlineSponsors.map((sponsor: any) => (
                    <a
                      key={sponsor.id}
                      href={sponsor.linkUrl || "#"}
                      target={
                        sponsor.linkUrl?.startsWith("http") ? "_blank" : "_self"
                      }
                      rel="noopener noreferrer"
                      className="block rounded-md overflow-hidden border border-border hover-elevate mb-3"
                      data-testid={`sponsor-inline-${sponsor.id}`}
                    >
                      <img
                        src={sponsor.imageUrl}
                        alt={sponsor.title || "Patrocinador"}
                        className="w-full h-auto object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {sidebarSponsors.length > 0 && (
              <aside className="hidden lg:block w-[200px] flex-shrink-0 space-y-3 sticky top-20 z-10">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 text-center">
                  Publicidade
                </p>
                {sidebarSponsors.map((sponsor: any) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.linkUrl || "#"}
                    target={
                      sponsor.linkUrl?.startsWith("http") ? "_blank" : "_self"
                    }
                    rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border border-border hover-elevate"
                    data-testid={`sponsor-sidebar-${sponsor.id}`}
                  >
                    <img
                      src={sponsor.imageUrl}
                      alt={sponsor.title || "Patrocinador"}
                      className="w-full h-auto object-cover"
                    />
                  </a>
                ))}
              </aside>
            )}
          </div>
        )}

        {isHomeLanding && !searchTerm && videosForLanding.length > 0 && (
          <section className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-xl font-display font-bold text-foreground">
                Vídeos
              </h2>
              {activeVideos.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Exibindo vídeos teste até cadastrar no Admin
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videosForLanding.map((video: any) => (
                <div
                  key={video.id}
                  className="rounded-md overflow-hidden bg-card border border-border"
                  data-testid={`video-${video.id}`}
                >
                  <div className="aspect-video">
                    <iframe
                      src={video.embedUrl}
                      title={video.title || "Vídeo"}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </div>
                  {video.title && (
                    <div className="p-2">
                      <p className="text-sm font-medium truncate">
                        {video.title}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {isHomeLanding && !searchTerm && (
          <section className="mt-10">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Patrocinadores
            </h2>

            {activeSponsorBanners.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {activeSponsorBanners.map((sponsor: any) => (
                  <a
                    key={`home-sponsor-${sponsor.id}`}
                    href={sponsor.linkUrl || "#"}
                    target={
                      sponsor.linkUrl?.startsWith("http") ? "_blank" : "_self"
                    }
                    rel="noopener noreferrer"
                    className="rounded-md border border-border bg-card p-2 flex items-center justify-center min-h-[88px] hover-elevate"
                    data-testid={`sponsor-home-${sponsor.id}`}
                  >
                    <img
                      src={sponsor.imageUrl}
                      alt={sponsor.title || "Patrocinador"}
                      className="max-h-16 w-auto object-contain"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Espaço para patrocinadores (TODO: conectar com banners de
                  patrocinadores quando houver conteúdo).
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
