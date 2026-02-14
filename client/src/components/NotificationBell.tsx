import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Package, CheckCheck, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export function NotificationBell() {
  const { data: user } = useAuth();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && open,
  });

  const markRead = useMutation({
    mutationFn: async (ids?: number[]) => {
      await apiRequest("POST", "/api/notifications/mark-read", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = countData?.count || 0;

  if (!user) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-primary-foreground"
        data-testid="button-notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <Card className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto z-50 shadow-lg">
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
              <span className="font-bold text-sm text-foreground">Notificacoes</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => markRead.mutate(undefined)}
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Marcar lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              {(!notifications || notifications.length === 0) ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma notificacao</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2 p-3 border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}
                      data-testid={`notification-${n.id}`}
                    >
                      <Package className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-snug ${!n.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60">{formatDate(n.createdAt)}</span>
                      </div>
                      {n.referenceId && (
                        <Link href="/minha-conta">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-6 px-1.5"
                            onClick={() => setOpen(false)}
                            data-testid={`button-view-order-${n.referenceId}`}
                          >
                            Ver
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
