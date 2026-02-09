import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { insertProductSchema } from "@shared/schema";
import { useCreateProduct } from "@/hooks/use-products";
import { Loader2 } from "lucide-react";

// Use z.coerce for number fields because HTML inputs return strings
const formSchema = insertProductSchema.extend({
  originalPrice: z.coerce.number().min(0.01),
  groupPrice: z.coerce.number().min(0.01),
  minPeople: z.coerce.number().min(2),
});

type FormValues = z.infer<typeof formSchema>;

interface AdminProductFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminProductForm({ isOpen, onClose }: AdminProductFormProps) {
  const createProduct = useCreateProduct();
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Outros",
      minPeople: 2
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // Must cast numbers back to string for the numeric field in database (drizzle numeric is string in JS usually, but schema type says numeric)
      // Actually shared schema says 'numeric' which typically maps to string in JS to preserve precision
      // But let's check the schema type again. 
      // InsertProduct expects strings for numeric fields? 
      // Drizzle-zod usually generates string schema for numeric.
      // But my form schema uses coerce.number().
      // I need to convert back to string if the API expects it.
      // Based on schema: `originalPrice: numeric(...)`, `createInsertSchema` usually makes this a string.
      
      const payload: any = {
        ...data,
        originalPrice: String(data.originalPrice),
        groupPrice: String(data.groupPrice),
      };

      await createProduct.mutateAsync(payload);
      reset();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" {...register("name")} placeholder="Ex: Kit 5 Sabonetes" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} placeholder="Detalhes do produto..." />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Preço Original (R$)</Label>
              <Input id="originalPrice" type="number" step="0.01" {...register("originalPrice")} />
              {errors.originalPrice && <p className="text-xs text-red-500">{errors.originalPrice.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupPrice">Preço em Grupo (R$)</Label>
              <Input id="groupPrice" type="number" step="0.01" {...register("groupPrice")} />
              {errors.groupPrice && <p className="text-xs text-red-500">{errors.groupPrice.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPeople">Mínimo de Pessoas</Label>
              <Input id="minPeople" type="number" {...register("minPeople")} />
              {errors.minPeople && <p className="text-xs text-red-500">{errors.minPeople.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select 
                id="category" 
                {...register("category")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Alimentos">Alimentos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Higiene">Higiene</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Outros">Outros</option>
              </select>
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da Imagem</Label>
            {/* Unsplash comment for reference: Use direct Unsplash URLs like https://images.unsplash.com/photo-... */}
            <Input id="imageUrl" {...register("imageUrl")} placeholder="https://..." />
            {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl.message}</p>}
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Salvar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
