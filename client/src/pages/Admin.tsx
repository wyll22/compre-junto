import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { useGroups, useUpdateGroupStatus } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, LayoutDashboard, ExternalLink, Edit, Package, Users, Image, Video, Loader2,
  ClipboardList, Eye, UserCircle, TrendingUp, ShoppingCart, FolderTree, DollarSign, Clock,
  Mail, Phone, ChevronDown, ChevronUp, Search, MapPin, AlertTriangle, Settings, ArrowRight, History,
  Monitor, Globe, Database, Server, Shield, RefreshCcw, CheckCircle2, XCircle, FileText, Upload, Link2, Copy,
  ChevronLeft, ChevronRight, Filter,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef, useCallback } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation } from "wouter";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseApiError } from "@/lib/error-utils";

type AdminTab = "dashboard" | "products" | "groups" | "orders" | "categories" | "clients" | "banners" | "videos" | "pickup" | "order-settings" | "system" | "articles" | "media" | "navigation" | "filters" | "sponsors" | "approvals" | "partners";

const SALE_MODES = [
  { value: "grupo", label: "Compra em Grupo" },
  { value: "agora", label: "Compre Agora" },
];

const ORDER_STATUSES = ["recebido", "em_separacao", "pronto_retirada", "retirado", "nao_retirado", "cancelado"] as const;

const ORDER_STATUS_LABELS: Record<string, string> = {
  recebido: "Recebido",
  em_separacao: "Em Separacao",
  pronto_retirada: "Pronto p/ Retirada",
  retirado: "Retirado",
  nao_retirado: "Nao Retirado",
  cancelado: "Cancelado",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  recebido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_separacao: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pronto_retirada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  retirado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  nao_retirado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const DEFAULT_TRANSITIONS: Record<string, string[]> = {
  recebido: ["em_separacao", "cancelado"],
  em_separacao: ["pronto_retirada", "cancelado"],
  pronto_retirada: ["retirado", "nao_retirado", "cancelado"],
  retirado: [],
  nao_retirado: ["cancelado"],
  cancelado: [],
};
const RESERVE_STATUSES = ["pendente", "pago", "nenhuma"];

function ProductForm({
  isOpen,
  onClose,
  editProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: any;
}) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: allCategoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: "include" });
      return await res.json();
    },
  });
  const allCats = (allCategoriesData ?? []) as any[];
  const topCats = allCats.filter((c: any) => c.parentId === null);

  const { data: activeFilterTypes } = useQuery<any[]>({
    queryKey: ["/api/admin/filter-types"],
  });
  const activeTypes = (activeFilterTypes || []).filter((ft: any) => ft.active);

  const { data: allFilterOptions } = useQuery<any[]>({
    queryKey: ["/api/admin/filter-options", "all-active"],
    queryFn: async () => {
      const types = activeFilterTypes || [];
      const activeIds = types.filter((ft: any) => ft.active).map((ft: any) => ft.id);
      const results: any[] = [];
      for (const tid of activeIds) {
        const res = await fetch(`/api/admin/filter-options?filterTypeId=${tid}`, { credentials: "include" });
        const opts = await res.json();
        results.push(...(opts || []).filter((o: any) => o.active));
      }
      return results;
    },
    enabled: (activeFilterTypes || []).length > 0,
  });

  const { data: productFilters } = useQuery<any[]>({
    queryKey: ["/api/products", editProduct?.id, "filters"],
    queryFn: async () => {
      const res = await fetch(`/api/products/${editProduct.id}/filters`, { credentials: "include" });
      return await res.json();
    },
    enabled: !!editProduct?.id,
  });

  const [selectedFilters, setSelectedFilters] = useState<Record<number, Set<number>>>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    originalPrice: "",
    groupPrice: "",
    nowPrice: "",
    minPeople: "10",
    stock: "100",
    reserveFee: "0",
    categoryId: "",
    subcategoryId: "",
    saleMode: "grupo",
    fulfillmentType: "pickup",
    active: true,
    saleEndsAt: "",
    brand: "",
    weight: "",
    dimensions: "",
    specifications: "",
  });
  const subCats = form.categoryId ? allCats.filter((c: any) => c.parentId === Number(form.categoryId)) : [];

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name || "",
        description: editProduct.description || "",
        imageUrl: editProduct.imageUrl || "",
        originalPrice: String(editProduct.originalPrice || ""),
        groupPrice: String(editProduct.groupPrice || ""),
        nowPrice: String(editProduct.nowPrice || ""),
        minPeople: String(editProduct.minPeople || 10),
        stock: String(editProduct.stock || 100),
        reserveFee: String(editProduct.reserveFee || 0),
        categoryId: editProduct.categoryId ? String(editProduct.categoryId) : "",
        subcategoryId: editProduct.subcategoryId ? String(editProduct.subcategoryId) : "",
        saleMode: editProduct.saleMode || "grupo",
        fulfillmentType: editProduct.fulfillmentType || (editProduct.saleMode === "agora" ? "delivery" : "pickup"),
        active: editProduct.active !== false,
        saleEndsAt: editProduct.saleEndsAt ? new Date(editProduct.saleEndsAt).toISOString().slice(0, 16) : "",
        brand: editProduct.brand || "",
        weight: editProduct.weight || "",
        dimensions: editProduct.dimensions || "",
        specifications: editProduct.specifications || "",
      });
    } else {
      setForm({
        name: "", description: "", imageUrl: "", originalPrice: "", groupPrice: "",
        nowPrice: "", minPeople: "10", stock: "100", reserveFee: "0",
        categoryId: "", subcategoryId: "", saleMode: "grupo", fulfillmentType: "pickup", active: true, saleEndsAt: "",
        brand: "", weight: "", dimensions: "", specifications: "",
      });
      setSelectedFilters({});
    }
  }, [editProduct, isOpen]);

  useEffect(() => {
    if (productFilters && productFilters.length > 0) {
      const map: Record<number, Set<number>> = {};
      productFilters.forEach((pf: any) => {
        if (!map[pf.filterTypeId]) map[pf.filterTypeId] = new Set();
        map[pf.filterTypeId].add(pf.filterOptionId);
      });
      setSelectedFilters(map);
    } else if (productFilters) {
      setSelectedFilters({});
    }
  }, [productFilters]);

  const loading = createProduct.isPending || updateProduct.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCat = topCats.find((c: any) => c.id === Number(form.categoryId));
    const payload = {
      ...form,
      nowPrice: form.nowPrice || null,
      minPeople: Number(form.minPeople),
      stock: Number(form.stock),
      reserveFee: form.reserveFee || "0",
      category: selectedCat?.name || "Outros",
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      subcategoryId: form.subcategoryId ? Number(form.subcategoryId) : null,
      brand: form.brand || null,
      weight: form.weight || null,
      dimensions: form.dimensions || null,
      specifications: form.specifications || null,
      saleEndsAt: form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : null,
    };

    let productId = editProduct?.id;
    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, data: payload });
    } else {
      const created = await createProduct.mutateAsync(payload);
      productId = (created as any)?.id;
    }

    if (productId && activeTypes.length > 0) {
      const filters: { filterTypeId: number; filterOptionId: number }[] = [];
      Object.entries(selectedFilters).forEach(([typeId, optionIds]) => {
        optionIds.forEach((optId) => {
          filters.push({ filterTypeId: Number(typeId), filterOptionId: optId });
        });
      });
      try {
        await apiRequest("PUT", `/api/products/${productId}/filters`, { filters });
        queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "filters"] });
      } catch (err: any) {
        toast({ title: "Aviso", description: "Produto salvo, mas houve erro ao salvar filtros.", variant: "destructive" });
      }
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input data-testid="input-product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label>Descricao</Label>
            <Textarea data-testid="input-product-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Venda</Label>
              <select data-testid="select-sale-mode" value={form.saleMode} onChange={(e) => {
                const sm = e.target.value;
                setForm({ ...form, saleMode: sm, fulfillmentType: sm === "agora" ? "delivery" : "pickup" });
              }} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {SALE_MODES.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Entrega</Label>
              <select data-testid="select-fulfillment" value={form.fulfillmentType} onChange={(e) => setForm({ ...form, fulfillmentType: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="pickup">Retirada</option>
                <option value="delivery">Entrega</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select data-testid="select-category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: "" })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Selecionar...</option>
                {topCats.map((c: any) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategoria</Label>
              <select data-testid="select-subcategory" value={form.subcategoryId} onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">Nenhuma</option>
                {subCats.map((c: any) => (<option key={c.id} value={String(c.id)}>{c.name}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Preco Normal (R$)</Label>
              <Input data-testid="input-original-price" type="number" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Preco Grupo (R$)</Label>
              <Input data-testid="input-group-price" type="number" step="0.01" value={form.groupPrice} onChange={(e) => setForm({ ...form, groupPrice: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Preco Agora (R$)</Label>
              <Input data-testid="input-now-price" type="number" step="0.01" value={form.nowPrice} onChange={(e) => setForm({ ...form, nowPrice: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Estoque</Label>
              <Input data-testid="input-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Min. Participantes</Label>
              <Input data-testid="input-min-people" type="number" value={form.minPeople} onChange={(e) => setForm({ ...form, minPeople: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Taxa Reserva (R$)</Label>
              <Input data-testid="input-reserve-fee" type="number" step="0.01" value={form.reserveFee} onChange={(e) => setForm({ ...form, reserveFee: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>URL da Imagem</Label>
            <Input data-testid="input-image-url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input data-testid="input-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Samsung" />
            </div>
            <div className="space-y-1.5">
              <Label>Peso</Label>
              <Input data-testid="input-weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="Ex: 500g" />
            </div>
            <div className="space-y-1.5">
              <Label>Dimensoes</Label>
              <Input data-testid="input-dimensions" value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} placeholder="Ex: 20x10x5 cm" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Especificacoes Tecnicas</Label>
            <Textarea data-testid="input-specifications" value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} placeholder="Detalhes tecnicos do produto (material, composicao, voltagem, etc.)" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Encerra em (Queima de Estoque)</Label>
            <Input data-testid="input-sale-ends-at" type="datetime-local" value={form.saleEndsAt} onChange={(e) => setForm({ ...form, saleEndsAt: e.target.value })} />
            <p className="text-[11px] text-muted-foreground">Opcional. Define countdown no card do produto.</p>
          </div>

          <div className="flex items-center gap-2">
            <input data-testid="input-active" type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-input" />
            <Label htmlFor="active">Produto ativo</Label>
          </div>

          {activeTypes.length > 0 && (
            <div className="space-y-3 border-t border-border pt-3">
              <Label className="text-sm font-semibold">Filtros do Produto</Label>
              {activeTypes.map((ft: any) => {
                const options = (allFilterOptions || []).filter((o: any) => o.filterTypeId === ft.id);
                if (options.length === 0) return null;
                const selected = selectedFilters[ft.id] || new Set();
                const toggleOption = (optId: number) => {
                  setSelectedFilters((prev) => {
                    const newSet = new Set(prev[ft.id] || []);
                    if (newSet.has(optId)) {
                      newSet.delete(optId);
                    } else {
                      newSet.add(optId);
                    }
                    return { ...prev, [ft.id]: newSet };
                  });
                };
                return (
                  <div key={ft.id} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{ft.name}</Label>
                    <div className="flex flex-wrap gap-2">
                      {options.map((opt: any) => (
                        <label key={opt.id} className="flex items-center gap-1.5 text-sm cursor-pointer" data-testid={`filter-option-${ft.id}-${opt.id}`}>
                          <input
                            type="checkbox"
                            checked={selected.has(opt.id)}
                            onChange={() => toggleOption(opt.id)}
                            className="rounded border-input"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button data-testid="button-save-product" type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BannerForm({ isOpen, onClose, editBanner }: { isOpen: boolean; onClose: () => void; editBanner?: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", imageUrl: "", mobileImageUrl: "", linkUrl: "", sortOrder: "0", active: true });

  useEffect(() => {
    if (editBanner) {
      setForm({
        title: editBanner.title || "", imageUrl: editBanner.imageUrl || "", mobileImageUrl: editBanner.mobileImageUrl || "",
        linkUrl: editBanner.linkUrl || "", sortOrder: String(editBanner.sortOrder || 0), active: editBanner.active !== false,
      });
    } else {
      setForm({ title: "", imageUrl: "", mobileImageUrl: "", linkUrl: "", sortOrder: "0", active: true });
    }
  }, [editBanner, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editBanner) {
        const res = await apiRequest("PUT", `/api/banners/${editBanner.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/banners", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner salvo!" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !mutation.isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, sortOrder: Number(form.sortOrder) }); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Titulo</Label><Input data-testid="input-banner-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>URL da Imagem (Desktop)</Label><Input data-testid="input-banner-image" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>URL da Imagem (Mobile)</Label><Input data-testid="input-banner-mobile-image" value={form.mobileImageUrl} onChange={(e) => setForm({ ...form, mobileImageUrl: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Link</Label><Input data-testid="input-banner-link" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Ordem</Label><Input data-testid="input-banner-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="banner-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="banner-active">Ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button data-testid="button-save-banner" type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VideoForm({ isOpen, onClose, editVideo }: { isOpen: boolean; onClose: () => void; editVideo?: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", embedUrl: "", sortOrder: "0", active: true });

  useEffect(() => {
    if (editVideo) {
      setForm({ title: editVideo.title || "", embedUrl: editVideo.embedUrl || "", sortOrder: String(editVideo.sortOrder || 0), active: editVideo.active !== false });
    } else {
      setForm({ title: "", embedUrl: "", sortOrder: "0", active: true });
    }
  }, [editVideo, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editVideo) {
        const res = await apiRequest("PUT", `/api/videos/${editVideo.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/videos", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({ title: "Video salvo!" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !mutation.isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editVideo ? "Editar Video" : "Novo Video"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, sortOrder: Number(form.sortOrder) }); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Titulo</Label><Input data-testid="input-video-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>URL do Video (embed)</Label><Input data-testid="input-video-url" value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} required placeholder="https://youtube.com/embed/..." /></div>
          <div className="space-y-1.5"><Label>Ordem</Label><Input data-testid="input-video-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="video-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="video-active">Ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button data-testid="button-save-video" type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ editCategory, onSave, onCancel, isPending, isTopLevel }: {
  editCategory: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
  isTopLevel?: boolean;
}) {
  const [name, setName] = useState(editCategory?.name || "");
  const [active, setActive] = useState(editCategory?.active !== false);

  useEffect(() => {
    setName(editCategory?.name || "");
    setActive(editCategory?.active !== false);
  }, [editCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    onSave({
      name,
      slug,
      parentId: isTopLevel ? null : editCategory?.parentId,
      sortOrder: editCategory?.sortOrder ?? 0,
      active,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>{isTopLevel ? "Nome da Categoria" : "Nome da Subcategoria"}</Label>
        <Input data-testid="input-category-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="cat-active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded" />
        <Label htmlFor="cat-active">Ativa</Label>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button data-testid="button-save-category" type="submit" className="flex-1" disabled={isPending || !name.trim()}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <Card data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      return await res.json();
    },
  });

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Painel de Controle</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard title="Produtos Ativos" value={stats.totalProducts} icon={Package} color="bg-primary" />
        <StatCard title="Total Pedidos" value={stats.totalOrders} icon={ClipboardList} color="bg-blue-600" />
        <StatCard title="Clientes" value={stats.totalUsers} icon={Users} color="bg-purple-600" />
        <StatCard title="Total Grupos" value={stats.totalGroups} icon={UserCircle} color="bg-orange-600" />
        <StatCard title="Grupos Abertos" value={stats.openGroups} icon={TrendingUp} color="bg-emerald-600" />
        <StatCard title="Pedidos Pendentes" value={stats.pendingOrders} icon={Clock} color="bg-yellow-600" />
        <StatCard title="Receita Total" value={`R$ ${Number(stats.totalRevenue || 0).toFixed(2)}`} icon={DollarSign} color="bg-green-700" />
      </div>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  editor: "Editor",
  author: "Autor",
  user: "Cliente",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  admin: "Acesso total ao sistema",
  editor: "Pode editar, publicar e excluir conteudo",
  author: "Pode criar conteudo (artigos, midia)",
  user: "Apenas visualizacao e compras",
};

function ClientsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return await res.json();
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao alterar papel");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Papel atualizado", description: `Usuario atualizado para ${ROLE_LABELS[variables.role] || variables.role}` });
      if (viewingUser?.id === variables.userId) {
        setViewingUser((prev: any) => prev ? { ...prev, role: variables.role } : null);
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const users = ((allUsers ?? []) as any[]).filter((u: any) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    );
  });

  const roleCounts = ((allUsers ?? []) as any[]).reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Usuarios ({users.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {["all", "admin", "editor", "author", "user"].map((r) => (
              <Button
                key={r}
                data-testid={`filter-role-${r}`}
                variant={roleFilter === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(r)}
                className="flex-shrink-0"
              >
                {r === "all" ? "Todos" : ROLE_LABELS[r]}
                {r !== "all" && roleCounts[r] ? ` (${roleCounts[r]})` : r === "all" ? ` (${(allUsers ?? []).length})` : ""}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search-clients"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email, telefone..."
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {(["admin", "editor", "author", "user"] as const).map((role) => (
          <Card key={role}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[role]}s</p>
              <p className="text-xl font-bold">{roleCounts[role] || 0}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum usuario encontrado.</TableCell></TableRow>
                ) : (
                  users.map((u: any) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          {u.displayName && <p className="text-xs text-muted-foreground">{u.displayName}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.phone || "-"}</TableCell>
                      <TableCell>
                        <select
                          data-testid={`select-role-${u.id}`}
                          value={u.role}
                          onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value })}
                          disabled={roleMutation.isPending}
                          className="text-xs border rounded-md px-2 py-1 bg-background text-foreground border-border"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="author">Autor</option>
                          <option value="user">Cliente</option>
                        </select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" data-testid={`button-view-user-${u.id}`} onClick={() => setViewingUser(u)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewingUser !== null} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuario</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {(viewingUser.displayName || viewingUser.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold">{viewingUser.name}</h3>
                  {viewingUser.displayName && (
                    <p className="text-sm text-muted-foreground">Apelido: {viewingUser.displayName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingUser.email}</span>
                </div>
                {viewingUser.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{viewingUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground mr-1">Papel:</span>
                  <select
                    data-testid="select-role-detail"
                    value={viewingUser.role}
                    onChange={(e) => roleMutation.mutate({ userId: viewingUser.id, role: e.target.value })}
                    disabled={roleMutation.isPending}
                    className="text-xs border rounded-md px-2 py-1 bg-background text-foreground border-border"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="author">Autor</option>
                    <option value="user">Cliente</option>
                  </select>
                </div>
                <div className="p-2 bg-muted rounded-md text-xs text-muted-foreground">
                  {ROLE_DESCRIPTIONS[viewingUser.role] || "Sem descricao"}
                </div>
              </div>

              {(viewingUser.addressStreet || viewingUser.addressCity) && (
                <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Endereco</p>
                  {viewingUser.addressStreet && (
                    <p>{viewingUser.addressStreet}{viewingUser.addressNumber ? `, ${viewingUser.addressNumber}` : ""}</p>
                  )}
                  {viewingUser.addressComplement && <p>{viewingUser.addressComplement}</p>}
                  {viewingUser.addressDistrict && <p>{viewingUser.addressDistrict}</p>}
                  {viewingUser.addressCity && (
                    <p>{viewingUser.addressCity}{viewingUser.addressState ? ` - ${viewingUser.addressState}` : ""}</p>
                  )}
                  {viewingUser.addressCep && <p>CEP: {viewingUser.addressCep}</p>}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Cadastrado em: {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "N/A"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrderDetailPanel({ order, onStatusChange }: { order: any; onStatusChange: (status: string, reason: string) => void }) {
  const [reason, setReason] = useState("");
  const { data: history } = useQuery({
    queryKey: ["/api/orders", order.id, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${order.id}/history`, { credentials: "include" });
      return await res.json();
    },
  });

  const items = Array.isArray(order.items) ? order.items : [];
  const nextStatuses = DEFAULT_TRANSITIONS[order.status] || [];
  const isOverdue = order.status === "pronto_retirada" && order.pickupDeadline && new Date(order.pickupDeadline) < new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Cliente</p>
          <p className="font-medium">{order.userName || "N/A"}</p>
          <p className="text-xs text-muted-foreground">{order.userEmail}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Total</p>
          <p className="font-bold text-primary">R$ {Number(order.total).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Status Atual</p>
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
            {isOverdue && <AlertTriangle className="w-3 h-3" />}
            {ORDER_STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="text-sm">{order.fulfillmentType === "pickup" ? "Retirada" : "Entrega"}</p>
        </div>
        {order.pickupDeadline && (
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs">Prazo de Retirada</p>
            <p className={`text-sm font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : ""}`}>
              {new Date(order.pickupDeadline).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {isOverdue && " (ATRASADO)"}
            </p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Itens</p>
        <div className="space-y-1">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{item.name} x{item.qty}</span>
              <span className="text-muted-foreground">R$ {(Number(item.price) * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {history && history.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><History className="w-3 h-3" /> Historico</p>
          <div className="space-y-2">
            {(history as any[]).map((h: any) => (
              <div key={h.id} className="flex items-start gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                <div>
                  <span className="font-medium">{ORDER_STATUS_LABELS[h.fromStatus] || h.fromStatus || "Inicio"}</span>
                  <ArrowRight className="w-3 h-3 inline mx-1" />
                  <span className="font-medium">{ORDER_STATUS_LABELS[h.toStatus] || h.toStatus}</span>
                  <span className="text-muted-foreground ml-1">por {h.changedByName}</span>
                  {h.reason && <span className="text-muted-foreground ml-1">- {h.reason}</span>}
                  <p className="text-muted-foreground">{new Date(h.createdAt).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nextStatuses.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Alterar Status</p>
          <Textarea
            data-testid="input-status-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da alteracao (opcional)..."
            className="text-sm mb-2"
          />
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((ns: string) => (
              <Button
                key={ns}
                size="sm"
                variant={ns === "cancelado" ? "destructive" : "default"}
                data-testid={`button-change-to-${ns}`}
                onClick={() => onStatusChange(ns, reason)}
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1" />
                {ORDER_STATUS_LABELS[ns] || ns}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSettingsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/order-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/order-settings", { credentials: "include" });
      return await res.json();
    },
  });

  const [pickupWindowHours, setPickupWindowHours] = useState(72);
  const [toleranceHours, setToleranceHours] = useState(24);
  const [adminOverride, setAdminOverride] = useState(true);

  useEffect(() => {
    if (settings) {
      setPickupWindowHours(settings.pickupWindowHours || 72);
      setToleranceHours(settings.toleranceHours || 24);
      setAdminOverride(settings.adminOverride !== false);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/admin/order-settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/order-settings"] });
      toast({ title: "Configuracoes salvas!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <>
      <h2 className="text-lg font-bold text-foreground mb-4">Configuracoes de Pedidos</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Prazos de Retirada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div>
              <Label className="text-xs">Janela de Retirada (horas)</Label>
              <Input
                data-testid="input-pickup-window"
                type="number"
                min={1}
                max={720}
                value={pickupWindowHours}
                onChange={(e) => setPickupWindowHours(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Tempo que o cliente tem para retirar o pedido apos ficar pronto</p>
            </div>
            <div>
              <Label className="text-xs">Tolerancia Adicional (horas)</Label>
              <Input
                data-testid="input-tolerance"
                type="number"
                min={0}
                max={168}
                value={toleranceHours}
                onChange={(e) => setToleranceHours(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground mt-1">Horas extras antes de marcar como nao retirado</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Controle de Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="flex items-center gap-2">
              <input
                data-testid="input-admin-override"
                type="checkbox"
                checked={adminOverride}
                onChange={(e) => setAdminOverride(e.target.checked)}
                className="rounded border-input"
              />
              <Label className="text-xs">Admin pode pular etapas de status</Label>
            </div>
            <p className="text-[11px] text-muted-foreground">Quando ativado, admin pode alterar status para qualquer valor, ignorando o fluxo normal</p>

            <div className="border-t pt-3">
              <p className="text-xs font-medium mb-2">Fluxo de Status</p>
              <div className="space-y-1.5">
                {Object.entries(DEFAULT_TRANSITIONS).map(([from, toList]) => (
                  <div key={from} className="flex items-center gap-1 text-xs flex-wrap">
                    <span className={`rounded-md px-1.5 py-0.5 ${ORDER_STATUS_COLORS[from] || ""}`}>
                      {ORDER_STATUS_LABELS[from]}
                    </span>
                    {toList.length > 0 ? (
                      <>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        {toList.map((to: string) => (
                          <span key={to} className={`rounded-md px-1.5 py-0.5 ${ORDER_STATUS_COLORS[to] || ""}`}>
                            {ORDER_STATUS_LABELS[to]}
                          </span>
                        ))}
                      </>
                    ) : (
                      <span className="text-muted-foreground ml-1">(final)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Button
          data-testid="button-save-order-settings"
          onClick={() => updateSettings.mutate({ pickupWindowHours, toleranceHours, adminOverride })}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Salvar Configuracoes
        </Button>
      </div>
    </>
  );
}

function SystemTab() {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["/api/admin/system-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/system-health", { credentials: "include" });
      return await res.json();
    },
    refetchInterval: 30000,
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  if (isLoading || !health) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isOnline = health.status === "online";
  const dbConnected = health.database?.connected;
  const counts = health.counts || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-foreground">Monitoramento do Sistema</h2>
        <Button data-testid="button-refresh-health" variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCcw className="w-4 h-4 mr-1.5" />}
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card data-testid="card-site-status">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Site</CardTitle>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
              <span className="text-lg font-bold">{isOnline ? "Online" : "Offline"}</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Tempo ativo: {formatUptime(health.uptime)}</p>
              <p>Resposta API: {health.performance?.apiResponseMs}ms</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-db-status">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <Database className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${dbConnected ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
              <span className="text-lg font-bold">{dbConnected ? "Conectado" : "Desconectado"}</span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Tamanho: {health.database?.sizeMB} MB</p>
              <p>Resposta: {health.performance?.dbResponseMs}ms</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-server-status">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servidor</CardTitle>
            <Server className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Node.js: <span className="font-medium text-foreground">{health.nodeVersion}</span></p>
              <p className="text-muted-foreground">Memoria RAM: <span className="font-medium text-foreground">{health.memoryUsage?.rss} MB</span></p>
              <p className="text-muted-foreground">Heap: <span className="font-medium text-foreground">{health.memoryUsage?.heapUsed}/{health.memoryUsage?.heapTotal} MB</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(counts.overdue_pickups > 0 || counts.low_stock_products > 0) && (
        <Card className="border-yellow-500/50">
          <CardHeader className="flex flex-row items-center gap-1 space-y-0 pb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <CardTitle className="text-sm font-medium text-yellow-600">Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 text-sm">
              {counts.overdue_pickups > 0 && (
                <div className="flex items-center gap-2" data-testid="alert-overdue">
                  <Badge variant="destructive">{counts.overdue_pickups}</Badge>
                  <span>pedido(s) com retirada atrasada</span>
                </div>
              )}
              {counts.low_stock_products > 0 && (
                <div className="flex items-center gap-2" data-testid="alert-low-stock">
                  <Badge className="bg-yellow-500 text-white">{counts.low_stock_products}</Badge>
                  <span>produto(s) com estoque baixo (5 ou menos)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-visitors">
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
          <Eye className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-xl font-bold">{counts.visits_today}</p>
              <p className="text-xs text-muted-foreground">{counts.unique_visitors_today} unicos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ultimos 7 dias</p>
              <p className="text-xl font-bold">{counts.visits_week}</p>
              <p className="text-xs text-muted-foreground">{counts.unique_visitors_week} unicos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ultimos 30 dias</p>
              <p className="text-xl font-bold">{counts.visits_month}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{counts.total_visits}</p>
              <p className="text-xs text-muted-foreground">{counts.unique_visitors} unicos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Produtos Ativos</p>
            <p className="text-xl font-bold">{counts.active_products}</p>
            <p className="text-xs text-muted-foreground">{counts.inactive_products} inativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Pedidos Hoje</p>
            <p className="text-xl font-bold">{counts.orders_today}</p>
            <p className="text-xs text-muted-foreground">{counts.total_orders} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="text-xl font-bold">{counts.total_customers}</p>
            <p className="text-xs text-muted-foreground">+{counts.new_customers_week} esta semana</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Grupos Abertos</p>
            <p className="text-xl font-bold">{counts.open_groups}</p>
            <p className="text-xs text-muted-foreground">{counts.closed_groups} fechados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs text-muted-foreground">Receita 30 dias</p>
            <p className="text-xl font-bold">R$ {Number(counts.revenue_30d || 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">R$ {Number(counts.total_revenue || 0).toFixed(0)} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recursos do Sistema</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                { label: "Categorias ativas", value: counts.active_categories, icon: FolderTree },
                { label: "Pontos de retirada", value: counts.active_pickup_points, icon: MapPin },
                { label: "Banners ativos", value: counts.active_banners, icon: Image },
                { label: "Videos ativos", value: counts.active_videos, icon: Video },
                { label: "Pedidos pendentes", value: counts.pending_orders, icon: Clock },
                { label: "Pedidos cancelados", value: counts.cancelled_orders, icon: XCircle },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividade Recente</CardTitle>
            <History className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm max-h-[250px] overflow-y-auto">
              {(health.recentActivity || []).length === 0 && (
                <p className="text-muted-foreground text-xs">Nenhuma atividade registrada</p>
              )}
              {(health.recentActivity || []).map((activity: any, i: number) => (
                <div key={i} className="flex items-start gap-2 pb-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">
                      <span className="font-medium">{activity.user_name}</span>
                      {" "}{activity.action}{" "}
                      <span className="text-muted-foreground">{activity.entity}</span>
                      {activity.entity_id ? ` #${activity.entity_id}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Seguranca</CardTitle>
          <Shield className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Protecoes Ativas</h4>
              {[
                "SSL/HTTPS automatico",
                "Headers de seguranca (Helmet)",
                "Protecao CSRF",
                "Protecao XSS (sanitizacao)",
                "Rate Limiting (limite de requisicoes)",
                "Senhas criptografadas (bcrypt)",
                "Validacao de dados (Zod)",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Backup e Dados</h4>
              {[
                "Backup automatico (PostgreSQL/Neon)",
                "Rollback de banco disponivel",
                "Auditoria de acoes admin",
                "Sessoes seguras no servidor",
                "Controle de acesso por perfil",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <AnalyticsSection />

      <p className="text-xs text-muted-foreground text-center">
        Atualizado automaticamente a cada 30 segundos
      </p>
    </div>
  );
}

function AnalyticsSection() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      return await res.json();
    },
    refetchInterval: 60000,
  });

  if (isLoading || !analytics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const topPages = analytics.topPages || [];
  const topReferrers = analytics.topReferrers || [];
  const dailyViews = analytics.dailyViews || [];
  const maxViews = Math.max(...dailyViews.map((d: any) => d.views || 0), 1);

  return (
    <>
      <h3 className="text-base font-bold text-foreground">Analise de Trafego (30 dias)</h3>

      {dailyViews.length > 0 && (
        <Card data-testid="card-daily-views">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizacoes por Dia</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-32">
              {dailyViews.map((d: any, i: number) => {
                const height = Math.max((d.views / maxViews) * 100, 4);
                const dateLabel = new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative" title={`${dateLabel}: ${d.views} visitas (${d.unique_visitors} unicos)`}>
                    <div className="w-full bg-primary/80 rounded-t-sm transition-all" style={{ height: `${height}%` }} />
                    {i % Math.max(1, Math.floor(dailyViews.length / 7)) === 0 && (
                      <span className="text-[8px] text-muted-foreground mt-1 leading-none">{dateLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card data-testid="card-top-pages">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paginas Mais Visitadas</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados ainda</p>
            ) : (
              <div className="space-y-2 text-sm max-h-[250px] overflow-y-auto">
                {topPages.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                      <span className="truncate text-foreground text-xs">{p.page || "/"}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium">{p.views}</span>
                      <span className="text-[10px] text-muted-foreground">({p.unique_visitors} un.)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-top-referrers">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Origens de Trafego</CardTitle>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topReferrers.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem dados de origem ainda</p>
            ) : (
              <div className="space-y-2 text-sm max-h-[250px] overflow-y-auto">
                {topReferrers.map((r: any, i: number) => {
                  let label = r.referrer;
                  try { label = new URL(r.referrer).hostname; } catch {}
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                        <span className="truncate text-foreground text-xs">{label}</span>
                      </div>
                      <span className="text-xs font-medium flex-shrink-0">{r.visits}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ArticlesTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: articles, isLoading } = useQuery<any[]>({ queryKey: ["/api/articles"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", imageUrl: "", published: false });

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/(^-|-$)/g, "");

  const openNew = () => {
    setEditingArticle(null);
    setSlugManual(false);
    setForm({ title: "", slug: "", excerpt: "", content: "", imageUrl: "", published: false });
    setDialogOpen(true);
  };

  const openEdit = (article: any) => {
    setEditingArticle(article);
    setSlugManual(true);
    setForm({
      title: article.title || "",
      slug: article.slug || "",
      excerpt: article.excerpt || "",
      content: article.content || "",
      imageUrl: article.imageUrl || "",
      published: article.published === true,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingArticle) {
        const res = await apiRequest("PUT", `/api/articles/${editingArticle.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/articles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: editingArticle ? "Artigo atualizado!" : "Artigo criado!" });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Artigo excluido!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleTitleChange = (title: string) => {
    if (!slugManual) {
      setForm((f) => ({ ...f, title, slug: generateSlug(title) }));
    } else {
      setForm((f) => ({ ...f, title }));
    }
  };

  const handleSlugChange = (slug: string) => {
    setSlugManual(slug !== "");
    setForm((f) => ({ ...f, slug }));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Artigos ({articles?.length || 0})</h2>
        <Button size="sm" data-testid="button-new-article" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo Artigo
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titulo</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Publicado</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!articles || articles.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum artigo cadastrado.</TableCell></TableRow>
          ) : (
            articles.map((article: any) => (
              <TableRow key={article.id} data-testid={`row-article-${article.id}`}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{article.slug}</TableCell>
                <TableCell>
                  <Badge variant={article.published ? "default" : "secondary"} className="text-[10px]">
                    {article.published ? "Sim" : "Nao"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString("pt-BR") : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" data-testid={`button-edit-article-${article.id}`} onClick={() => openEdit(article)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-article-${article.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
                          <AlertDialogDescription>O artigo sera removido permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(article.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saveMutation.isPending && !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titulo</Label>
              <Input data-testid="input-article-title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input data-testid="input-article-slug" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Resumo</Label>
              <Textarea data-testid="input-article-excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Conteudo</Label>
              <Textarea data-testid="input-article-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da Imagem</Label>
              <Input data-testid="input-article-image" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-2">
              <input data-testid="input-article-published" type="checkbox" id="article-published" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded border-input" />
              <Label htmlFor="article-published">Publicado</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancelar</Button>
              <Button data-testid="button-save-article" type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MediaTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: media, isLoading } = useQuery<any[]>({ queryKey: ["/api/media"] });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file || !file.size) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload falhou");
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Upload concluido!" });
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Midia excluida!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada!" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Midia ({media?.length || 0})</h2>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
            <input data-testid="input-media-file" type="file" name="file" accept="image/*" required className="text-sm" />
            <Button data-testid="button-upload-media" type="submit" size="sm" disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>

      {!media || media.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhuma midia cadastrada.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {media.map((asset: any) => (
            <Card key={asset.id} data-testid={`card-media-${asset.id}`}>
              <CardContent className="p-3 space-y-2">
                <img src={asset.url} alt={asset.filename} className="w-full h-28 rounded-md object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x112"; }} />
                <p className="text-xs font-medium truncate">{asset.filename}</p>
                <p className="text-[11px] text-muted-foreground">{asset.size ? formatSize(asset.size) : ""}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" data-testid={`button-copy-url-${asset.id}`} onClick={() => copyUrl(asset.url)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-media-${asset.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir midia?</AlertDialogTitle>
                        <AlertDialogDescription>A midia sera removida permanentemente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(asset.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function NavigationTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: links, isLoading } = useQuery<any[]>({ queryKey: ["/api/navigation-links"] });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [form, setForm] = useState({ label: "", url: "", location: "header", sortOrder: "0", active: true });

  const openNew = () => {
    setEditingLink(null);
    setForm({ label: "", url: "", location: "header", sortOrder: "0", active: true });
    setDialogOpen(true);
  };

  const openEdit = (link: any) => {
    setEditingLink(link);
    setForm({
      label: link.label || "",
      url: link.url || "",
      location: link.location || "header",
      sortOrder: String(link.sortOrder ?? 0),
      active: link.active !== false,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, sortOrder: Number(data.sortOrder) };
      if (editingLink) {
        const res = await apiRequest("PUT", `/api/navigation-links/${editingLink.id}`, payload);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/navigation-links", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigation-links"] });
      toast({ title: editingLink ? "Link atualizado!" : "Link criado!" });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/navigation-links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/navigation-links"] });
      toast({ title: "Link excluido!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Links de Navegacao ({links?.length || 0})</h2>
        <Button size="sm" data-testid="button-new-link" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Novo Link
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead>Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!links || links.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum link cadastrado.</TableCell></TableRow>
          ) : (
            links.map((link: any) => (
              <TableRow key={link.id} data-testid={`row-link-${link.id}`}>
                <TableCell className="font-medium">{link.label}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{link.url}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">{link.location}</Badge>
                </TableCell>
                <TableCell className="text-sm">{link.sortOrder}</TableCell>
                <TableCell>
                  <Badge variant={link.active ? "default" : "secondary"} className="text-[10px]">
                    {link.active ? "Sim" : "Nao"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" data-testid={`button-edit-link-${link.id}`} onClick={() => openEdit(link)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-link-${link.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir link?</AlertDialogTitle>
                          <AlertDialogDescription>O link sera removido permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(link.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saveMutation.isPending && !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar Link" : "Novo Link"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input data-testid="input-link-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input data-testid="input-link-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Local</Label>
                <select data-testid="select-link-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Ordem</Label>
                <Input data-testid="input-link-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input data-testid="input-link-active" type="checkbox" id="link-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-input" />
              <Label htmlFor="link-active">Ativo</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancelar</Button>
              <Button data-testid="button-save-link" type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FiltersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: filterTypes, isLoading: typesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/filter-types"],
  });

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const { data: filterOptions, isLoading: optionsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/filter-options", selectedTypeId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/filter-options?filterTypeId=${selectedTypeId}`, { credentials: "include" });
      return await res.json();
    },
    enabled: selectedTypeId !== null,
  });

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState({ name: "", slug: "", inputType: "select", sortOrder: "0", active: true, categoryIds: [] as number[] });
  const [slugManual, setSlugManual] = useState(false);

  const { data: allCategories } = useQuery<any[]>({
    queryKey: ["/api/categories", "all-for-filters"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      const all = await res.json();
      const topLevel = all.filter((c: any) => !c.parentId);
      const result: any[] = [];
      topLevel.forEach((parent: any) => {
        result.push(parent);
        const children = all.filter((c: any) => c.parentId === parent.id).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
        children.forEach((child: any) => result.push({ ...child, name: `  ${parent.name} > ${child.name}` }));
      });
      return result;
    },
  });

  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [optionForm, setOptionForm] = useState({ label: "", value: "", sortOrder: "0", active: true });

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openNewType = () => {
    setEditingType(null);
    setSlugManual(false);
    setTypeForm({ name: "", slug: "", inputType: "select", sortOrder: "0", active: true, categoryIds: [] });
    setTypeDialogOpen(true);
  };

  const openEditType = (ft: any) => {
    setEditingType(ft);
    setSlugManual(true);
    setTypeForm({
      name: ft.name || "",
      slug: ft.slug || "",
      inputType: ft.inputType || "select",
      sortOrder: String(ft.sortOrder || 0),
      active: ft.active !== false,
      categoryIds: ft.categoryIds || [],
    });
    setTypeDialogOpen(true);
  };

  const openNewOption = () => {
    setEditingOption(null);
    setOptionForm({ label: "", value: "", sortOrder: "0", active: true });
    setOptionDialogOpen(true);
  };

  const openEditOption = (opt: any) => {
    setEditingOption(opt);
    setOptionForm({
      label: opt.label || "",
      value: opt.value || "",
      sortOrder: String(opt.sortOrder || 0),
      active: opt.active !== false,
    });
    setOptionDialogOpen(true);
  };

  const saveTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingType) {
        const res = await apiRequest("PUT", `/api/admin/filter-types/${editingType.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/admin/filter-types", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/filter-types"] });
      toast({ title: editingType ? "Tipo de filtro atualizado!" : "Tipo de filtro criado!" });
      setTypeDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/filter-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/filter-types"] });
      toast({ title: "Tipo de filtro removido!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const saveOptionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOption) {
        const res = await apiRequest("PUT", `/api/admin/filter-options/${editingOption.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/admin/filter-options", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/filter-options", selectedTypeId] });
      toast({ title: editingOption ? "Opcao atualizada!" : "Opcao criada!" });
      setOptionDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/filter-options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/filter-options", selectedTypeId] });
      toast({ title: "Opcao removida!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleTypeNameChange = (name: string) => {
    if (!slugManual) {
      setTypeForm((f) => ({ ...f, name, slug: generateSlug(name) }));
    } else {
      setTypeForm((f) => ({ ...f, name }));
    }
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTypeMutation.mutate({
      name: typeForm.name,
      slug: typeForm.slug,
      inputType: typeForm.inputType,
      sortOrder: Number(typeForm.sortOrder),
      active: typeForm.active,
      categoryIds: typeForm.categoryIds.length > 0 ? typeForm.categoryIds : null,
    });
  };

  const handleOptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveOptionMutation.mutate({
      filterTypeId: selectedTypeId,
      label: optionForm.label,
      value: optionForm.value,
      sortOrder: Number(optionForm.sortOrder),
      active: optionForm.active,
    });
  };

  if (typesLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-foreground">Tipos de Filtro ({filterTypes?.length || 0})</h2>
            <Button size="sm" data-testid="button-new-filter-type" onClick={openNewType}>
              <Plus className="w-4 h-4 mr-1" /> Novo Tipo de Filtro
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Tipo Input</TableHead>
                      <TableHead>Categorias</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!filterTypes || filterTypes.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nenhum tipo de filtro cadastrado.</TableCell></TableRow>
                    ) : (
                      filterTypes.map((ft: any) => (
                        <TableRow key={ft.id} data-testid={`row-filter-type-${ft.id}`}>
                          <TableCell className="font-medium text-sm">{ft.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{ft.slug}</TableCell>
                          <TableCell className="text-sm">{ft.inputType}</TableCell>
                          <TableCell className="text-sm">
                            {ft.categoryIds && ft.categoryIds.length > 0
                              ? ft.categoryIds.map((cId: number) => (allCategories || []).find((c: any) => c.id === cId)?.name || cId).join(", ")
                              : <span className="text-muted-foreground">Todas</span>
                            }
                          </TableCell>
                          <TableCell className="text-sm">{ft.sortOrder}</TableCell>
                          <TableCell>
                            <Badge variant={ft.active ? "default" : "secondary"} className="text-[10px]">{ft.active ? "Ativo" : "Inativo"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" data-testid={`button-edit-filter-type-${ft.id}`} onClick={() => openEditType(ft)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-filter-type-${ft.id}`}><Trash2 className="w-4 h-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir tipo de filtro?</AlertDialogTitle>
                                    <AlertDialogDescription>Essa acao nao pode ser desfeita. O tipo "{ft.name}" e todas suas opcoes serao excluidos.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteTypeMutation.mutate(ft.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-foreground">Opcoes de Filtro</h2>
              <select
                data-testid="select-filter-type-for-options"
                value={selectedTypeId ?? ""}
                onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : null)}
                className="text-sm border border-input rounded-md px-2 py-1.5 bg-background"
              >
                <option value="">Selecionar tipo...</option>
                {(filterTypes || []).map((ft: any) => (
                  <option key={ft.id} value={String(ft.id)}>{ft.name}</option>
                ))}
              </select>
            </div>
            {selectedTypeId && (
              <Button size="sm" data-testid="button-new-filter-option" onClick={openNewOption}>
                <Plus className="w-4 h-4 mr-1" /> Nova Opcao
              </Button>
            )}
          </div>

          {selectedTypeId ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Ordem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optionsLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                      ) : !filterOptions || filterOptions.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhuma opcao cadastrada para este filtro.</TableCell></TableRow>
                      ) : (
                        filterOptions.map((opt: any) => (
                          <TableRow key={opt.id} data-testid={`row-filter-option-${opt.id}`}>
                            <TableCell className="font-medium text-sm">{opt.label}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{opt.value}</TableCell>
                            <TableCell className="text-sm">{opt.sortOrder}</TableCell>
                            <TableCell>
                              <Badge variant={opt.active ? "default" : "secondary"} className="text-[10px]">{opt.active ? "Ativo" : "Inativo"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" data-testid={`button-edit-filter-option-${opt.id}`} onClick={() => openEditOption(opt)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-filter-option-${opt.id}`}><Trash2 className="w-4 h-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir opcao?</AlertDialogTitle>
                                      <AlertDialogDescription>Essa acao nao pode ser desfeita. A opcao "{opt.label}" sera excluida.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteOptionMutation.mutate(opt.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Selecione um tipo de filtro acima para ver suas opcoes.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={typeDialogOpen} onOpenChange={(open) => !saveTypeMutation.isPending && !open && setTypeDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingType ? "Editar Tipo de Filtro" : "Novo Tipo de Filtro"}</DialogTitle></DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input data-testid="input-filter-type-name" value={typeForm.name} onChange={(e) => handleTypeNameChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input data-testid="input-filter-type-slug" value={typeForm.slug} onChange={(e) => { setSlugManual(true); setTypeForm((f) => ({ ...f, slug: e.target.value })); }} required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Input</Label>
              <select data-testid="select-filter-input-type" value={typeForm.inputType} onChange={(e) => setTypeForm((f) => ({ ...f, inputType: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
                <option value="range">Range</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input data-testid="input-filter-type-order" type="number" value={typeForm.sortOrder} onChange={(e) => setTypeForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Categorias vinculadas (opcional)</Label>
              <p className="text-xs text-muted-foreground">Se vazio, o filtro aparece para todas as categorias. Se selecionado, aparece apenas nas categorias escolhidas.</p>
              <div className="max-h-40 overflow-y-auto border border-input rounded-md p-2 space-y-1">
                {(allCategories || []).map((cat: any) => {
                  const isChecked = typeForm.categoryIds.includes(cat.id);
                  return (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        data-testid={`checkbox-filter-category-${cat.id}`}
                        checked={isChecked}
                        onChange={() => {
                          setTypeForm((f) => ({
                            ...f,
                            categoryIds: isChecked
                              ? f.categoryIds.filter((id) => id !== cat.id)
                              : [...f.categoryIds, cat.id],
                          }));
                        }}
                        className="rounded border-input"
                      />
                      <span>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch data-testid="switch-filter-type-active" checked={typeForm.active} onCheckedChange={(checked) => setTypeForm((f) => ({ ...f, active: checked }))} />
              <Label>Ativo</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setTypeDialogOpen(false)}>Cancelar</Button>
              <Button data-testid="button-save-filter-type" type="submit" className="flex-1" disabled={saveTypeMutation.isPending}>
                {saveTypeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={optionDialogOpen} onOpenChange={(open) => !saveOptionMutation.isPending && !open && setOptionDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingOption ? "Editar Opcao" : "Nova Opcao"}</DialogTitle></DialogHeader>
          <form onSubmit={handleOptionSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input data-testid="input-filter-option-label" value={optionForm.label} onChange={(e) => setOptionForm((f) => ({ ...f, label: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input data-testid="input-filter-option-value" value={optionForm.value} onChange={(e) => setOptionForm((f) => ({ ...f, value: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Ordem</Label>
              <Input data-testid="input-filter-option-order" type="number" value={optionForm.sortOrder} onChange={(e) => setOptionForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch data-testid="switch-filter-option-active" checked={optionForm.active} onCheckedChange={(checked) => setOptionForm((f) => ({ ...f, active: checked }))} />
              <Label>Ativo</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOptionDialogOpen(false)}>Cancelar</Button>
              <Button data-testid="button-save-filter-option" type="submit" className="flex-1" disabled={saveOptionMutation.isPending}>
                {saveOptionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminTabBar({ tabs, tab, setTab }: { tabs: { key: string; label: string; icon: any }[]; tab: string; setTab: (t: any) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="relative mb-4">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-r from-background via-background to-transparent"
          data-testid="button-tabs-scroll-left"
          aria-label="Rolar abas para esquerda"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" style={{ scrollbarWidth: "thin" }}>
        {tabs.map((t) => (
          <Button key={t.key} data-testid={`tab-${t.key}`} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="flex-shrink-0">
            <t.icon className="w-4 h-4 mr-1.5" />
            {t.label}
          </Button>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-l from-background via-background to-transparent"
          data-testid="button-tabs-scroll-right"
          aria-label="Rolar abas para direita"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function SponsorBannersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sponsorBanners, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/sponsor-banners"],
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "sidebar", sortOrder: "0", active: true });

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", imageUrl: "", linkUrl: "", position: "sidebar", sortOrder: "0", active: true });
    setDialogOpen(true);
  };

  const openEdit = (sb: any) => {
    setEditing(sb);
    setForm({
      title: sb.title || "",
      imageUrl: sb.imageUrl || "",
      linkUrl: sb.linkUrl || "",
      position: sb.position || "sidebar",
      sortOrder: String(sb.sortOrder || 0),
      active: sb.active !== false,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editing) {
        const res = await apiRequest("PUT", `/api/admin/sponsor-banners/${editing.id}`, data);
        return await res.json();
      }
      const res = await apiRequest("POST", "/api/admin/sponsor-banners", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsor-banners"] });
      toast({ title: editing ? "Patrocinador atualizado!" : "Patrocinador criado!" });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/sponsor-banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsor-banners"] });
      toast({ title: "Patrocinador removido!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest("PUT", `/api/admin/sponsor-banners/${id}`, { active });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsor-banners"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, sortOrder: Number(form.sortOrder) });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-sponsor-banners-title">Patrocinadores</h2>
        <Button data-testid="button-new-sponsor-banner" onClick={openNew}><Plus className="w-4 h-4 mr-1.5" />Novo Patrocinador</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Posicao</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sponsorBanners || []).length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum patrocinador cadastrado</TableCell></TableRow>
            ) : (
              (sponsorBanners || []).map((sb: any) => (
                <TableRow key={sb.id} data-testid={`row-sponsor-banner-${sb.id}`}>
                  <TableCell>
                    {sb.imageUrl ? (
                      <img src={sb.imageUrl} alt={sb.title || "Sponsor"} className="w-16 h-10 object-cover rounded" data-testid={`img-sponsor-banner-${sb.id}`} />
                    ) : (
                      <div className="w-16 h-10 bg-muted rounded flex items-center justify-center"><Image className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </TableCell>
                  <TableCell data-testid={`text-sponsor-title-${sb.id}`}>{sb.title || "-"}</TableCell>
                  <TableCell>
                    {sb.linkUrl ? (
                      <a href={sb.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 underline truncate max-w-[200px] block" data-testid={`link-sponsor-${sb.id}`}>
                        {sb.linkUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" data-testid={`badge-sponsor-position-${sb.id}`}>
                      {sb.position === "sidebar" ? "Lateral" : "Inline"}
                    </Badge>
                  </TableCell>
                  <TableCell data-testid={`text-sponsor-order-${sb.id}`}>{sb.sortOrder}</TableCell>
                  <TableCell>
                    <Switch
                      data-testid={`switch-sponsor-active-${sb.id}`}
                      checked={sb.active}
                      onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: sb.id, active: checked })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" data-testid={`button-edit-sponsor-${sb.id}`} onClick={() => openEdit(sb)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-sponsor-${sb.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover patrocinador?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction data-testid={`button-confirm-delete-sponsor-${sb.id}`} onClick={() => deleteMutation.mutate(sb.id)}>Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saveMutation.isPending && !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Editar Patrocinador" : "Novo Patrocinador"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titulo</Label>
              <Input data-testid="input-sponsor-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>URL da Imagem</Label>
              <Input data-testid="input-sponsor-image-url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>URL do Link</Label>
              <Input data-testid="input-sponsor-link-url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://... (opcional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Posicao</Label>
                <select data-testid="select-sponsor-position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="sidebar">Lateral</option>
                  <option value="inline">Inline</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Ordem</Label>
                <Input data-testid="input-sponsor-sort-order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sponsor-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" data-testid="input-sponsor-active" />
              <Label htmlFor="sponsor-active">Ativo</Label>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button data-testid="button-save-sponsor" type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProductApprovalsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: pendingProducts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-products"],
  });

  const approveMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", `/api/admin/products/${productId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Produto aprovado!", description: "O produto agora esta visivel na loja." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("POST", `/api/admin/products/${productId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-products"] });
      toast({ title: "Produto rejeitado", description: "O produto foi removido." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const items = pendingProducts || [];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="text-approvals-title">
        Produtos Aguardando Aprovacao ({items.length})
      </h2>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Nenhum produto pendente de aprovacao</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((product: any) => (
            <Card key={product.id} data-testid={`card-pending-product-${product.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4 flex-wrap">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-20 h-20 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Categoria: {product.category}</span>
                      <span>Preco: R$ {Number(product.originalPrice).toFixed(2)}</span>
                      <span>Grupo: R$ {Number(product.groupPrice).toFixed(2)}</span>
                      <span>Estoque: {product.stock}</span>
                      {product.brand && <span>Marca: {product.brand}</span>}
                    </div>
                    {product.creatorName && (
                      <p className="text-xs text-muted-foreground">
                        Enviado por: <span className="font-medium">{product.creatorName}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <Button
                      size="sm"
                      data-testid={`button-approve-product-${product.id}`}
                      onClick={() => approveMutation.mutate(product.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-reject-product-${product.id}`}
                      onClick={() => rejectMutation.mutate(product.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PartnersTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: allUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
  });
  const { data: pickupPoints } = useQuery<any[]>({
    queryKey: ["/api/pickup-points"],
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", pickupPointId: "" });

  const partners = (allUsers || []).filter((u: any) => u.role === "parceiro");

  const getPickupPointName = (ppId: number | null) => {
    if (!ppId || !pickupPoints) return "-";
    const pp = pickupPoints.find((p: any) => p.id === ppId);
    return pp ? pp.name : "-";
  };

  const openNew = () => {
    setForm({ name: "", email: "", password: "", phone: "", pickupPointId: "" });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/partners", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Parceiro criado com sucesso!" });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      pickupPointId: form.pickupPointId ? Number(form.pickupPointId) : undefined,
    });
  };

  if (usersLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <h2 className="text-lg font-semibold" data-testid="text-partners-title">Parceiros</h2>
        <Button data-testid="button-new-partner" onClick={openNew}><Plus className="w-4 h-4 mr-1.5" />Novo Parceiro</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Ponto de Retirada</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum parceiro cadastrado</TableCell></TableRow>
            ) : (
              partners.map((p: any) => (
                <TableRow key={p.id} data-testid={`row-partner-${p.id}`}>
                  <TableCell data-testid={`text-partner-name-${p.id}`}>{p.name}</TableCell>
                  <TableCell data-testid={`text-partner-email-${p.id}`}>{p.email}</TableCell>
                  <TableCell data-testid={`text-partner-phone-${p.id}`}>{p.phone || "-"}</TableCell>
                  <TableCell data-testid={`text-partner-pickup-${p.id}`}>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {getPickupPointName(p.pickupPointId)}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-partner-created-${p.id}`}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !createMutation.isPending && !open && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Parceiro</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input data-testid="input-partner-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input data-testid="input-partner-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input data-testid="input-partner-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input data-testid="input-partner-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ponto de Retirada</Label>
              <select data-testid="select-partner-pickup-point" value={form.pickupPointId} onChange={(e) => setForm({ ...form, pickupPointId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" required>
                <option value="">Selecionar...</option>
                {(pickupPoints || []).filter((pp: any) => pp.active).map((pp: any) => (
                  <option key={pp.id} value={String(pp.id)}>{pp.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button data-testid="button-save-partner" type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Criar Parceiro
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function Admin() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [viewingGroupMembers, setViewingGroupMembers] = useState<number | null>(null);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingCategoryIsTopLevel, setEditingCategoryIsTopLevel] = useState(false);
  const [selectedParentCat, setSelectedParentCat] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [viewingOrderDetail, setViewingOrderDetail] = useState<any>(null);
  const [statusChangeReason, setStatusChangeReason] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products/all"],
    queryFn: async () => {
      const res = await fetch("/api/products/all", { credentials: "include" });
      return await res.json();
    },
  });
  const deleteProduct = useDeleteProduct();
  const { data: allGroups } = useGroups();
  const updateGroupStatus = useUpdateGroupStatus();

  const { data: banners } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => { const res = await fetch("/api/banners", { credentials: "include" }); return await res.json(); },
  });

  const { data: videos } = useQuery({
    queryKey: ["/api/videos"],
    queryFn: async () => { const res = await fetch("/api/videos", { credentials: "include" }); return await res.json(); },
  });

  const { data: allOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders", "all"],
    queryFn: async () => {
      const res = await fetch("/api/orders?all=true", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: tab === "orders",
  });

  const { data: groupMembers } = useQuery({
    queryKey: ["/api/groups", viewingGroupMembers, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${viewingGroupMembers}/members`, { credentials: "include" });
      return await res.json();
    },
    enabled: viewingGroupMembers !== null,
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/banners/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/banners"] }),
  });

  const deleteVideo = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/videos/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/videos"] }),
  });

  const { data: pickupPoints } = useQuery({
    queryKey: ["/api/pickup-points"],
    queryFn: async () => { const res = await fetch("/api/pickup-points", { credentials: "include" }); return await res.json(); },
    enabled: tab === "pickup",
  });

  const createPickupPoint = useMutation({
    mutationFn: async (data: any) => { const res = await apiRequest("POST", "/api/pickup-points", data); return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pickup-points"] }); toast({ title: "Ponto de retirada criado!" }); },
    onError: (err: any) => { toast({ title: "Erro", description: parseApiError(err), variant: "destructive" }); },
  });

  const updatePickupPoint = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => { const res = await apiRequest("PUT", `/api/pickup-points/${id}`, data); return await res.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pickup-points"] }); toast({ title: "Ponto atualizado!" }); },
    onError: (err: any) => { toast({ title: "Erro", description: parseApiError(err), variant: "destructive" }); },
  });

  const deletePickupPoint = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/pickup-points/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/pickup-points"] }); toast({ title: "Ponto excluido!" }); },
  });

  const [pickupFormOpen, setPickupFormOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState<any>(null);

  const { data: allCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: "include" });
      return await res.json();
    },
  });

  const topLevelCategories = ((allCategories ?? []) as any[]).filter((c: any) => c.parentId === null);
  const getSubcategories = (parentId: number) => ((allCategories ?? []) as any[]).filter((c: any) => c.parentId === parentId);

  const createCategory = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria criada!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria atualizada!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Categoria removida!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status, reason: reason || "" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders/overdue"] });
      setStatusChangeReason("");
      toast({ title: "Status atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const updateMemberReserve = useMutation({
    mutationFn: async ({ memberId, reserveStatus }: { memberId: number; reserveStatus: string }) => {
      const res = await apiRequest("PATCH", `/api/members/${memberId}/reserve-status`, { reserveStatus });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      if (viewingGroupMembers !== null) {
        queryClient.invalidateQueries({ queryKey: ["/api/groups", viewingGroupMembers, "members"] });
      }
      toast({ title: "Status da taxa atualizado!" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/login?redirect=/admin");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>);
  }

  if (!user || user.role !== "admin") return null;

  const filteredOrders = ((allOrders ?? []) as any[]).filter((o: any) => {
    if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
    if (!orderSearch) return true;
    const term = orderSearch.toLowerCase();
    return (
      String(o.id).includes(term) ||
      o.userName?.toLowerCase().includes(term) ||
      o.userEmail?.toLowerCase().includes(term) ||
      (ORDER_STATUS_LABELS[o.status] || o.status)?.toLowerCase().includes(term)
    );
  });

  const overdueOrders = ((allOrders ?? []) as any[]).filter((o: any) =>
    o.status === "pronto_retirada" && o.pickupDeadline && new Date(o.pickupDeadline) < new Date()
  );

  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: "dashboard", label: "Painel", icon: LayoutDashboard },
    { key: "products", label: "Produtos", icon: Package },
    { key: "orders", label: "Pedidos", icon: ClipboardList },
    { key: "groups", label: "Grupos", icon: Users },
    { key: "clients", label: "Clientes", icon: UserCircle },
    { key: "categories", label: "Categorias", icon: FolderTree },
    { key: "banners", label: "Banners", icon: Image },
    { key: "videos", label: "Videos", icon: Video },
    { key: "pickup", label: "Retirada", icon: MapPin },
    { key: "order-settings", label: "Config. Pedidos", icon: Settings },
    { key: "articles", label: "Artigos", icon: FileText },
    { key: "media", label: "Midia", icon: Upload },
    { key: "filters", label: "Filtros", icon: Filter },
    { key: "sponsors", label: "Patrocinadores", icon: Globe },
    { key: "approvals", label: "Aprovacoes", icon: CheckCircle2 },
    { key: "partners", label: "Parceiros", icon: MapPin },
    { key: "navigation", label: "Navegacao", icon: Link2 },
    { key: "system", label: "Sistema", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" data-testid="link-admin-logo">
              <BrandLogo size="header" />
            </Link>
            <h1 className="text-lg font-bold font-display text-white">Painel Admin</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-white/80 flex items-center gap-1">
            Ver Loja <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdminTabBar tabs={tabs} tab={tab} setTab={setTab} />

        {tab === "dashboard" && <DashboardTab />}

        {tab === "products" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Produtos ({(products as any[])?.length || 0})</h2>
              <Button data-testid="button-new-product" size="sm" onClick={() => { setEditingProduct(null); setProductFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Produto
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Img</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">P. Normal</TableHead>
                        <TableHead className="text-right">P. Grupo</TableHead>
                        <TableHead className="text-right">P. Agora</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsLoading ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                      ) : !products || (products as any[]).length === 0 ? (
                        <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">Nenhum produto cadastrado.</TableCell></TableRow>
                      ) : (
                        (products as any[]).map((product: any) => (
                          <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                            <TableCell>
                              <img src={product.imageUrl || "https://via.placeholder.com/48"} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/48"; }} />
                            </TableCell>
                            <TableCell className="font-medium text-sm">{product.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                <Badge variant={product.saleMode === "grupo" ? "default" : "secondary"} className="text-[10px]">
                                  {product.saleMode === "grupo" ? "Grupo" : "Agora"}
                                </Badge>
                                <Badge variant="outline" className="text-[9px]">
                                  {product.fulfillmentType === "delivery" ? "Entrega" : "Retirada"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{product.category}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">R$ {Number(product.originalPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm font-medium text-primary">R$ {Number(product.groupPrice).toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm">{product.nowPrice ? `R$ ${Number(product.nowPrice).toFixed(2)}` : "-"}</TableCell>
                            <TableCell className="text-right text-sm">{product.stock}</TableCell>
                            <TableCell>
                              <Badge variant={product.active ? "default" : "secondary"} className="text-[10px]">{product.active ? "Ativo" : "Inativo"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" data-testid={`button-edit-product-${product.id}`} onClick={() => { setEditingProduct(product); setProductFormOpen(true); }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                                      <AlertDialogDescription>Essa acao nao pode ser desfeita. O produto "{product.name}" sera excluido permanentemente.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteProduct.mutate(product.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <ProductForm isOpen={productFormOpen} onClose={() => { setProductFormOpen(false); setEditingProduct(null); }} editProduct={editingProduct} />
          </>
        )}

        {tab === "groups" && (
          <>
            <h2 className="text-lg font-bold text-foreground mb-4">Gestao de Grupos</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!allGroups || (allGroups as any[]).length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum grupo criado.</TableCell></TableRow>
                      ) : (
                        (allGroups as any[]).map((group: any) => {
                          const progress = group.minPeople > 0 ? Math.round((group.currentPeople / group.minPeople) * 100) : 0;
                          return (
                            <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                              <TableCell className="text-sm font-medium">#{group.id}</TableCell>
                              <TableCell className="text-sm">{group.productName || `Produto #${group.productId}`}</TableCell>
                              <TableCell className="text-sm font-medium">{group.currentPeople}/{group.minPeople}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-primary"}`}
                                      style={{ width: `${Math.min(100, progress)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{progress}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={group.status === "aberto" ? "default" : "secondary"} className="text-[10px]">{group.status === "aberto" ? "Aberto" : "Fechado"}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" data-testid={`button-view-members-${group.id}`} onClick={() => setViewingGroupMembers(group.id)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {group.status === "aberto" ? (
                                    <Button variant="outline" size="sm" data-testid={`button-close-group-${group.id}`} onClick={() => updateGroupStatus.mutate({ id: group.id, status: "fechado" })}>Fechar</Button>
                                  ) : (
                                    <Button variant="outline" size="sm" data-testid={`button-reopen-group-${group.id}`} onClick={() => updateGroupStatus.mutate({ id: group.id, status: "aberto" })}>Reabrir</Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Dialog open={viewingGroupMembers !== null} onOpenChange={(open) => !open && setViewingGroupMembers(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Membros do Grupo #{viewingGroupMembers}</DialogTitle>
                </DialogHeader>
                {groupMembers && (groupMembers as any[]).length > 0 ? (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {(groupMembers as any[]).map((m: any) => (
                      <div key={m.id} className="flex flex-col gap-2 p-3 bg-muted rounded-md" data-testid={`member-${m.id}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.phone}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] flex-shrink-0">
                            Qtd: {m.quantity || 1}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">Pagamento:</span>
                          <select
                            data-testid={`select-reserve-${m.id}`}
                            value={m.reserveStatus || "nenhuma"}
                            onChange={(e) => updateMemberReserve.mutate({ memberId: m.id, reserveStatus: e.target.value })}
                            className="text-xs border border-input rounded-md px-2 py-1 bg-background"
                          >
                            {RESERVE_STATUSES.map((s) => (
                              <option key={s} value={s}>{s === "pendente" ? "Pendente" : s === "pago" ? "Pago" : "N/A"}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        Total: {(groupMembers as any[]).reduce((acc: number, m: any) => acc + (m.quantity || 1), 0)} unidades | {(groupMembers as any[]).length} participantes
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro neste grupo.</p>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}

        {tab === "orders" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Gestao de Pedidos ({filteredOrders.length})</h2>
              <div className="flex flex-wrap items-center gap-2">
                {overdueOrders.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    data-testid="button-filter-overdue"
                    onClick={() => setOrderStatusFilter(orderStatusFilter === "overdue" ? "all" : "overdue" as any)}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    {overdueOrders.length} Atrasado(s)
                  </Button>
                )}
                <select
                  data-testid="select-order-filter"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs border border-input rounded-md px-2 py-1.5 bg-background"
                >
                  <option value="all">Todos os Status</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <div className="relative w-full sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search-orders"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Buscar pedido..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                      ) : filteredOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido encontrado.</TableCell></TableRow>
                      ) : (
                        filteredOrders.map((order: any) => {
                          const items = Array.isArray(order.items) ? order.items : [];
                          const isOverdue = order.status === "pronto_retirada" && order.pickupDeadline && new Date(order.pickupDeadline) < new Date();
                          const nextStatuses = DEFAULT_TRANSITIONS[order.status] || [];

                          return (
                            <TableRow key={order.id} data-testid={`row-order-${order.id}`} className={isOverdue ? "bg-red-50 dark:bg-red-950/20" : ""}>
                              <TableCell className="text-sm font-medium">
                                <button
                                  data-testid={`button-view-order-${order.id}`}
                                  onClick={() => setViewingOrderDetail(order)}
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  #{order.id}
                                </button>
                              </TableCell>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{order.userName || "N/A"}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{order.userEmail || ""}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {items.map((i: any) => `${i.name} x${i.qty}`).join(", ")}
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold text-primary">R$ {Number(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLORS[order.status] || ""}`}>
                                  {isOverdue && <AlertTriangle className="w-3 h-3" />}
                                  {ORDER_STATUS_LABELS[order.status] || order.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {order.pickupDeadline ? (
                                  <span className={isOverdue ? "text-red-600 dark:text-red-400 font-medium" : ""}>
                                    {new Date(order.pickupDeadline).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "-"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {nextStatuses.slice(0, 2).map((ns: string) => (
                                    <Button
                                      key={ns}
                                      size="sm"
                                      variant={ns === "cancelado" ? "destructive" : "default"}
                                      data-testid={`button-status-${order.id}-${ns}`}
                                      disabled={updateOrderStatus.isPending}
                                      onClick={() => updateOrderStatus.mutate({ id: order.id, status: ns })}
                                      className="text-[10px] h-7 px-2"
                                    >
                                      <ArrowRight className="w-3 h-3 mr-0.5" />
                                      {ORDER_STATUS_LABELS[ns]?.split(" ")[0] || ns}
                                    </Button>
                                  ))}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    data-testid={`button-detail-order-${order.id}`}
                                    onClick={() => setViewingOrderDetail(order)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Dialog open={!!viewingOrderDetail} onOpenChange={(open) => { if (!open) setViewingOrderDetail(null); }}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Pedido #{viewingOrderDetail?.id}</DialogTitle>
                </DialogHeader>
                {viewingOrderDetail && <OrderDetailPanel order={viewingOrderDetail} onStatusChange={(status: string, reason: string) => {
                  updateOrderStatus.mutate({ id: viewingOrderDetail.id, status, reason });
                  setViewingOrderDetail(null);
                }} />}
              </DialogContent>
            </Dialog>
          </>
        )}

        {tab === "clients" && <ClientsTab />}

        {tab === "categories" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Gestao de Categorias</h2>
              <Button size="sm" data-testid="button-new-top-category" onClick={() => {
                setEditingCategory(null);
                setEditingCategoryIsTopLevel(true);
                setSelectedParentCat(null);
                setCategoryFormOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-1" /> Nova Categoria
              </Button>
            </div>

            <div className="space-y-3">
              {topLevelCategories.map((cat: any) => {
                const subs = getSubcategories(cat.id);
                const isExpanded = expandedCategories.has(cat.id);

                return (
                  <Card key={cat.id} data-testid={`card-category-${cat.id}`}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          data-testid={`button-toggle-category-${cat.id}`}
                          onClick={() => {
                            const next = new Set(expandedCategories);
                            if (next.has(cat.id)) next.delete(cat.id); else next.add(cat.id);
                            setExpandedCategories(next);
                          }}
                          className="p-0.5"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <CardTitle className="text-sm font-bold">{cat.name}</CardTitle>
                        <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px]">
                          {cat.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">({subs.length} sub)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-top-cat-${cat.id}`} onClick={() => {
                          setEditingCategory(cat);
                          setEditingCategoryIsTopLevel(true);
                          setSelectedParentCat(null);
                          setCategoryFormOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-add-sub-${cat.id}`} onClick={() => {
                          setSelectedParentCat(cat.id);
                          setEditingCategory(null);
                          setEditingCategoryIsTopLevel(false);
                          setCategoryFormOpen(true);
                        }}>
                          <Plus className="w-3 h-3 mr-1" /> Sub
                        </Button>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="px-4 pb-3 pt-0">
                        {subs.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Nenhuma subcategoria cadastrada.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {subs.map((sub: any) => (
                              <div key={sub.id} className="flex items-center gap-1 bg-muted rounded-md px-2 py-1" data-testid={`sub-${sub.id}`}>
                                <span className={`text-xs font-medium ${!sub.active ? "line-through text-muted-foreground" : ""}`}>{sub.name}</span>
                                {!sub.active && <Badge variant="secondary" className="text-[8px] px-1">off</Badge>}
                                <button data-testid={`button-edit-sub-${sub.id}`} onClick={() => {
                                  setSelectedParentCat(cat.id);
                                  setEditingCategory(sub);
                                  setEditingCategoryIsTopLevel(false);
                                  setCategoryFormOpen(true);
                                }} className="text-muted-foreground p-0.5 rounded">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <button data-testid={`button-delete-sub-${sub.id}`} className="text-destructive p-0.5 rounded">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir subcategoria?</AlertDialogTitle>
                                      <AlertDialogDescription>A subcategoria "{sub.name}" sera removida permanentemente.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteCategoryMutation.mutate(sub.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            <Dialog open={categoryFormOpen} onOpenChange={(open) => !open && setCategoryFormOpen(false)}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory
                      ? (editingCategoryIsTopLevel ? "Editar Categoria" : "Editar Subcategoria")
                      : (editingCategoryIsTopLevel ? "Nova Categoria" : "Nova Subcategoria")}
                  </DialogTitle>
                </DialogHeader>
                <CategoryForm
                  editCategory={editingCategory ? { ...editingCategory, parentId: editingCategoryIsTopLevel ? null : selectedParentCat } : { parentId: editingCategoryIsTopLevel ? null : selectedParentCat }}
                  isTopLevel={editingCategoryIsTopLevel}
                  onSave={(data) => {
                    if (!editingCategoryIsTopLevel && selectedParentCat) {
                      data.parentId = selectedParentCat;
                    }
                    if (editingCategory) {
                      updateCategory.mutate({ id: editingCategory.id, data });
                    } else {
                      createCategory.mutate(data);
                    }
                    setCategoryFormOpen(false);
                  }}
                  onCancel={() => setCategoryFormOpen(false)}
                  isPending={createCategory.isPending || updateCategory.isPending}
                />
              </DialogContent>
            </Dialog>
          </>
        )}

        {tab === "banners" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Banners ({(banners as any[])?.length || 0})</h2>
              <Button size="sm" data-testid="button-new-banner" onClick={() => { setEditingBanner(null); setBannerFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Banner
              </Button>
            </div>

            <div className="space-y-3">
              {!banners || (banners as any[]).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum banner cadastrado.</CardContent></Card>
              ) : (
                (banners as any[]).map((banner: any) => (
                  <Card key={banner.id} data-testid={`card-banner-${banner.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <img src={banner.imageUrl} alt={banner.title} className="w-24 h-14 rounded-md object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/96x56"; }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{banner.title || "(Sem titulo)"}</p>
                        <p className="text-xs text-muted-foreground">Ordem: {banner.sortOrder}</p>
                        {banner.linkUrl && <p className="text-[11px] text-muted-foreground truncate">{banner.linkUrl}</p>}
                      </div>
                      <Badge variant={banner.active ? "default" : "secondary"} className="text-[10px]">{banner.active ? "Ativo" : "Inativo"}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-banner-${banner.id}`} onClick={() => { setEditingBanner(banner); setBannerFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
                              <AlertDialogDescription>O banner sera removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBanner.mutate(banner.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <BannerForm isOpen={bannerFormOpen} onClose={() => { setBannerFormOpen(false); setEditingBanner(null); }} editBanner={editingBanner} />
          </>
        )}

        {tab === "videos" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Videos ({(videos as any[])?.length || 0})</h2>
              <Button size="sm" data-testid="button-new-video" onClick={() => { setEditingVideo(null); setVideoFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Video
              </Button>
            </div>

            <div className="space-y-3">
              {!videos || (videos as any[]).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum video cadastrado.</CardContent></Card>
              ) : (
                (videos as any[]).map((video: any) => (
                  <Card key={video.id} data-testid={`card-video-${video.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{video.title || "(Sem titulo)"}</p>
                        <p className="text-xs text-muted-foreground truncate">{video.embedUrl}</p>
                      </div>
                      <Badge variant={video.active ? "default" : "secondary"} className="text-[10px]">{video.active ? "Ativo" : "Inativo"}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-video-${video.id}`} onClick={() => { setEditingVideo(video); setVideoFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir video?</AlertDialogTitle>
                              <AlertDialogDescription>O video sera removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteVideo.mutate(video.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <VideoForm isOpen={videoFormOpen} onClose={() => { setVideoFormOpen(false); setEditingVideo(null); }} editVideo={editingVideo} />
          </>
        )}

        {tab === "pickup" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Pontos de Retirada ({(pickupPoints as any[])?.length || 0})</h2>
              <Button size="sm" data-testid="button-new-pickup" onClick={() => { setEditingPickup(null); setPickupFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Ponto
              </Button>
            </div>

            <div className="space-y-3">
              {!pickupPoints || (pickupPoints as any[]).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum ponto de retirada cadastrado.</CardContent></Card>
              ) : (
                (pickupPoints as any[]).map((pt: any) => (
                  <Card key={pt.id} data-testid={`card-pickup-${pt.id}`}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{pt.name}</p>
                        <p className="text-xs text-muted-foreground">{pt.address}</p>
                        <p className="text-xs text-muted-foreground">{pt.city}</p>
                        {pt.phone && <p className="text-xs text-muted-foreground">{pt.phone}</p>}
                        {pt.hours && <p className="text-xs text-muted-foreground">{pt.hours}</p>}
                      </div>
                      <Badge variant={pt.active ? "default" : "secondary"} className="text-[10px]">{pt.active ? "Ativo" : "Inativo"}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-pickup-${pt.id}`} onClick={() => { setEditingPickup(pt); setPickupFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir ponto de retirada?</AlertDialogTitle>
                              <AlertDialogDescription>O ponto sera removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePickupPoint.mutate(pt.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Dialog open={pickupFormOpen} onOpenChange={(open) => !open && setPickupFormOpen(false)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPickup ? "Editar Ponto" : "Novo Ponto de Retirada"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const data = {
                    name: fd.get("name") as string,
                    address: fd.get("address") as string,
                    city: fd.get("city") as string || "Formosa - GO",
                    phone: fd.get("phone") as string || "",
                    hours: fd.get("hours") as string || "",
                    active: (fd.get("active") as string) === "true",
                  };
                  if (editingPickup) {
                    updatePickupPoint.mutate({ id: editingPickup.id, data });
                  } else {
                    createPickupPoint.mutate(data);
                  }
                  setPickupFormOpen(false);
                  setEditingPickup(null);
                }} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input data-testid="input-pickup-name" name="name" defaultValue={editingPickup?.name || ""} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Endereco</Label>
                    <Input data-testid="input-pickup-address" name="address" defaultValue={editingPickup?.address || ""} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Cidade</Label>
                      <Input data-testid="input-pickup-city" name="city" defaultValue={editingPickup?.city || "Formosa - GO"} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone</Label>
                      <Input data-testid="input-pickup-phone" name="phone" defaultValue={editingPickup?.phone || ""} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Horario</Label>
                      <Input data-testid="input-pickup-hours" name="hours" defaultValue={editingPickup?.hours || ""} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      <select name="active" defaultValue={editingPickup?.active !== false ? "true" : "false"} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createPickupPoint.isPending || updatePickupPoint.isPending}>
                    {createPickupPoint.isPending || updatePickupPoint.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}

        {tab === "order-settings" && <OrderSettingsTab />}

        {tab === "articles" && <ArticlesTab />}

        {tab === "media" && <MediaTab />}

        {tab === "filters" && <FiltersTab />}

        {tab === "sponsors" && <SponsorBannersTab />}

        {tab === "approvals" && <ProductApprovalsTab />}

        {tab === "partners" && <PartnersTab />}

        {tab === "navigation" && <NavigationTab />}

        {tab === "system" && <SystemTab />}
      </div>
    </div>
  );
}
