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
- CORS com allowlist explícita (`APP_DOMAIN` + `CORS_ALLOWED_ORIGINS`).
- Bloqueio de mutações por origem/referer inválidos em produção.
- Logs de API sanitizados para não vazar dados sensíveis.
- Endpoints administrativos protegidos no backend por validação de role.
