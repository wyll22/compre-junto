# Auditoria UX + Bugs (produção)

Data: 2026-02-28  
URL auditada: `https://compre-junto--vagaswstelecom.replit.app`

## Evidências (screenshots)
- Desktop home: `browser:/tmp/codex_browser_invocations/5a62d22ccee9a130/artifacts/artifacts/desktop-home.png`
- Mobile home: `browser:/tmp/codex_browser_invocations/5a62d22ccee9a130/artifacts/artifacts/mobile-home.png`
- Mobile após cliques em tabs: `browser:/tmp/codex_browser_invocations/9cb3914f5ad579a7/artifacts/artifacts/mobile-after-clicks.png`
- Login (redirecionado de `/admin`): `browser:/tmp/codex_browser_invocations/3bb509bf574c9541/artifacts/artifacts/admin-page.png`
- Erro ao tentar login: `browser:/tmp/codex_browser_invocations/f19f6de06d0271be/artifacts/artifacts/login-error.png`

## Checklist solicitado

### 1) Desktop: header (logo, busca, alinhamento), responsividade, menu
- ✅ Header com logo, busca central e ícones no topo; visualmente alinhado.
- ⚠️ Não há menu de categorias/hambúrguer no desktop (somente tabs principais); pode limitar descoberta de conteúdo.
- ⚠️ Seções de "Mais vendidos" e "Patrocinadores" vazias na home, com placeholders.
- ✅ Tabs principais funcionam (`Compra em Grupo` e `Compre Agora`).

### 2) Mobile: header, tabs “Compra em Grupo/Compre Agora”, scroll, legibilidade
- ✅ Header móvel preserva logo, ícones e busca.
- ✅ Tabs “Compra em Grupo/Compre Agora” aparecem e navegam para `/grupos` e `/compre-agora`.
- ✅ Scroll vertical funcional; conteúdo legível no geral.
- ⚠️ Área de vídeos aparece com blocos cinza em vez de thumbnails, piorando percepção de qualidade/entendimento.

### 3) Auth: cadastro, login, logout, sessão persistindo após refresh
- ❌ `/admin` redireciona corretamente para login, mas fluxo de cadastro não está operacional (link “Cadastre-se” sem navegação efetiva/sem formulário de cadastro).
- ❌ Login com credenciais inválidas retorna erro de infraestrutura exposto ao usuário: `getaddrinfo EAI_AGAIN helium`.
- ⚠️ Não foi possível validar logout e persistência de sessão por ausência de credencial válida e cadastro quebrado.
- ✅ Endpoint `/api/auth/me` retorna `401` para não autenticado (esperado nesse estado).

### 4) Admin: acesso /admin com role=admin, navegação, telas principais carregando
- ✅ Guarda de rota ativa: `/admin` sem sessão redireciona para `/login?redirect=/admin`.
- ⚠️ Não foi possível validar telas internas de admin por falta de credencial `role=admin` válida em produção.
- ⚠️ Rota `/api/admin` responde shell HTML (200) ao invés de payload de API — risco de roteamento confuso ou endpoint inexistente.

### 5) Console/Network: erros no console, chamadas 4xx/5xx, endpoints quebrando
- ❌ CSP bloqueando script externo `replit-pill.global.js` (erro repetido no console).
- ❌ Falha de fonte Google Fonts com `400` + `MIME type mismatch` + `nosniff`.
- ⚠️ `401 /api/auth/me` recorrente em visitantes não logados (pode ser aceitável, mas gera ruído operacional no monitoramento).
- ❌ `POST /api/auth/login` retornou `400` com mensagem de backend não tratada (UI exibe erro técnico cru).

### 6) Performance: LCP/CLS (percepção), imagens pesadas, carregamento inicial
- ✅ CLS medido ~`0` no cenário testado (sem deslocamentos perceptíveis).
- ✅ LCP observado ~`802ms` no ambiente de teste (aparente bom).
- ❌ `favicon.png` transferindo ~`2.1MB` (muito acima do ideal para favicon; impacto em carga inicial e cache).
- ⚠️ Bundle JS principal ~`800KB` transferidos; há espaço para code splitting/otimização.

### 7) Segurança básica: rotas /api/admin protegidas, CORS ok, cookies secure
- ✅ `/api/admin/users` retorna `401` sem autenticação (proteção básica presente).
- ⚠️ Preflight `OPTIONS /api/auth/login` respondeu sem headers CORS explícitos (`access-control-allow-*` ausentes); precisa validação contra política esperada.
- ❌ Cookie `GAESA` observado sem flag `Secure` e sem `HttpOnly`.

### 8) Verificar NODE_ENV=production, cookies secure e CORS
- ⚠️ Não há exposição direta de `NODE_ENV` via resposta HTTP; inferência de build de produção por assets hasheados/minificados (`/assets/index-q2PCDOGl.js`, sem traços de `development`).
- ❌ Cookies não estão `Secure` (`GAESA` sem `secure`).
- ⚠️ CORS não anuncia política explícita nas respostas testadas; revisar configuração para APIs autenticadas.

## Top 10 problemas críticos (ordem)
1. **Erro técnico exposto no login** (`getaddrinfo EAI_AGAIN helium`) no toast para usuário final.
2. **Cadastro indisponível** (CTA “Cadastre-se” não leva a fluxo funcional).
3. **Cookie sem `Secure` e sem `HttpOnly`** (`GAESA`).
4. **Google Fonts quebrado** (400 + MIME mismatch), afetando consistência visual/branding.
5. **CSP bloqueando script externo** (`replit-pill.global.js`) gerando erro de console contínuo.
6. **Rota `/api/admin` devolvendo HTML** com status 200 (ambiguidade de roteamento API/app shell).
7. **Favicon extremamente pesado (~2.1MB)** prejudicando performance inicial.
8. **Bundle JS principal grande (~800KB)** potencial para lentidão em redes móveis.
9. **Ruído de `401 /api/auth/me` em visitante anônimo** em toda carga de página.
10. **Seções críticas da home vazias** (“Mais vendidos”, “Patrocinadores”, vídeos sem thumb em mobile), reduzindo confiança e conversão.

## Proposta de correções pequenas (PRs separados)
- **PR-01 (Auth UX):** Tratar erros de login por categoria (credencial inválida vs erro interno), ocultar stack/mensagem técnica e exibir texto amigável.
- **PR-02 (Auth Cadastro):** Consertar CTA “Cadastre-se” para rota/toggle real e garantir formulário completo com validação e submit.
- **PR-03 (Cookies):** Ativar flags `Secure`, `HttpOnly`, `SameSite=Lax/Strict` em cookies de sessão no ambiente produção.
- **PR-04 (Fonts):** Corrigir carregamento de Google Fonts (ou self-host), ajustando CSP e `Content-Type` para evitar `nosniff` mismatch.
- **PR-05 (CSP):** Remover script externo não utilizado ou incluir origem permitida na política CSP.
- **PR-06 (API Routing):** Separar claramente `/api/*` do roteamento SPA; `/api/admin` deve retornar JSON/404 coerente.
- **PR-07 (Perf favicon):** Substituir favicon por versões otimizadas (16/32/48 + SVG), reduzir de MB para poucos KB.
- **PR-08 (Perf JS):** Aplicar code-splitting e lazy-load em áreas não críticas (admin, vídeos, blocos institucionais).
- **PR-09 (Auth check):** Evitar chamada automática de `/api/auth/me` quando usuário visitante não possui sessão.
- **PR-10 (Home conteúdo):** Preencher fallback visual útil para blocos vazios (skeleton/CTA) e thumbnails de vídeo consistentes no mobile.

## Limitações da auditoria
- Sem credencial de admin válida, a navegação interna de `/admin` não pôde ser auditada completamente.
- Sem conta funcional em produção (cadastro quebrado), não foi possível concluir ciclo completo login/logout/sessão persistente autenticada.
