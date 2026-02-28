# Auditoria UX + Bugs (produção)

- **URL auditada:** `https://compre-junto--vagaswstelecom.replit.app`
- **Data:** 2026-02-28
- **Método:** Playwright (desktop + mobile), inspeção de respostas de rede e headers HTTP.

## Checklist solicitado

### 1) Desktop: header (logo, busca, alinhamento), responsividade, menu
- **Header sem branding visível**: não foi detectado `<img>`/logo no header em desktop (`logo_count: 0`).
- **Busca ausente no header**: não foi detectado input de busca (`search_count: 0`).
- **Alinhamento geral**: header ocupa largura total (`w: 1440`) e não aparenta overflow horizontal.
- **Menu**: existem botões no header, porém sem rótulo claro para IA de teste (`menu_button_count: 4`) e sem navegação robusta por categorias (API de categorias falhando 500).

### 2) Mobile: header, tabs “Compra em Grupo/Compre Agora”, scroll, legibilidade
- **Header mobile** renderiza (altura ~183px), porém parece alto para primeira dobra em telas pequenas.
- **Tabs “Compra em Grupo / Compre Agora” estão visíveis**.
- **Scroll funcional** (scrollY > 1000 durante teste).
- **Legibilidade mínima aceitável**, mas há textos em **12px** (limite inferior para conforto, especialmente em Android low-end/usuários com baixa visão).

### 3) Auth: cadastro, login, logout, sessão persistindo após refresh
- **Login página carrega** com 2 campos (usuário/senha).
- **Tentativa de login retorna 403** em `/api/auth/login` (não foi possível autenticar com conta de teste).
- **Cadastro com rota dedicada quebrado**: `/cadastro` e `/register` retornam tela 404.
- **Logout e persistência real de sessão autenticada**: não validáveis sem credencial válida.

### 4) Admin: acesso /admin com role=admin, navegação, telas principais carregando
- **Proteção de rota existe**: acesso a `/admin` redireciona para `/login?redirect=/admin` sem sessão.
- **Não foi possível validar fluxo role=admin** por falta de conta admin funcional.
- **Endpoints usados no contexto admin falham** (ex.: `/api/groups`, `/api/categories`, footer links), com respostas 500.

### 5) Console/Network: erros no console, chamadas 4xx/5xx, endpoints quebrando
- Console apresenta múltiplos erros em home/login/admin.
- Endpoints com falha observados:
  - `401`: `/api/auth/me` (esperado sem sessão)
  - `403`: `/api/track-visit`, `/api/auth/login` (na tentativa)
  - `500`: `/api/categories`, `/api/navigation-links`, `/api/banners`, `/api/sponsor-banners`, `/api/featured-products`, `/api/videos`, `/api/products?saleMode=grupo`, `/api/groups`
- Isso impacta conteúdo crítico da home e confiança do usuário.

### 6) Performance: LCP/CLS (percepção), imagens pesadas, carregamento inicial
- **Percepção de performance inicial boa/moderada** no teste sintético:
  - LCP ~ **824ms**
  - CLS ~ **0.0009**
  - DOMContentLoaded ~ **587ms**
- **Ponto de atenção forte**: bundle JS principal com ~**800KB transferidos** (`/assets/index-CmGlHkcE.js`).
- A boa percepção atual pode degradar em 3G/4G fraco por JS inicial grande + retries de APIs com erro.

### 7) Segurança básica: /api/admin protegidas, CORS, cookies secure
- **/api/admin aparentemente protegida**: `/api/admin/users` sem sessão retorna 401.
- **CORS**: não há cabeçalhos `Access-Control-Allow-*` nas respostas observadas (pode estar ok se política for same-origin estrita; para integrações externas, quebrará).
- **Cookie observado sem Secure/HttpOnly** (`GAESA`):
  - `secure: false`
  - `httpOnly: false`
  - `sameSite: Lax`
  > Para produção, é recomendável endurecer política de cookies de sessão/autenticação.

### 8) Verificação de NODE_ENV=production, cookies secure, CORS
- **NODE_ENV=production**: não há endpoint público confiável para leitura direta da env.
- **Indícios de build de produção**: HTML aponta para assets versionados (`/assets/index-*.js`) e não inclui `/@vite/client`.
- **Cookies secure**: **não conformes** no cookie observado (`secure: false`).
- **CORS**: sem cabeçalhos explícitos observáveis em GET/OPTIONS testados.

## Top 10 problemas críticos (ordem de impacto)

1. **APIs críticas da home com 500** (`categories`, `banners`, `featured-products`, `videos`, `products`), deixando vitrine incompleta/instável.
2. **Cadastro quebrado por rotas 404** (`/cadastro` e `/register`), bloqueando crescimento da base.
3. **Login retornando 403** em cenário de teste, impedindo acesso de usuários/admin (necessário revisar fluxo auth/CSRF/origem).
4. **`/api/track-visit` com 403** recorrente, gerando ruído de erro e possível perda de métricas.
5. **Erros de console constantes em produção**, reduzindo confiabilidade e mascarando regressões reais.
6. **Header desktop sem logo/busca visíveis**, piorando orientação e encontrabilidade.
7. **Dependência de múltiplos endpoints quebrados também no fluxo /admin**, comprometendo operação interna.
8. **Cookie sem `Secure` e sem `HttpOnly`** (ao menos no cookie observado), risco de exposição via tráfego não ideal/XSS.
9. **CSP bloqueando iframes YouTube** enquanto a home expõe seção de vídeos (experiência inconsistente).
10. **Bundle JS inicial grande (~800KB)**, risco de degradação em rede móvel real.

## Propostas de correções pequenas (PRs separados)

1. **PR-01: Hardening de erros 500 da home**
   - Tratar exceções no backend dessas rotas e retornar payload vazio + status 200/204 quando apropriado.
   - Adicionar logs estruturados por endpoint com correlation-id.

2. **PR-02: Corrigir roteamento de cadastro**
   - Garantir rota canônica (`/cadastro`) e redirecionar `/register` -> `/cadastro`.
   - Ajustar CTA de “Cadastre-se” para usar rota válida.

3. **PR-03: Revisão do fluxo de login 403**
   - Verificar CORS/CSRF/origin e mensagens de erro.
   - Garantir resposta de validação de credenciais com 401/422 (não 403 genérico) quando aplicável.

4. **PR-04: Telemetria resiliente para `/api/track-visit`**
   - Tornar endpoint não bloqueante para UX (falha silenciosa + retry assíncrono).
   - Ajustar política para aceitar origem legítima do frontend.

5. **PR-05: Limpeza de console em produção**
   - Remover scripts externos bloqueados não essenciais.
   - Ajustar políticas para eliminar erros esperados e manter console “limpo”.

6. **PR-06: Header desktop UX**
   - Reintroduzir logo visível clicável + campo de busca (mesmo simples com autocomplete posterior).

7. **PR-07: Robustez do admin**
   - Fallback visual para quando `/api/groups`/`/api/categories` falharem (estado vazio + retry).

8. **PR-08: Segurança de cookies**
   - Cookies sensíveis com `Secure`, `HttpOnly`, `SameSite=Lax/Strict` conforme fluxo.
   - Se behind proxy, garantir `trust proxy` e detecção HTTPS correta.

9. **PR-09: CSP compatível com seção de vídeos**
   - Adicionar `frame-src https://www.youtube.com https://www.youtube-nocookie.com` se vídeos embutidos forem requisito.

10. **PR-10: Otimização do bundle inicial**
   - Code splitting por rota, lazy load de blocos não críticos e revisão de dependências pesadas.

## Evidências objetivas coletadas
- Home desktop retornou 200, porém com múltiplos endpoints 500 e 403.
- `/admin` redireciona para login com query de redirect (proteção básica ativa).
- Medidas sintéticas de UX: LCP ~824ms, CLS ~0.0009, JS principal ~800KB.
- Cookie `GAESA` observado como `secure: false` e `httpOnly: false`.
