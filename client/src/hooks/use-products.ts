import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useProducts(params?: { category?: string; search?: string; saleMode?: string; categoryId?: number; subcategoryId?: number }) {
  return useQuery({
    queryKey: ["/api/products", params],
    queryFn: async () => {
      const url = new URL("/api/products", window.location.origin);
      if (params?.category && params.category !== "Todos") {
        url.searchParams.append("category", params.category);
      }
      if (params?.categoryId) {
        url.searchParams.append("categoryId", String(params.categoryId));
      }
      if (params?.subcategoryId) {
        url.searchParams.append("subcategoryId", String(params.subcategoryId));
      }
      if (params?.search) {
        url.searchParams.append("search", params.search);
      }
      if (params?.saleMode) {
        url.searchParams.append("saleMode", params.saleMode);
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return await res.json();
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Sucesso", description: "Produto criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar produto",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Sucesso", description: "Produto atualizado!" });
    },
    onError: () => {
      toast({ title: "Erro", description: "Erro ao atualizar produto", variant: "destructive" });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Sucesso", description: "Produto removido com sucesso!" });
    },
  });
}
