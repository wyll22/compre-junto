import { useState, useEffect, useRef } from "react";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowLeft, Mail, Phone, Lock, User2, Smile, KeyRound, CheckCircle2, Circle, Check } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Link, useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { parseApiError } from "@/lib/error-utils";
import { Footer } from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";

function formatPhoneBR(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type ViewMode = "login" | "register" | "forgot" | "reset";

export default function Login() {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const login = useLogin();
  const register = useRegister();

  const params = new URLSearchParams(search);
  const redirect = params.get("redirect") || "/";
  const resetToken = params.get("reset") || "";

  const [viewMode, setViewMode] = useState<ViewMode>(resetToken ? "reset" : "login");

  useEffect(() => {
    if (resetToken) setViewMode("reset");
  }, [resetToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLockRef.current || loading) return;
    submitLockRef.current = true;

    try {
      if (viewMode === "register") {
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
        if (!/[A-Z]/.test(password)) {
          toast({ title: "Erro", description: "Senha deve conter pelo menos uma letra maiuscula", variant: "destructive" });
          return;
        }
        if (!/[a-z]/.test(password)) {
          toast({ title: "Erro", description: "Senha deve conter pelo menos uma letra minuscula", variant: "destructive" });
          return;
        }
        if (!/[0-9]/.test(password)) {
          toast({ title: "Erro", description: "Senha deve conter pelo menos um numero", variant: "destructive" });
          return;
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
          toast({ title: "Erro", description: "Senha deve conter pelo menos um caractere especial (!@#$%...)", variant: "destructive" });
          return;
        }
        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length > 0 && phoneDigits.length !== 11) {
          toast({ title: "Erro", description: "Telefone deve ter 11 digitos (DDD + 9 digitos)", variant: "destructive" });
          return;
        }
        if (!acceptTerms || !acceptPrivacy) {
          toast({ title: "Erro", description: "Aceite os Termos de Uso e a Politica de Privacidade para continuar", variant: "destructive" });
          return;
        }
        await register.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          displayName: displayName.trim(),
          acceptTerms,
          acceptPrivacy,
        });
        toast({ title: "Conta criada!", description: `Bem-vindo${displayName ? ", " + displayName : ""}! Sua conta foi criada com sucesso.` });
      } else {
        if (!identifier.trim()) {
          toast({ title: "Erro", description: "Informe seu email ou telefone", variant: "destructive" });
          return;
        }
        const loginResult = await login.mutateAsync({ identifier: identifier.trim(), password });
        toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });
        if (loginResult?.role === "parceiro") {
          setLocation("/parceiro");
          return;
        }
      }
      setLocation(redirect);
    } catch (err: any) {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    } finally {
      submitLockRef.current = false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast({ title: "Erro", description: "Informe seu email cadastrado", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotSent(true);
      toast({ title: "Solicitacao enviada", description: "Se o email estiver cadastrado, voce recebera instrucoes." });
    } catch (err: any) {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({ title: "Erro", description: "Senha deve ter pelo menos 8 caracteres", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token: resetToken, password: newPassword });
      setResetSuccess(true);
      toast({ title: "Senha redefinida!", description: "Faca login com sua nova senha." });
    } catch (err: any) {
      toast({ title: "Erro", description: parseApiError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = login.isPending || register.isPending || submitting;

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
            {viewMode === "register" && "Crie sua conta e comece a economizar"}
            {viewMode === "login" && "Acesse sua conta"}
            {viewMode === "forgot" && "Recupere o acesso a sua conta"}
            {viewMode === "reset" && "Defina sua nova senha"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {viewMode === "register" && "Criar Conta"}
              {viewMode === "login" && "Entrar"}
              {viewMode === "forgot" && "Esqueci minha senha"}
              {viewMode === "reset" && "Nova senha"}
            </CardTitle>
            <CardDescription>
              {viewMode === "register" && "Preencha seus dados para comecar"}
              {viewMode === "login" && "Use seu email ou numero de celular"}
              {viewMode === "forgot" && "Informe o email cadastrado para receber instrucoes"}
              {viewMode === "reset" && "Escolha uma nova senha para sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === "forgot" ? (
              forgotSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">Solicitacao enviada!</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Se o email <strong>{forgotEmail}</strong> estiver cadastrado, voce recebera um link para redefinir sua senha.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Nao recebeu? Verifique sua caixa de spam ou entre em contato pelo WhatsApp.
                  </p>
                  <Button
                    data-testid="button-back-to-login"
                    variant="outline"
                    size="sm"
                    onClick={() => { setViewMode("login"); setForgotSent(false); setForgotEmail(""); }}
                  >
                    Voltar para login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgot-email">Email cadastrado</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-forgot-email"
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="button-forgot-submit"
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                    Enviar instrucoes
                  </Button>
                  <div className="text-center">
                    <button
                      data-testid="button-back-to-login-from-forgot"
                      type="button"
                      onClick={() => setViewMode("login")}
                      className="text-sm text-primary hover:underline"
                    >
                      Voltar para login
                    </button>
                  </div>
                </form>
              )
            ) : viewMode === "reset" ? (
              resetSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">Senha redefinida!</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Sua senha foi alterada com sucesso. Faca login com a nova senha.
                  </p>
                  <Button
                    data-testid="button-go-to-login"
                    size="sm"
                    onClick={() => { setViewMode("login"); setLocation("/login"); }}
                  >
                    Fazer login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        data-testid="input-new-password"
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimo 8 caracteres"
                        className="pl-10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="button-reset-submit"
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                    Redefinir senha
                  </Button>
                </form>
              )
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {viewMode === "register" ? (
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
                            maxLength={15}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">DDD (2 digitos) + numero (9 digitos) = 11 digitos. Ex: (61) 99999-9999</p>
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
                            placeholder="Crie uma senha segura"
                            className="pl-10"
                            required
                            minLength={8}
                          />
                        </div>
                        {viewMode === "register" && password.length > 0 && (
                          <div className="space-y-0.5 mt-1">
                            <p className={`text-[11px] flex items-center gap-1 ${password.length >= 8 ? "text-green-600" : "text-muted-foreground"}`}>
                              {password.length >= 8 ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Minimo 8 caracteres
                            </p>
                            <p className={`text-[11px] flex items-center gap-1 ${/[A-Z]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Uma letra maiuscula
                            </p>
                            <p className={`text-[11px] flex items-center gap-1 ${/[a-z]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[a-z]/.test(password) ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Uma letra minuscula
                            </p>
                            <p className={`text-[11px] flex items-center gap-1 ${/[0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Um numero
                            </p>
                            <p className={`text-[11px] flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-muted-foreground"}`}>
                              {/[^A-Za-z0-9]/.test(password) ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />} Um caractere especial (!@#$%...)
                            </p>
                          </div>
                        )}
                      </div>


                      <div className="space-y-2 rounded-md border border-border p-3">
                        <label className="flex items-start gap-2 text-xs text-foreground">
                          <input
                            data-testid="input-accept-terms"
                            type="checkbox"
                            className="mt-0.5"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            required
                          />
                          <span>
                            Li e aceito os <Link href="/termos" className="text-primary underline">Termos de Uso</Link>.
                          </span>
                        </label>
                        <label className="flex items-start gap-2 text-xs text-foreground">
                          <input
                            data-testid="input-accept-privacy"
                            type="checkbox"
                            className="mt-0.5"
                            checked={acceptPrivacy}
                            onChange={(e) => setAcceptPrivacy(e.target.checked)}
                            required
                          />
                          <span>
                            Li e aceito a <Link href="/privacidade" className="text-primary underline">Politica de Privacidade</Link>.
                          </span>
                        </label>
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

                      <div className="text-right">
                        <button
                          data-testid="button-forgot-password"
                          type="button"
                          onClick={() => setViewMode("forgot")}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </button>
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
                    {viewMode === "register" ? "Criar minha conta" : "Entrar"}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    data-testid="button-toggle-auth-mode"
                    type="button"
                    onClick={() => setViewMode(viewMode === "register" ? "login" : "register")}
                    className="text-sm text-primary hover:underline"
                  >
                    {viewMode === "register" ? "Ja tem conta? Faca login" : "Nao tem conta? Cadastre-se"}
                  </button>
                </div>

                <div className="mt-3 p-2 bg-muted rounded-md text-[11px] text-muted-foreground">
                  Dica: use uma senha forte e nao compartilhe seus dados de acesso.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
      <Footer />
    </div>
  );
}
