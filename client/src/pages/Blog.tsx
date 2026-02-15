import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { BrandLogo } from "@/components/BrandLogo";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

function usePageMeta(title: string, description?: string, image?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const setMeta = (name: string, content: string, property?: boolean) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, true);
      setMeta("twitter:description", description);
    }
    setMeta("og:title", title, true);
    setMeta("twitter:title", title);
    if (image) {
      setMeta("og:image", image, true);
      setMeta("twitter:image", image);
    }

    return () => { document.title = prevTitle; };
  }, [title, description, image]);
}

export function BlogList() {
  const { data: user } = useAuth();
  usePageMeta("Blog | Compra Junto Formosa", "Acompanhe as novidades, dicas e noticias do Compra Junto Formosa.");
  const { data: articles, isLoading } = useQuery<any[]>({
    queryKey: ["/api/articles", "published"],
    queryFn: async () => {
      const res = await fetch("/api/articles?published=true");
      if (!res.ok) throw new Error("Erro ao carregar artigos");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="brand-gradient border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" data-testid="link-blog-logo">
            <BrandLogo size="header" />
          </Link>
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6" data-testid="text-blog-title">
          Blog
        </h1>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (!articles || articles.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-articles">
                Nenhum artigo publicado ainda.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {articles?.map((article: any) => (
            <Link key={article.id} href={`/blog/${article.slug}`} data-testid={`link-article-${article.id}`}>
              <Card className="hover-elevate h-full">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-t-md"
                    loading="lazy"
                    data-testid={`img-article-${article.id}`}
                  />
                )}
                <CardContent className="pt-4">
                  <h2 className="text-lg font-bold text-foreground mb-1" data-testid={`text-article-title-${article.id}`}>
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3" data-testid={`text-article-excerpt-${article.id}`}>
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(article.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export function BlogPost() {
  const params = useParams<{ slug: string }>();
  const { data: user } = useAuth();
  const { data: article, isLoading, error } = useQuery<any>({
    queryKey: ["/api/articles", params.slug],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${params.slug}`);
      if (!res.ok) throw new Error("Artigo nao encontrado");
      return res.json();
    },
  });

  usePageMeta(
    article ? `${article.title} | Compra Junto Formosa` : "Blog | Compra Junto Formosa",
    article?.excerpt || article?.content?.slice(0, 160) || undefined,
    article?.imageUrl || undefined,
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="brand-gradient border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <Link href="/" data-testid="link-blogpost-logo">
            <BrandLogo size="header" />
          </Link>
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            <Link href="/blog">
              <Button variant="outline" size="sm" data-testid="button-back-blog">
                <ArrowLeft className="w-4 h-4 mr-1" /> Blog
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-article-not-found">
                Artigo nao encontrado.
              </p>
              <Link href="/blog">
                <Button variant="outline" size="sm" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Blog
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {article && (
          <article>
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-64 sm:h-80 object-cover rounded-md mb-6"
                data-testid="img-article-hero"
              />
            )}
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-2" data-testid="text-article-detail-title">
              {article.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="w-4 h-4" />
              <span data-testid="text-article-date">
                {new Date(article.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none text-foreground"
              data-testid="text-article-content"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {article.content}
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
