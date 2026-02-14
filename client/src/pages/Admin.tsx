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
  Mail, Phone, ChevronDown, ChevronUp, Search, MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
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

type AdminTab = "dashboard" | "products" | "groups" | "orders" | "categories" | "clients" | "banners" | "videos" | "pickup";

const SALE_MODES = [
  { value: "grupo", label: "Compra em Grupo" },
  { value: "agora", label: "Compre Agora" },
];

const ORDER_STATUSES = ["recebido", "processando", "enviado", "entregue", "cancelado"];
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
  const { data: allCategoriesData } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: "include" });
      return await res.json();
    },
  });
  const allCats = (allCategoriesData ?? []) as any[];
  const topCats = allCats.filter((c: any) => c.parentId === null);
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
      });
    } else {
      setForm({
        name: "", description: "", imageUrl: "", originalPrice: "", groupPrice: "",
        nowPrice: "", minPeople: "10", stock: "100", reserveFee: "0",
        categoryId: "", subcategoryId: "", saleMode: "grupo", fulfillmentType: "pickup", active: true,
      });
    }
  }, [editProduct, isOpen]);

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
    };

    if (editProduct) {
      await updateProduct.mutateAsync({ id: editProduct.id, data: payload });
    } else {
      await createProduct.mutateAsync(payload);
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

          <div className="flex items-center gap-2">
            <input data-testid="input-active" type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-input" />
            <Label htmlFor="active">Produto ativo</Label>
          </div>

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

function ClientsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingUser, setViewingUser] = useState<any>(null);

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return await res.json();
    },
  });

  const users = ((allUsers ?? []) as any[]).filter((u: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-foreground">Clientes ({users.length})</h2>
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum cliente encontrado.</TableCell></TableRow>
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
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                          {u.role === "admin" ? "Admin" : "Cliente"}
                        </Badge>
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
            <DialogTitle>Detalhes do Cliente</DialogTitle>
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
                  <Badge variant={viewingUser.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                    {viewingUser.role === "admin" ? "Administrador" : "Cliente"}
                  </Badge>
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
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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

  const filteredOrders = orderSearch
    ? ((allOrders ?? []) as any[]).filter((o: any) => {
        const term = orderSearch.toLowerCase();
        return (
          String(o.id).includes(term) ||
          o.userName?.toLowerCase().includes(term) ||
          o.userEmail?.toLowerCase().includes(term) ||
          o.status?.toLowerCase().includes(term)
        );
      })
    : ((allOrders ?? []) as any[]);

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
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map((t) => (
            <Button key={t.key} data-testid={`tab-${t.key}`} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)} className="flex-shrink-0">
              <t.icon className="w-4 h-4 mr-1.5" />
              {t.label}
            </Button>
          ))}
        </div>

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
                      <div key={m.id} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-md" data-testid={`member-${m.id}`}>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-orders"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por ID, cliente, status..."
                  className="pl-10"
                />
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
                        <TableHead>Data</TableHead>
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
                          return (
                            <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                              <TableCell className="text-sm font-medium">#{order.id}</TableCell>
                              <TableCell>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{order.userName || "N/A"}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">{order.userEmail || ""}</p>
                                  {order.userPhone && <p className="text-[11px] text-muted-foreground">{order.userPhone}</p>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {items.map((i: any) => `${i.name} x${i.qty}`).join(", ")}
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold text-primary">R$ {Number(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === "entregue" ? "secondary" : order.status === "cancelado" ? "destructive" : "default"} className="text-[10px]">
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("pt-BR") : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <select
                                  data-testid={`select-order-status-${order.id}`}
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus.mutate({ id: order.id, status: e.target.value })}
                                  className="text-xs border border-input rounded-md px-2 py-1 bg-background"
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                  ))}
                                </select>
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
      </div>
    </div>
  );
}
