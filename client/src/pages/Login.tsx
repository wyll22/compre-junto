import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, Phone, Lock, User2, Smile } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { parseApiError } from "@/lib/error-utils";
import { Footer } from "@/components/Footer";

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const login = useLogin();
  const register = useRegister();

  const redirect = new URLSearchParams(search).get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isRegister) {
        if (!name.trim()) {
          toast({ title: "Erro", description: "Informe seu nome completo", variant: "destructive" });
          return;
        }
        if (!email.trim()) {
          toast({ title: "Erro", description: "Informe seu email", variant: "destructive" });
          return;
        }
        if (password.length < 8) {
          toast({ title: "Erro", description: "Senha deve ter pelo menos 8 caracteres", variant: "destructive" });
          return;
        }
        await register.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          displayName: displayName.trim(),
        });
        toast({ title: "Conta criada!", description: `Bem-vindo${displayName ? ", " + displayName : ""}! Sua conta foi criada com sucesso.` });
      } else {
        if (!identifier.trim()) {
          toast({ title: "Erro", description: "Informe seu email ou telefone", variant: "destructive" });
          return;
        }
        await login.mutateAsync({ identifier: identifier.trim(), password });
        toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });
      }
      setLocation(redirect);
    } catch (err: any) {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    }
  };

  const loading = login.isPending || register.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-login">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <BrandLogo size="large" />
          <p className="text-muted-foreground text-sm mt-2">
            {isRegister ? "Crie sua conta e comece a economizar" : "Acesse sua conta"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isRegister ? "Criar Conta" : "Entrar"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "Preencha seus dados para comecar"
                : "Use seu email ou numero de celular"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name">Nome completo *</Label>
                    <div className="relative">
                      <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-register-name"
                        id="reg-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Maria da Silva"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-display">Como quer ser chamado(a)?</Label>
                    <div className="relative">
                      <Smile className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-register-display-name"
                        id="reg-display"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Ex: Mari, Dona Maria..."
                        className="pl-10"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Opcional. Esse apelido aparece no app.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-register-email"
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone">Celular / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-register-phone"
                        id="reg-phone"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                        placeholder="(61) 99999-9999"
                        className="pl-10"
                        inputMode="tel"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Voce podera fazer login com o celular tambem.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-password">Senha *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-register-password"
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimo 8 caracteres"
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-id">Email ou celular</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-identifier"
                        id="login-id"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="seu@email.com ou (61) 99999-9999"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-password"
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <Button
                data-testid="button-submit-auth"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {isRegister ? "Criar minha conta" : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                data-testid="button-toggle-auth-mode"
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-primary hover:underline"
              >
                {isRegister ? "Ja tem conta? Faca login" : "Nao tem conta? Cadastre-se"}
              </button>
            </div>

            <div className="mt-3 p-2 bg-muted rounded-md text-[11px] text-muted-foreground">
              <strong>Admin:</strong> admin@comprajuntoformosa.com / admin123
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}
