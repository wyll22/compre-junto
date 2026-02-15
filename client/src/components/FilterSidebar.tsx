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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  isFiltering: boolean;
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
  categoryIds?: number[] | null;
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

function MobileFilterChips(props: FilterSidebarProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: catalog } = useQuery<CatalogData>({
    queryKey: ["/api/filters/catalog", props.selectedCategoryId, props.saleMode, props.searchTerm],
    queryFn: async () => {
      const url = new URL("/api/filters/catalog", window.location.origin);
      if (props.selectedCategoryId) url.searchParams.append("categoryId", String(props.selectedCategoryId));
      if (props.saleMode) url.searchParams.append("saleMode", props.saleMode);
      if (props.searchTerm) url.searchParams.append("search", props.searchTerm);
      const res = await fetch(url.toString());
      if (!res.ok) return { categories: [], brands: [], priceRange: { minPrice: "0", maxPrice: "0" }, dynamicFilters: [] };
      return await res.json();
    },
  });

  const categories = catalog?.categories ?? [];
  const brands = catalog?.brands ?? [];
  const dynamicFilters = catalog?.dynamicFilters ?? [];

  const selectedCatName = props.selectedCategoryId
    ? categories.find(c => c.id === props.selectedCategoryId)?.name
    : null;

  const hasActiveFilters =
    props.selectedCategoryId !== null ||
    props.selectedBrand !== "" ||
    props.minPrice !== "" ||
    props.maxPrice !== "" ||
    props.selectedFilterOptions.length > 0;

  const advancedFilterCount =
    (props.minPrice ? 1 : 0) +
    (props.maxPrice ? 1 : 0) +
    props.selectedFilterOptions.length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2 px-1" data-testid="mobile-filter-chips">
      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <button
            data-testid="chip-categorias"
            className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium border transition-colors flex-shrink-0 ${
              props.selectedCategoryId !== null
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-foreground/70"
            }`}
          >
            {selectedCatName || "Categorias"}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2 max-h-72 overflow-y-auto" align="start">
          <div className="space-y-0.5">
            <button
              data-testid="mobile-filter-category-all"
              onClick={() => { props.onSelectCategory(null); setCategoryOpen(false); }}
              className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                props.selectedCategoryId === null
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70"
              }`}
            >
              <span>Todas</span>
              {props.selectedCategoryId === null && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                data-testid={`mobile-filter-category-${cat.id}`}
                onClick={() => { props.onSelectCategory(cat.id); setCategoryOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                  props.selectedCategoryId === cat.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70"
                }`}
              >
                <span className="truncate">{cat.name} ({cat.count})</span>
                {props.selectedCategoryId === cat.id && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {brands.length > 0 && (
        <Popover open={brandOpen} onOpenChange={setBrandOpen}>
          <PopoverTrigger asChild>
            <button
              data-testid="chip-marca"
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium border transition-colors flex-shrink-0 ${
                props.selectedBrand
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-foreground/70"
              }`}
            >
              {props.selectedBrand || "Marca"}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 max-h-72 overflow-y-auto" align="start">
            <div className="space-y-0.5">
              {props.selectedBrand && (
                <button
                  data-testid="mobile-filter-brand-clear"
                  onClick={() => { props.onSelectBrand(""); setBrandOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar marca
                </button>
              )}
              {brands.map((b) => (
                <button
                  key={b.brand}
                  data-testid={`mobile-filter-brand-${b.brand}`}
                  onClick={() => { props.onSelectBrand(props.selectedBrand === b.brand ? "" : b.brand); setBrandOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                    props.selectedBrand === b.brand
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70"
                  }`}
                >
                  <span className="truncate">{b.brand} ({b.count})</span>
                  {props.selectedBrand === b.brand && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <button
            data-testid="chip-filtros"
            className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium border transition-colors flex-shrink-0 ${
              advancedFilterCount > 0
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-foreground/70"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
            {advancedFilterCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0">{advancedFilterCount}</Badge>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-base">Filtros</SheetTitle>
            <SheetDescription className="sr-only">Selecione filtros para refinar os produtos</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Faixa de preco</h4>
              <div className="flex items-center gap-2">
                <Input
                  data-testid="mobile-filter-min-price"
                  type="number"
                  step="0.01"
                  placeholder="Min"
                  value={props.minPrice}
                  onChange={(e) => props.onMinPriceChange(e.target.value)}
                  className="text-sm"
                />
                <span className="text-muted-foreground text-sm">-</span>
                <Input
                  data-testid="mobile-filter-max-price"
                  type="number"
                  step="0.01"
                  placeholder="Max"
                  value={props.maxPrice}
                  onChange={(e) => props.onMaxPriceChange(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {dynamicFilters.map((filter) => (
              <div key={filter.id}>
                <h4 className="text-sm font-semibold text-foreground mb-2">{filter.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {filter.options.map((opt) => {
                    const isSelected = props.selectedFilterOptions.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        data-testid={`mobile-filter-option-${opt.id}`}
                        onClick={() => props.onToggleFilterOption(opt.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-card border-border text-foreground/70"
                        }`}
                      >
                        {opt.label} ({opt.count})
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {hasActiveFilters && (
              <Button
                data-testid="mobile-clear-all-filters"
                variant="ghost"
                size="sm"
                onClick={() => { props.onClearAllFilters(); setFiltersOpen(false); }}
                className="w-full text-destructive gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpar todos os filtros
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {hasActiveFilters && (
        <button
          data-testid="chip-limpar-filtros"
          onClick={props.onClearAllFilters}
          className="flex items-center gap-1 whitespace-nowrap px-2 py-1.5 rounded-md text-xs font-medium text-destructive flex-shrink-0"
        >
          <X className="w-3 h-3" />
          Limpar
        </button>
      )}
    </div>
  );
}

export function MobileFilterBar(props: FilterSidebarProps) {
  if (!props.isFiltering) return null;
  return (
    <div className="lg:hidden">
      <MobileFilterChips {...props} />
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  if (!props.isFiltering) {
    return null;
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
