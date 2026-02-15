import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Check, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterSidebarProps {
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (v: string) => void;
  onMaxPriceChange: (v: string) => void;
  selectedFilterOptions: number[];
  onToggleFilterOption: (optionId: number) => void;
  onClearAllFilters: () => void;
  saleMode: string;
  searchTerm: string;
}

interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  count: number;
}

interface CatalogBrand {
  brand: string;
  count: number;
}

interface CatalogFilterOption {
  id: number;
  label: string;
  value: string;
  count: number;
}

interface CatalogDynamicFilter {
  id: number;
  name: string;
  slug: string;
  inputType: string;
  options: CatalogFilterOption[];
}

interface CatalogData {
  categories: CatalogCategory[];
  brands: CatalogBrand[];
  priceRange: { minPrice: string; maxPrice: string };
  dynamicFilters: CatalogDynamicFilter[];
}

function FilterContent({
  selectedCategoryId,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  selectedFilterOptions,
  onToggleFilterOption,
  onClearAllFilters,
  saleMode,
  searchTerm,
}: FilterSidebarProps) {
  const [showAllBrands, setShowAllBrands] = useState(false);

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ["/api/filters/catalog", selectedCategoryId, saleMode, searchTerm],
    queryFn: async () => {
      const url = new URL("/api/filters/catalog", window.location.origin);
      if (selectedCategoryId) url.searchParams.append("categoryId", String(selectedCategoryId));
      if (saleMode) url.searchParams.append("saleMode", saleMode);
      if (searchTerm) url.searchParams.append("search", searchTerm);
      const res = await fetch(url.toString());
      if (!res.ok) return { categories: [], brands: [], priceRange: { minPrice: "0", maxPrice: "0" }, dynamicFilters: [] };
      return await res.json();
    },
  });

  const categories = catalog?.categories ?? [];
  const brands = catalog?.brands ?? [];
  const dynamicFilters = catalog?.dynamicFilters ?? [];

  const visibleBrands = showAllBrands ? brands : brands.slice(0, 5);
  const hasMoreBrands = brands.length > 5;

  const hasActiveFilters =
    selectedCategoryId !== null ||
    selectedBrand !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    selectedFilterOptions.length > 0;

  return (
    <div className="space-y-1">
      {hasActiveFilters && (
        <div className="px-1 pb-2">
          <Button
            data-testid="button-clear-all-filters"
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="w-full text-xs text-destructive gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </Button>
        </div>
      )}

      <Accordion type="multiple" defaultValue={["categories", "brands", "price"]} className="w-full">
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-semibold py-3 px-1" data-testid="accordion-categories">
            Categorias
          </AccordionTrigger>
          <AccordionContent className="px-1">
            <div className="space-y-0.5">
              <button
                data-testid="filter-category-all"
                onClick={() => onSelectCategory(null)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                  selectedCategoryId === null
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70"
                }`}
              >
                <span>Todas</span>
                {selectedCategoryId === null && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  data-testid={`filter-category-${cat.id}`}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selectedCategoryId === cat.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70"
                  }`}
                >
                  <span className="truncate">{cat.name} ({cat.count})</span>
                  {selectedCategoryId === cat.id && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brands">
          <AccordionTrigger className="text-sm font-semibold py-3 px-1" data-testid="accordion-brands">
            Marcas
          </AccordionTrigger>
          <AccordionContent className="px-1">
            <div className="space-y-0.5">
              {visibleBrands.map((b) => (
                <button
                  key={b.brand}
                  data-testid={`filter-brand-${b.brand}`}
                  onClick={() => onSelectBrand(selectedBrand === b.brand ? "" : b.brand)}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selectedBrand === b.brand
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70"
                  }`}
                >
                  <span className="truncate">{b.brand} ({b.count})</span>
                  {selectedBrand === b.brand && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              ))}
              {hasMoreBrands && !showAllBrands && (
                <button
                  data-testid="button-show-more-brands"
                  onClick={() => setShowAllBrands(true)}
                  className="w-full px-2 py-1.5 text-sm text-primary font-medium flex items-center gap-1"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Mostrar mais
                </button>
              )}
              {hasMoreBrands && showAllBrands && (
                <button
                  data-testid="button-show-less-brands"
                  onClick={() => setShowAllBrands(false)}
                  className="w-full px-2 py-1.5 text-sm text-primary font-medium flex items-center gap-1"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  Mostrar menos
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold py-3 px-1" data-testid="accordion-price">
            Faixa de preco
          </AccordionTrigger>
          <AccordionContent className="px-1">
            <div className="flex items-center gap-2">
              <Input
                data-testid="filter-min-price"
                type="number"
                step="0.01"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                className="text-xs"
              />
              <span className="text-muted-foreground text-xs">-</span>
              <Input
                data-testid="filter-max-price"
                type="number"
                step="0.01"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="text-xs"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {dynamicFilters.map((filter) => (
          <AccordionItem key={filter.id} value={`dynamic-${filter.id}`}>
            <AccordionTrigger className="text-sm font-semibold py-3 px-1" data-testid={`accordion-filter-${filter.slug}`}>
              {filter.name}
            </AccordionTrigger>
            <AccordionContent className="px-1">
              <div className="space-y-0.5">
                {filter.options.map((opt) => {
                  const isSelected = selectedFilterOptions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      data-testid={`filter-option-${opt.id}`}
                      onClick={() => onToggleFilterOption(opt.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/70"
                      }`}
                    >
                      <span className="truncate">{opt.label} ({opt.count})</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasActiveFilters =
    props.selectedCategoryId !== null ||
    props.selectedBrand !== "" ||
    props.minPrice !== "" ||
    props.maxPrice !== "" ||
    props.selectedFilterOptions.length > 0;

  const activeCount =
    (props.selectedCategoryId !== null ? 1 : 0) +
    (props.selectedBrand ? 1 : 0) +
    (props.minPrice ? 1 : 0) +
    (props.maxPrice ? 1 : 0) +
    props.selectedFilterOptions.length;

  if (isMobile) {
    return (
      <>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              data-testid="button-open-filters-mobile"
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {activeCount > 0 && (
                <Badge variant="secondary">{activeCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto p-4">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription className="sr-only">Selecione filtros para refinar os produtos</SheetDescription>
            </SheetHeader>
            <FilterContent {...props} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <aside className="w-[250px] flex-shrink-0 hidden lg:block" data-testid="filter-sidebar">
      <div className="sticky top-[140px]">
        <div className="bg-card border border-border rounded-md p-3 max-h-[calc(100vh-160px)] overflow-y-auto">
          <h3 className="text-sm font-bold text-foreground mb-2 px-1">Filtros</h3>
          <FilterContent {...props} />
        </div>
      </div>
    </aside>
  );
}
