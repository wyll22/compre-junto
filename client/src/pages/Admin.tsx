import { useProducts, useDeleteProduct, useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { useGroups, useUpdateGroupStatus } from "@/hooks/use-groups";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, LayoutDashboard, ExternalLink, Edit, Package, Users, Image, Video, Loader2, ClipboardList, Eye,
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
import { CATEGORIES } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type AdminTab = "products" | "groups" | "banners" | "videos" | "orders";

const SALE_MODES = [
  { value: "grupo", label: "Compra em Grupo" },
  { value: "agora", label: "Compre Agora" },
];

const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c !== "Todos");

const ORDER_STATUSES = ["recebido", "processando", "enviado", "entregue", "cancelado"];

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
    category: "Outros",
    saleMode: "grupo",
    active: true,
  });

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
        category: editProduct.category || "Outros",
        saleMode: editProduct.saleMode || "grupo",
        active: editProduct.active !== false,
      });
    } else {
      setForm({
        name: "", description: "", imageUrl: "", originalPrice: "", groupPrice: "",
        nowPrice: "", minPeople: "10", stock: "100", reserveFee: "0",
        category: "Outros", saleMode: "grupo", active: true,
      });
    }
  }, [editProduct, isOpen]);

  const loading = createProduct.isPending || updateProduct.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      nowPrice: form.nowPrice || null,
      minPeople: Number(form.minPeople),
      stock: Number(form.stock),
      reserveFee: form.reserveFee || "0",
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Venda</Label>
              <select data-testid="select-sale-mode" value={form.saleMode} onChange={(e) => setForm({ ...form, saleMode: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {SALE_MODES.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <select data-testid="select-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                {PRODUCT_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
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
      toast({ title: "Sucesso", description: "Banner salvo!" });
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !mutation.isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, sortOrder: Number(form.sortOrder) }); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Titulo</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>URL da Imagem (Desktop)</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required /></div>
          <div className="space-y-1.5"><Label>URL da Imagem (Mobile)</Label><Input value={form.mobileImageUrl} onChange={(e) => setForm({ ...form, mobileImageUrl: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Link</Label><Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Ordem</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="banner-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="banner-active">Ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>Salvar</Button>
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
      toast({ title: "Sucesso", description: "Video salvo!" });
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !mutation.isPending && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editVideo ? "Editar Video" : "Novo Video"}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ ...form, sortOrder: Number(form.sortOrder) }); }} className="space-y-3">
          <div className="space-y-1.5"><Label>Titulo</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>URL do Video (embed)</Label><Input value={form.embedUrl} onChange={(e) => setForm({ ...form, embedUrl: e.target.value })} required placeholder="https://youtube.com/embed/..." /></div>
          <div className="space-y-1.5"><Label>Ordem</Label><Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="video-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
            <Label htmlFor="video-active">Ativo</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Admin() {
  const { data: user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AdminTab>("products");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [videoFormOpen, setVideoFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [viewingGroupMembers, setViewingGroupMembers] = useState<number | null>(null);

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

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Status atualizado!" });
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

  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: "products", label: "Produtos", icon: Package },
    { key: "groups", label: "Grupos", icon: Users },
    { key: "orders", label: "Pedidos", icon: ClipboardList },
    { key: "banners", label: "Banners", icon: Image },
    { key: "videos", label: "Videos", icon: Video },
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
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {tabs.map((t) => (
            <Button key={t.key} data-testid={`tab-${t.key}`} variant={tab === t.key ? "default" : "outline"} size="sm" onClick={() => setTab(t.key)}>
              <t.icon className="w-4 h-4 mr-1.5" />
              {t.label}
            </Button>
          ))}
        </div>

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
                          <TableRow key={product.id}>
                            <TableCell>
                              <img src={product.imageUrl || "https://via.placeholder.com/48"} alt={product.name} className="w-10 h-10 rounded-md object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/48"; }} />
                            </TableCell>
                            <TableCell className="font-medium text-sm">{product.name}</TableCell>
                            <TableCell>
                              <Badge variant={product.saleMode === "grupo" ? "default" : "secondary"} className="text-[10px]">
                                {product.saleMode === "grupo" ? "Grupo" : "Agora"}
                              </Badge>
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
                        <TableHead>Meta</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!allGroups || (allGroups as any[]).length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum grupo criado.</TableCell></TableRow>
                      ) : (
                        (allGroups as any[]).map((group: any) => (
                          <TableRow key={group.id}>
                            <TableCell className="text-sm">{group.id}</TableCell>
                            <TableCell className="text-sm">{group.productName || `#${group.productId}`}</TableCell>
                            <TableCell className="text-sm font-medium">{group.currentPeople}/{group.minPeople}</TableCell>
                            <TableCell className="text-sm">{group.minPeople}</TableCell>
                            <TableCell>
                              <Badge variant={group.status === "aberto" ? "default" : "secondary"} className="text-[10px]">{group.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" data-testid={`button-view-members-${group.id}`} onClick={() => setViewingGroupMembers(group.id)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {group.status === "aberto" ? (
                                  <Button variant="outline" size="sm" onClick={() => updateGroupStatus.mutate({ id: group.id, status: "fechado" })}>Fechar</Button>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={() => updateGroupStatus.mutate({ id: group.id, status: "aberto" })}>Reabrir</Button>
                                )}
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

            <Dialog open={viewingGroupMembers !== null} onOpenChange={(open) => !open && setViewingGroupMembers(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Membros do Grupo #{viewingGroupMembers}</DialogTitle>
                </DialogHeader>
                {groupMembers && (groupMembers as any[]).length > 0 ? (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {(groupMembers as any[]).map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                        <div>
                          <p className="font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                        {m.reserveStatus && m.reserveStatus !== "nenhuma" && (
                          <Badge variant={m.reserveStatus === "pago" ? "default" : "outline"} className="text-[10px]">
                            Taxa: {m.reserveStatus}
                          </Badge>
                        )}
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
            <h2 className="text-lg font-bold text-foreground mb-4">Gestao de Pedidos</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Itens</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersLoading ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                      ) : !allOrders || (allOrders as any[]).length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Nenhum pedido recebido.</TableCell></TableRow>
                      ) : (
                        (allOrders as any[]).map((order: any) => {
                          const items = Array.isArray(order.items) ? order.items : [];
                          return (
                            <TableRow key={order.id}>
                              <TableCell className="text-sm font-medium">#{order.id}</TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {items.map((i: any) => `${i.name} x${i.qty}`).join(", ")}
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold text-primary">R$ {Number(order.total).toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={order.status === "entregue" ? "secondary" : order.status === "cancelado" ? "destructive" : "default"} className="text-[10px]">
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
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
                                    <option key={s} value={s}>{s}</option>
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

        {tab === "banners" && (
          <>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">Banners</h2>
              <Button size="sm" onClick={() => { setEditingBanner(null); setBannerFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Banner
              </Button>
            </div>

            <div className="space-y-3">
              {!banners || (banners as any[]).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum banner cadastrado.</CardContent></Card>
              ) : (
                (banners as any[]).map((banner: any) => (
                  <Card key={banner.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <img src={banner.imageUrl} alt={banner.title} className="w-24 h-14 rounded-md object-cover bg-muted" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/96x56"; }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{banner.title || "(Sem titulo)"}</p>
                        <p className="text-xs text-muted-foreground">Ordem: {banner.sortOrder}</p>
                      </div>
                      <Badge variant={banner.active ? "default" : "secondary"} className="text-[10px]">{banner.active ? "Ativo" : "Inativo"}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingBanner(banner); setBannerFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBanner.mutate(banner.id)}><Trash2 className="w-4 h-4" /></Button>
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
              <h2 className="text-lg font-bold text-foreground">Videos</h2>
              <Button size="sm" onClick={() => { setEditingVideo(null); setVideoFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Novo Video
              </Button>
            </div>

            <div className="space-y-3">
              {!videos || (videos as any[]).length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">Nenhum video cadastrado.</CardContent></Card>
              ) : (
                (videos as any[]).map((video: any) => (
                  <Card key={video.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{video.title || "(Sem titulo)"}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{video.embedUrl}</p>
                      </div>
                      <Badge variant={video.active ? "default" : "secondary"} className="text-[10px]">{video.active ? "Ativo" : "Inativo"}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingVideo(video); setVideoFormOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteVideo.mutate(video.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <VideoForm isOpen={videoFormOpen} onClose={() => { setVideoFormOpen(false); setEditingVideo(null); }} editVideo={editingVideo} />
          </>
        )}
      </div>
    </div>
  );
}
