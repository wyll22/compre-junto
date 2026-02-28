# Compra Junto Formosa

## Produção (release hardening)

### Variáveis obrigatórias
Copie `.env.example` para `.env` e configure:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_DOMAIN`

### Variáveis opcionais
- `CORS_ALLOWED_ORIGINS` para liberar domínios extras no CORS.
- `PORT` (padrão `5000`).

## Comandos

```bash
npm install
npm run check
npm run build
NODE_ENV=production npm run start
```

## Segurança aplicada
- Sessão com cookie `httpOnly`, `secure` em produção e `sameSite=lax`.
- CORS com allowlist explícita (`APP_DOMAIN` + `CORS_ALLOWED_ORIGINS`) e suporte a preview confiável do Replit apenas em ambiente preview.
- Bloqueio de mutações por origem/referer inválidos em produção.
- Logs de API sanitizados para não vazar dados sensíveis.
- Endpoints administrativos protegidos no backend por validação de role.

---

## Checklist de deploy no Replit

### 1) Secrets obrigatórios
- `DATABASE_URL` (Postgres de produção)
- `SESSION_SECRET` (secreto longo e aleatório)
- `APP_DOMAIN` (domínio exato publicado, ex.: `https://seu-app.replit.app`)

### 2) Secret opcional
- `CORS_ALLOWED_ORIGINS` (lista separada por vírgula para domínios adicionais)

### 3) Comando obrigatório antes de subir
```bash
npm run db:push
```

### 3.1) Bootstrap de administrador (quando necessário)
```bash
ADMIN_EMAIL=admin@seu-dominio.com ADMIN_PASSWORD=troque-esta-senha npm run seed:admin
```

### 4) Validação pós-deploy (curl)
```bash
curl -i "$APP_DOMAIN/api/health"
curl -i "$APP_DOMAIN/api/auth/me"
curl -i -X POST "$APP_DOMAIN/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"invalido@site.com","password":"senha-errada"}'
```
Esperado:
- `/api/health` retorna `200` e JSON (`{"ok":true}`).
- `/api/auth/me` sem sessão retorna `401` com JSON.
- `/api/auth/login` inválido retorna `401` (credencial errada) ou `422` (payload inválido), sem mensagem técnica.

### 5) Validação pós-deploy (3 cliques no site)
1. Abrir Home (`/`) e confirmar carregamento sem erro visível.
2. Abrir Login (`/login`) e tentar credencial inválida (mensagem amigável, sem stacktrace).
3. Acessar Admin (`/admin`) sem login e confirmar redirecionamento para `/login`.
