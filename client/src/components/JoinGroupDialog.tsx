import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product, Group } from "@shared/schema";
import { useCreateGroup, useJoinGroup } from "@/hooks/use-groups";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Share2 } from "lucide-react";
import { insertMemberSchema } from "@shared/schema";

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingGroup?: Group;
}

const formSchema = insertMemberSchema.omit({ groupId: true }).extend({
  phone: z.string().min(10, "Telefone inválido (mínimo 10 dígitos)"),
  name: z.string().min(2, "Nome muito curto"),
});

type FormValues = z.infer<typeof formSchema>;

export function JoinGroupDialog({ isOpen, onClose, product, existingGroup }: JoinGroupDialogProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      let targetGroupId = existingGroup?.id;

      // If no group exists, create one first
      if (!targetGroupId) {
        const newGroup = await createGroup.mutateAsync(product.id);
        targetGroupId = newGroup.id;
      }

      // Then join the group
      await joinGroup.mutateAsync({
        groupId: targetGroupId,
        data: data
      });

      setStep('success');
    } catch (error) {
      console.error("Failed to process group action", error);
      // Toast is handled in hooks
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Oi! Compre junto comigo no Compre Junto FSA e pague R$ ${Number(product.groupPrice).toFixed(2)} no(a) ${product.name}! Acesse agora.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  const isProcessing = createGroup.isPending || joinGroup.isPending || isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && handleClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">
                {existingGroup ? "Participar do Grupo" : "Criar Novo Grupo"}
              </DialogTitle>
              <DialogDescription>
                Garanta o preço de <strong>R$ {Number(product.groupPrice).toFixed(2)}</strong> juntando-se a outras {product.minPeople} pessoas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <Input 
                  id="name" 
                  {...register("name")} 
                  placeholder="Ex: Maria Silva"
                  className="rounded-xl border-2 focus:border-primary/50 focus:ring-primary/20"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp / Telefone</Label>
                <Input 
                  id="phone" 
                  {...register("phone")} 
                  placeholder="(75) 99999-9999"
                  className="rounded-xl border-2 focus:border-primary/50 focus:ring-primary/20"
                />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isProcessing}
                  className="flex-1 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : existingGroup ? "Confirmar Participação" : "Criar e Entrar"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-display text-green-700">
                {existingGroup ? "Você entrou no grupo!" : "Grupo Criado com Sucesso!"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Agora compartilhe com seus amigos para completar o grupo e garantir o desconto.
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button 
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-lg"
                size="lg"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Compartilhar no WhatsApp
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleClose}
                className="w-full text-muted-foreground"
              >
                Voltar para a loja
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
