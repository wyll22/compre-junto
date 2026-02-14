import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Loader2, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const CATEGORIES = ["Todos", "Compre agora", "Alimentos", "Bebidas", "Higiene", "Limpeza", "Outros"];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem("fsa_cart");
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          const count = cart.reduce((acc: number, item: any) => acc + item.qty, 0);
          setCartCount(count);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Adiciona listener customizado para quando alterarmos o cart no mesmo window
    window.addEventListener('cart-updated', updateCartCount);
    
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);
  
  const { data: products, isLoading, error } = useProducts({
    category: selectedCategory === "Compre agora" ? "Todos" : selectedCategory,
    search: searchTerm,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight">
                Compre Junto FSA
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="O que você procura hoje?"
                  className="pl-10 rounded-xl bg-gray-50 border-gray-200 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Cart Icon */}
              <Link href="/carrinho">
                <Button variant="ghost" size="icon" className="relative bg-gray-50 rounded-xl hover:bg-orange-50 hover:text-primary transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="border-t border-gray-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-2 py-3 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${selectedCategory === cat 
                      ? "bg-primary text-white shadow-md shadow-primary/25" 
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner - Optional for MVP but nice visually */}
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-primary to-orange-400 p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Economize até 70% em grupo</h2>
            <p className="text-white/90 text-lg mb-6">Junte-se a outros compradores da sua região e desbloqueie preços de atacado.</p>
            <Button variant="secondary" className="rounded-xl font-bold text-primary hover:bg-white/90">
              Ver Ofertas do Dia
            </Button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 right-40 w-60 h-60 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-gray-800">
              {searchTerm ? `Resultados para "${searchTerm}"` : `${selectedCategory}`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {products?.length || 0} produtos encontrados
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Carregando ofertas incríveis...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-red-500 font-medium">Erro ao carregar produtos. Tente novamente.</p>
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Nenhum produto encontrado</h3>
              <p className="text-gray-500">Tente buscar por outro termo ou categoria.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
            >
              <AnimatePresence>
                {products?.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    showBuyNow={selectedCategory === "Compre agora"} 
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
