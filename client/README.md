# Client (React)

Frontend do SIAD-PrEP.

## Stack

- React 19 + TypeScript + Vite
- React Router (roteamento + guarda de rota por autenticação)
- TanStack Query (data fetching)
- Tailwind CSS v4 + shadcn/ui (componentes em `src/components/ui/`, estilo copiado localmente — não é dependência de pacote)
- React Hook Form + Zod (pronto para formulários; ainda não usado nas telas atuais)

## Rodando localmente

```bash
npm install
npm run dev
```

Por padrão o Vite faz proxy de `/api/*` para `http://localhost:3000` (ver `vite.config.ts`), então basta o backend (`npm run dev` na raiz do repo) estar rodando. Não precisa configurar `VITE_API_URL` em dev.

Para apontar para uma API em outro host (ex.: produção), defina `VITE_API_URL` (ver `.env.example`).

## O que já está implementado

- Login real contra `POST /api/auth/login`, com tratamento de rate limit (429) e erros de credencial
- Sessão: token de acesso + refresh token guardados em `localStorage`, com renovação automática em respostas 401 (`src/api/client.ts`)
- Rota protegida por autenticação (`src/routes/ProtectedRoute.tsx`) — redireciona para `/login` se não autenticado
- Dashboard conectado de verdade a `GET /api/professionals`, provando o fluxo completo: login → token → chamada autenticada → render

## O que falta (próximos passos)

- Adicionar mais componentes shadcn conforme necessário: `npx shadcn add table dialog select tabs badge skeleton switch alert-dialog sonner` (o registro `ui.shadcn.com` funciona normalmente na sua máquina — só não é alcançável de dentro deste ambiente de sandbox)
- Telas de cadastro de paciente (CPF, data de nascimento, consentimento LGPD), agendamento de consultas, medicação/dispensação, e visões por papel (PATIENT/PROFESSIONAL/ADMIN) — ver `docs/design-frontend-prompt.md` na raiz do repo para o escopo funcional completo
- Guarda de rota por `role` (hoje só verifica autenticação, não papel)
- Substituir o tema neutro placeholder de `src/index.css` pelos tokens definidos no Claude Design do projeto
