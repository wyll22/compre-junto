import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  useEffect(() => { if (!isLoading && !user) setLocation("/login?redirect=/notificacoes"); }, [isLoading, user, setLocation]);
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => { const res = await fetch("/api/notifications", { credentials: "include" }); return res.ok ? res.json() : []; },
    enabled: !!user,
  });
  const markRead = useMutation({ mutationFn: async (ids?: number[]) => apiRequest("POST", "/api/notifications/mark-read", { ids }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/notifications"] }); qc.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] }); } });
  if (!user) return null;
  return <div className="min-h-screen bg-background p-4"><div className="max-w-3xl mx-auto space-y-3 pb-24"><div className="flex justify-between"><Link href="/"><Button variant="ghost" size="sm">Voltar</Button></Link><Button variant="outline" size="sm" onClick={() => markRead.mutate(undefined)}>Marcar todas lidas</Button></div><Card><CardHeader><CardTitle>Central de notificacoes</CardTitle></CardHeader><CardContent className="space-y-2">{notifications.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma notificacao.</p> : notifications.map((n: any) => <Link key={n.id} href={n.referenceId ? `/minha-conta?tab=orders&orderId=${n.referenceId}` : "/notificacoes"}><button className={`w-full text-left rounded-md border p-3 ${!n.read ? "bg-primary/5" : ""}`} onClick={() => !n.read && markRead.mutate([n.id])}><div className="flex justify-between gap-2"><p className="text-sm font-medium">{n.title}</p><Badge variant={n.read ? "outline" : "default"}>{n.read ? "Lida" : "Nao lida"}</Badge></div><p className="text-sm text-muted-foreground">{n.message}</p><p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("pt-BR")}</p></button></Link>)}</CardContent></Card></div></div>;
}
