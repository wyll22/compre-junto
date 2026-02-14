import { useState } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
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
          toast({ title: "Erro", description: "Informe seu nome", variant: "destructive" });
          return;
        }
        await register.mutateAsync({ name: name.trim(), email: email.trim(), password, phone: phone.trim() });
        toast({ title: "Conta criada!", description: "Bem-vindo ao Compra Junto Formosa!" });
      } else {
        await login.mutateAsync({ email: email.trim(), password });
        toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });
      }
      setLocation(redirect);
    } catch (err: any) {
      const msg = err?.message || "Erro ao processar";
      const cleanMsg = msg.includes(":") ? msg.split(":").slice(1).join(":").trim() : msg;
      let parsed = cleanMsg;
      try {
        const obj = JSON.parse(cleanMsg);
        parsed = obj.message || cleanMsg;
      } catch {}
      toast({ title: "Erro", description: parsed, variant: "destructive" });
    }
  };

  const loading = login.isPending || register.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <BrandLogo size="large" />
          <p className="text-muted-foreground text-sm mt-1">
            {isRegister ? "Crie sua conta" : "Entre na sua conta"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{isRegister ? "Cadastro" : "Login"}</CardTitle>
            <CardDescription>
              {isRegister
                ? "Preencha seus dados para criar uma conta"
                : "Entre com seu email e senha"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    data-testid="input-register-name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Maria Silva"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  data-testid="input-email"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  data-testid="input-password"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  minLength={4}
                />
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input
                    data-testid="input-register-phone"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(75) 99999-9999"
                  />
                </div>
              )}

              <Button
                data-testid="button-submit-auth"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {isRegister ? "Criar conta" : "Entrar"}
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
  );
}
