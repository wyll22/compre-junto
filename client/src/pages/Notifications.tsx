import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";

type UserNotification = { id: number; title: string; message: string; createdAt: string; read: boolean; targetPath?: string };

export default function Notifications() {
  const { data: user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login?redirect=/notificacoes");
  }, [isLoading, user, setLocation]);

  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (ids?: number[]) => apiRequest("POST", "/api/notifications/mark-read", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background py-4 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3 pb-16">
        <div className="flex items-center justify-between gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Voltar</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => markRead.mutate(undefined)}>
            <CheckCheck className="w-4 h-4 mr-1" />Marcar todas como lidas
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-lg">Central de notificacoes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                Nenhuma notificacao ainda.
              </div>
            ) : notifications.map((n) => (
              <Link key={n.id} href={n.targetPath || "/notificacoes"}>
                <button
                  className={`w-full border rounded-md p-3 text-left ${!n.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}
                  onClick={() => !n.read && markRead.mutate([n.id])}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    <Badge variant={n.read ? "outline" : "default"}>{n.read ? "Lida" : "Nao lida"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
                </button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
