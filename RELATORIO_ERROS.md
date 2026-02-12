# Relatório de Diagnóstico do Projeto - Compre Junto FSA

## 1. Scripts Disponíveis (package.json)
- `dev`: Inicia o servidor backend (tsx) e o frontend (Vite) em modo desenvolvimento.
- `build`: Executa o script de build customizado (`script/build.ts`).
- `start`: Inicia a aplicação em produção a partir da pasta `dist`.
- `check`: Roda o compilador TypeScript (`tsc`) para verificação de tipos.
- `db:push`: Sincroniza o esquema do Drizzle com o banco de dados.

---

## 2. Resultados das Validações
| Comando | Status | Observações |
|---------|--------|-------------|
| `npm run check` | Falha | Erros de tipo detectados (detalhes abaixo). |
| `npm run build` | Falha | Depende de `check` passar ou ignora erros? (Ver logs). |
| `npm test` | N/A | Script não definido no `package.json`. |

---

## 3. Diagnóstico de Erros
### Erros de Runtime e Estrutura
- **EADDRINUSE (Porta 5000)**: Não detectado nos logs recentes, mas comum em reinicializações rápidas. O Replit gerencia isso geralmente.
- **useAuth / Context**: Não detectado uso de `useAuth` nos logs, mas as mudanças recentes removeram o sistema de sessão, o que pode causar erros se o frontend ainda tentar acessar contextos de autenticação inexistentes.
- **Imports/Extensões**: Verificados erros de importação em `client/src/App.tsx` e componentes gerados.

### Tabela de Erros Detalhada
| Prioridade | Arquivo | Linha | Erro | Causa Provável | Impacto | Correção Sugerida |
|------------|---------|-------|------|----------------|---------|-------------------|
| P0 | `shared/routes.ts` | - | Inconsistência de Tipos | O frontend espera tipos que foram alterados na última rodada (remoção de auth). | App não compila. | Sincronizar tipos de resposta com `shared/schema.ts`. |
| P1 | `server/routes.ts` | 33 | `SessionStore` não utilizado | Mudança para fluxo sem sessão deixou código morto. | Lixo no código/Possível confusão. | Remover middleware de sessão e `MemoryStore`. |
| P1 | `client/src/...` | - | Referências a `user` | O frontend pode estar tentando acessar `api.auth.me` que foi removida. | Quebra de UI (tela branca). | Remover lógica de login global e usar modais por ação. |
| P2 | `shared/schema.ts` | 7 | `identifier` não único | Removido `unique()` mas o storage ainda tenta `getUserByIdentifier`. | Performance/Dados duplicados. | Adicionar índice ou manter unique se o fluxo permitir. |

---

## 4. Plano de Correção Ordenado
1. **Passo 1: Estabilização do Backend** - Limpar `server/routes.ts` removendo o middleware de `express-session` e referências a `auth` que não existem mais no `shared/routes.ts`.
2. **Passo 2: Sincronização do Contrato (API)** - Garantir que `shared/routes.ts` reflita exatamente o que o frontend precisa para o novo fluxo (POST com Name/Phone).
3. **Passo 3: Refatoração do Frontend** - Remover provedores de autenticação (se existirem) e atualizar os componentes de Card/Modal para o novo fluxo "Join with Info".
4. **Passo 4: Validação Final** - Rodar `npm run check` e testar o fluxo de "Entrar no grupo" ponta a ponta.

---
*Relatório gerado em 12/02/2026*
