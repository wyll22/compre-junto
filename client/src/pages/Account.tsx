import { useState, useEffect } from "react";
import { useAuth, useLogout } from "@/hooks/use-auth";
import type { AuthUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  ShoppingBag,
  UserCircle,
  Loader2,
  Package,
  LogOut,
  MapPin,
  Shield,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Lock,
  Save,
  Smile,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Search,
  AlertTriangle,
  ArrowRight,
  History,
  PackageCheck,
  Timer,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseApiError } from "@/lib/error-utils";
import { Footer } from "@/components/Footer";

type AccountTab = "profile" | "address" | "security" | "orders" | "groups";

const STATUS_LABELS: Record<string, string> = {
  recebido: "Recebido",
  em_separacao: "Em Separacao",
  pronto_retirada: "Pronto p/ Retirada",
  retirado: "Retirado",
  nao_retirado: "Nao Retirado",
  cancelado: "Cancelado",
  aberto: "Aberto",
  fechado: "Fechado",
  pendente: "Pendente",
  pago: "Pago",
  nenhuma: "N/A",
};

const STATUS_ICONS: Record<string, any> = {
  recebido: CheckCircle2,
  em_separacao: Package,
  pronto_retirada: PackageCheck,
  retirado: CheckCircle2,
  nao_retirado: AlertTriangle,
  cancelado: XCircle,
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  recebido: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_separacao:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pronto_retirada:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  retirado:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  nao_retirado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const ORDER_FLOW = ["recebido", "em_separacao", "pronto_retirada", "retirado"];

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "aberto":
    case "recebido":
    case "em_separacao":
      return "default";
    case "fechado":
    case "retirado":
    case "pronto_retirada":
    case "pago":
      return "secondary";
    case "cancelado":
    case "nao_retirado":
      return "destructive";
    default:
      return "outline";
  }
}

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function UserAvatar({ user }: { user: AuthUser }) {
  const displayText = user.displayName || user.name;
  const initials = displayText
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-md"
      data-testid="avatar-user"
    >
      {initials}
    </div>
  );
}

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

function ProfileTab({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [phone, setPhone] = useState(user.phone || "");

  useEffect(() => {
    setName(user.name || "");
    setDisplayName(user.displayName || "");
    setPhone(user.phone || "");
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Perfil atualizado!" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: parseApiError(err),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome e obrigatorio",
        variant: "destructive",
      });
      return;
    }
    updateProfile.mutate({
      name: name.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar user={user} />
            <div>
              <h3 className="font-bold text-lg text-foreground">
                {user.displayName || user.name}
              </h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-muted-foreground">{user.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nome completo</Label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-profile-name"
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-display">
                Apelido (como quer ser chamado)
              </Label>
              <div className="relative">
                <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-profile-display-name"
                  id="profile-display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Mari, Dona Maria..."
                  className="pl-10"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Esse apelido aparece no topo do app quando voce esta logado.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={user.email} disabled className="pl-10 bg-muted" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Celular / WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-profile-phone"
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                  placeholder="(61) 99999-9999"
                  className="pl-10"
                  inputMode="tel"
                />
              </div>
            </div>

            <Button
              data-testid="button-save-profile"
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="w-full"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              Salvar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressTab({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cep, setCep] = useState(user.addressCep || "");
  const [street, setStreet] = useState(user.addressStreet || "");
  const [number, setNumber] = useState(user.addressNumber || "");
  const [complement, setComplement] = useState(user.addressComplement || "");
  const [district, setDistrict] = useState(user.addressDistrict || "");
  const [city, setCity] = useState(user.addressCity || "");
  const [state, setState] = useState(user.addressState || "");
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    setCep(user.addressCep || "");
    setStreet(user.addressStreet || "");
    setNumber(user.addressNumber || "");
    setComplement(user.addressComplement || "");
    setDistrict(user.addressDistrict || "");
    setCity(user.addressCity || "");
    setState(user.addressState || "");
  }, [user]);

  const updateAddress = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/auth/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Endereco atualizado!" });
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: parseApiError(err),
        variant: "destructive",
      });
    },
  });

  const lookupCep = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      toast({
        title: "CEP invalido",
        description: "Informe um CEP com 8 digitos",
        variant: "destructive",
      });
      return;
    }

    // Validação para Formosa-GO (CEP 73750-000 a 73799-999)
    const cepNum = parseInt(digits);
    if (cepNum < 73750000 || cepNum > 73799999) {
      toast({
        title: "Região não atendida",
        description:
          "No momento atendemos apenas a região de Formosa-GO e arredores (CEPs 73750-XXX a 73799-XXX).",
        variant: "destructive",
      });
      return;
    }

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast({ title: "CEP nao encontrado", variant: "destructive" });
      } else {
        setStreet(data.logradouro || "");
        setDistrict(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
        toast({ title: "Endereco preenchido!" });
      }
    } catch {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    }
    setCepLoading(false);
  };

  const handleSave = () => {
    updateAddress.mutate({
      addressCep: cep.trim(),
      addressStreet: street.trim(),
      addressNumber: number.trim(),
      addressComplement: complement.trim(),
      addressDistrict: district.trim(),
      addressCity: city.trim(),
      addressState: state.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Endereco de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="addr-cep">CEP</Label>
            <div className="flex gap-2">
              <Input
                data-testid="input-address-cep"
                id="addr-cep"
                value={cep}
                onChange={(e) => setCep(formatCEP(e.target.value))}
                placeholder="00000-000"
                className="flex-1"
                inputMode="numeric"
                maxLength={9}
              />
              <Button
                data-testid="button-lookup-cep"
                variant="outline"
                size="icon"
                onClick={lookupCep}
                disabled={cepLoading}
              >
                {cepLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-street">Rua / Avenida</Label>
            <Input
              data-testid="input-address-street"
              id="addr-street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Rua das Flores"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="addr-number">Numero</Label>
              <Input
                data-testid="input-address-number"
                id="addr-number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-complement">Complemento</Label>
              <Input
                data-testid="input-address-complement"
                id="addr-complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Apto, bloco..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addr-district">Bairro</Label>
            <Input
              data-testid="input-address-district"
              id="addr-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Centro"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="addr-city">Cidade</Label>
              <Input
                data-testid="input-address-city"
                id="addr-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Formosa"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addr-state">UF</Label>
              <select
                data-testid="select-address-state"
                id="addr-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">--</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            data-testid="button-save-address"
            onClick={handleSave}
            disabled={updateAddress.isPending}
            className="w-full"
          >
            {updateAddress.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Salvar Endereco
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const changePassword = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await apiRequest("POST", "/api/auth/password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => {
      toast({
        title: "Erro",
        description: parseApiError(err),
        variant: "destructive",
      });
    },
  });



  const deleteAccount = useMutation({
    mutationFn: async (data: { password: string; confirmation: string }) => {
      const res = await apiRequest("DELETE", "/api/auth/account", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Conta excluida", description: "Seus dados de conta foram removidos." });
      setLocation("/");
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    },
  });

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) {
      toast({ title: "Erro", description: "Informe sua senha para confirmar", variant: "destructive" });
      return;
    }
    if (deleteConfirmation.trim().toUpperCase() !== "EXCLUIR") {
      toast({ title: "Erro", description: "Digite EXCLUIR para confirmar", variant: "destructive" });
      return;
    }
    deleteAccount.mutate({ password: deletePassword, confirmation: "EXCLUIR" });
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      toast({
        title: "Erro",
        description: "Informe sua senha atual",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Erro",
        description: "Nova senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas nao conferem",
        variant: "destructive",
      });
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sec-current">Senha atual</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-current-password"
                id="sec-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Sua senha atual"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-new">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-new-password"
                id="sec-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sec-confirm">Confirmar nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-confirm-password"
                id="sec-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="pl-10"
              />
            </div>
          </div>

          <Button
            data-testid="button-change-password"
            onClick={handleChangePassword}
            disabled={changePassword.isPending}
            className="w-full"
          >
            {changePassword.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Lock className="w-4 h-4 mr-1.5" />
            )}
            Alterar Senha
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Excluir Conta (LGPD)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Esta acao e permanente e remove seus dados de cadastro e historico de conta.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="delete-password">Senha atual</Label>
            <Input
              data-testid="input-delete-account-password"
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delete-confirm">Digite EXCLUIR para confirmar</Label>
            <Input
              data-testid="input-delete-account-confirmation"
              id="delete-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="EXCLUIR"
            />
          </div>

          <Button
            data-testid="button-delete-account"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteAccount.isPending}
            className="w-full"
          >
            {deleteAccount.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-1.5" />
            )}
            Excluir minha conta
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}

function PickupCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  const isOverdue = diff <= 0;

  if (isOverdue) {
    return (
      <div className="mt-2 p-2 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
        <div className="flex items-center gap-1 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          Prazo de retirada expirado
        </div>
      </div>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const isUrgent = hours < 12;

  return (
    <div
      className={`mt-2 p-2 rounded-md text-xs ${isUrgent ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}`}
    >
      <div className="flex items-center gap-1 font-medium">
        <Timer className="w-3.5 h-3.5" />
        Retire em {hours}h {minutes}min
      </div>
      <p className="mt-0.5">
        Ate{" "}
        {deadlineDate.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

function OrderHistory({ orderId }: { orderId: number }) {
  const [showHistory, setShowHistory] = useState(false);
  const { data: history, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId, "history"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/history`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      return await res.json();
    },
    enabled: showHistory,
  });

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <Button
        variant="ghost"
        size="sm"
        data-testid={`button-history-${orderId}`}
        onClick={() => setShowHistory(!showHistory)}
        className="text-xs text-muted-foreground px-0"
      >
        <History className="w-3 h-3 mr-1" />
        {showHistory ? "Ocultar historico" : "Ver historico"}
        {showHistory ? (
          <ChevronUp className="w-3 h-3 ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-0.5" />
        )}
      </Button>
      {showHistory && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : !history || history.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sem historico de alteracoes.
            </p>
          ) : (
            (history as any[]).map((h: any) => (
              <div key={h.id} className="flex items-start gap-2 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium">
                    {STATUS_LABELS[h.toStatus] || h.toStatus}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {h.createdAt
                      ? new Date(h.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                  {h.reason && (
                    <p className="text-muted-foreground">{h.reason}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function OrdersTab() {
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: userOrders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userOrders || userOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">
            Nenhum pedido ainda
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Faca sua primeira compra!
          </p>
          <Link href="/">
            <Button size="sm" data-testid="button-go-shopping">
              Ir as compras
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(userOrders as any[]).map((order: any) => {
        const items = Array.isArray(order.items) ? order.items : [];
        const isExpanded = expandedOrder === order.id;
        const StatusIcon = STATUS_ICONS[order.status] || Clock;

        return (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardContent className="p-0">
              <button
                data-testid={`button-expand-order-${order.id}`}
                className="w-full p-4 flex items-center justify-between gap-3 text-left"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <StatusIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        Pedido #{order.id}
                      </span>
                      <Badge
                        variant={statusVariant(order.status)}
                        className="text-[10px]"
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString(
                            "pt-BR",
                            { day: "2-digit", month: "long", year: "numeric" },
                          )
                        : ""}
                      {" - "}
                      {items.length} {items.length === 1 ? "item" : "itens"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    R$ {Number(order.total).toFixed(2)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border">
                  <div className="pt-3 mb-3">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {ORDER_FLOW.map((step, idx) => {
                        const isTerminal =
                          order.status === "nao_retirado" ||
                          order.status === "cancelado";
                        const progressIdx = isTerminal
                          ? ORDER_FLOW.indexOf("pronto_retirada")
                          : ORDER_FLOW.indexOf(order.status);
                        const isCompleted =
                          progressIdx >= 0 ? idx <= progressIdx : false;
                        const isCurrent = step === order.status;
                        const StepIcon = STATUS_ICONS[step] || Clock;
                        return (
                          <div key={step} className="flex items-center gap-1">
                            <div
                              className={`flex flex-col items-center min-w-[56px]`}
                            >
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  isCurrent
                                    ? "bg-primary text-primary-foreground"
                                    : isCompleted
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <StepIcon className="w-3.5 h-3.5" />
                              </div>
                              <span
                                className={`text-[9px] mt-0.5 text-center leading-tight ${isCurrent ? "font-bold text-primary" : "text-muted-foreground"}`}
                              >
                                {STATUS_LABELS[step]?.split(" ")[0] || step}
                              </span>
                            </div>
                            {idx < ORDER_FLOW.length - 1 && (
                              <div
                                className={`w-4 h-0.5 mt-[-12px] ${isCompleted && idx < progressIdx ? "bg-primary" : "bg-muted"}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {order.status === "pronto_retirada" &&
                      order.pickupDeadline && (
                        <PickupCountdown deadline={order.pickupDeadline} />
                      )}

                    {(order.status === "nao_retirado" ||
                      order.status === "cancelado") && (
                      <div
                        className={`mt-2 p-2 rounded-md text-xs ${ORDER_STATUS_COLORS[order.status]}`}
                      >
                        <div className="flex items-center gap-1 font-medium">
                          {order.status === "nao_retirado" ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {STATUS_LABELS[order.status]}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          <img
                            src={
                              item.imageUrl || "https://via.placeholder.com/40"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/40";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.qty}x R$ {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                          R$ {(Number(item.price) * item.qty).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="text-base font-bold text-primary">
                      R$ {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  <OrderHistory orderId={order.id} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GroupsTab() {
  const { data: userGroups, isLoading } = useQuery({
    queryKey: ["/api/user/groups"],
    queryFn: async () => {
      const res = await fetch("/api/user/groups", { credentials: "include" });
      if (!res.ok) return [];
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userGroups || userGroups.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">Nenhum grupo ainda</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Entre em um grupo e comece a economizar!
          </p>
          <Link href="/">
            <Button size="sm" data-testid="button-view-products">
              Ver produtos
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(userGroups as any[]).map((g: any) => {
        const progress =
          g.minPeople > 0
            ? Math.round((g.currentPeople / g.minPeople) * 100)
            : 0;
        const isComplete = g.currentPeople >= g.minPeople;

        return (
          <Card key={g.memberId} data-testid={`card-user-group-${g.groupId}`}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                  <img
                    src={g.productImageUrl || "https://via.placeholder.com/64"}
                    alt={g.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/64";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight">
                    {g.productName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grupo #{g.groupId}
                  </p>
                  <p className="text-sm text-primary font-bold mt-1">
                    R$ {Number(g.groupPrice).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Participantes</span>
                  <span className="font-medium">
                    {g.currentPeople}/{g.minPeople}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={statusVariant(g.status)}
                    className="text-[10px]"
                  >
                    {STATUS_LABELS[g.status] || g.status}
                  </Badge>
                  {g.reserveStatus && g.reserveStatus !== "nenhuma" && (
                    <Badge
                      variant={
                        g.reserveStatus === "pago" ? "secondary" : "outline"
                      }
                      className="text-[10px]"
                    >
                      Taxa: {STATUS_LABELS[g.reserveStatus] || g.reserveStatus}
                    </Badge>
                  )}
                  {isComplete && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-green-100 text-green-700"
                    >
                      Meta atingida
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function Account() {
  const { data: user, isLoading: authLoading } = useAuth();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<AccountTab>("profile");

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login?redirect=/minha-conta");
    return null;
  }

  const tabs: { key: AccountTab; label: string; icon: any }[] = [
    { key: "profile", label: "Perfil", icon: UserCircle },
    { key: "address", label: "Endereco", icon: MapPin },
    { key: "security", label: "Seguranca", icon: Shield },
    { key: "orders", label: "Pedidos", icon: Package },
    { key: "groups", label: "Grupos", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="brand-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/" data-testid="link-account-logo">
              <BrandLogo size="header" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs hidden sm:inline">
              {user.displayName || user.name}
            </span>
            <Button
              data-testid="button-logout-account"
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => {
                logout.mutate();
                setLocation("/");
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar user={user} />
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {user.displayName || user.name}
              </h1>
              <p className="text-sm text-muted-foreground">Minha Conta</p>
            </div>
          </div>

          <div className="flex flex-wrap gap2 pb-1">
            {tabs.map((t) => (
              <Button
                key={t.key}
                data-testid={`tab-${t.key}`}
                variant={tab === t.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setTab(t.key)}
                className="flex-1 min-w- [140px] sm:flex-none sm:win-w-0"
              >
                <t.icon className="w-4 h-4 mr-1.5" />
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="pb-8">
          {tab === "profile" && <ProfileTab user={user} />}
          {tab === "address" && <AddressTab user={user} />}
          {tab === "security" && <SecurityTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "groups" && <GroupsTab />}
        </div>
      </div>

      <Footer />
    </div>
  );
}
