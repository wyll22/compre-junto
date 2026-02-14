import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useJoinGroup, useCreateGroup } from "@/hooks/use-groups";
import { Loader2 } from "lucide-react";
import type { AuthUser } from "@/hooks/use-auth";

interface JoinGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  existingGroup?: any;
  user?: AuthUser | null;
}

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function JoinGroupDialog({ isOpen, onClose, product, existingGroup, user }: JoinGroupDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const joinGroup = useJoinGroup();
  const createGroup = useCreateGroup();

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
    if (!isOpen) {
      setErrorMsg("");
    }
  }, [isOpen, user]);

  const isJoiningExisting = !!existingGroup;

  const subtitle = useMemo(() => {
    if (isJoiningExisting) {
      const faltam = Math.max(0, product.minPeople - (existingGroup?.currentPeople ?? 0));
      return `Faltam ${faltam} pessoas para fechar este grupo.`;
    }
    return `Garanta o preco de R$ ${Number(product.groupPrice).toFixed(2)} juntando-se a outras pessoas.`;
  }, [isJoiningExisting, product, existingGroup]);

  const loading = joinGroup.isPending || createGroup.isPending;

  async function handleSubmit() {
    setErrorMsg("");
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const digitsPhone = cleanPhone.replace(/\D/g, "");

    if (!cleanName) {
      setErrorMsg("Informe seu nome.");
      return;
    }
    if (!cleanPhone || digitsPhone.length < 8) {
      setErrorMsg("Informe um telefone valido.");
      return;
    }

    try {
      if (isJoiningExisting && existingGroup?.id) {
        await joinGroup.mutateAsync({
          groupId: existingGroup.id,
          name: cleanName,
          phone: cleanPhone,
        });
      } else {
        await createGroup.mutateAsync({
          productId: product.id,
          name: cleanName,
          phone: cleanPhone,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao processar. Tente novamente.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isJoiningExisting ? "Entrar no grupo" : "Criar novo grupo"}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="join-name">Seu nome</Label>
            <Input
              data-testid="input-join-name"
              id="join-name"
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="join-phone">WhatsApp / Telefone</Label>
            <Input
              data-testid="input-join-phone"
              id="join-phone"
              placeholder="(75) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
              inputMode="tel"
            />
          </div>

          {errorMsg && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              data-testid="button-confirm-join"
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              {isJoiningExisting ? "Entrar no grupo" : "Criar e entrar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
