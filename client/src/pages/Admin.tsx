import { useProducts, useDeleteProduct } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, LayoutDashboard, ExternalLink } from "lucide-react";
import { useState } from "react";
import { AdminProductForm } from "@/components/AdminProductForm";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold font-display text-gray-900">Painel Administrativo</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-primary flex items-center gap-1">
            Ver Loja <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Produtos</h2>
            <p className="text-muted-foreground">Adicione ou remova produtos da loja.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço Original</TableHead>
                <TableHead className="text-right">Preço Grupo</TableHead>
                <TableHead className="text-right">Min. Pessoas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : products?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum produto cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-gray-500 line-through">R$ {Number(product.originalPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">R$ {Number(product.groupPrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.minPeople}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso excluirá o produto "{product.name}" permanentemente. Essa ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteProduct.mutate(product.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <AdminProductForm isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
