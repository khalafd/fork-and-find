# Fork & Find — Restaurant Discovery

A curated restaurant discovery platform powered by a hand-crafted PostgreSQL database and an AI dining advisor. Designed to feel like a private dining concierge — sophisticated, honest about evidence levels, and beautifully designed. Data is clearly labeled as curated, not live Google/Tripadvisor data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY` — Replit AI integration

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (port 8080, proxied to `/api`)
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter
- Map: Leaflet + react-leaflet (OpenStreetMap, free)
- AI Chatbot: Replit AI integration (OpenAI-compatible, model: gpt-5.2), SSE streaming
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/db/src/schema/` — DB schemas (restaurants.ts, dishes.ts, admin_settings.ts, conversations.ts, messages.ts)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/restaurant-app/src/pages/` — discovery.tsx (main view), admin.tsx (admin dashboard)
- `artifacts/restaurant-app/src/components/` — map/, chat/, restaurant/, admin/, layout/, ui/
- `lib/api-client-react/` — generated TanStack Query hooks (from Orval)
- `lib/api-zod/` — generated Zod schemas (from Orval)
- `lib/integrations-openai-ai-server/` — OpenAI client for server-side

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React hooks + Zod validators
- AI chatbot uses raw fetch + SSE streaming (NOT the generated hook, which doesn't support streaming)
- Shortlist is in-memory (keyed by session IP or X-Session-Id header) — fine for MVP
- Admin settings (system prompt, chatbot name) stored in DB, seeded with defaults on first GET
- Leaflet icon bug fixed in map component by manually merging icon options
- All data labeled "curated database — not live data" throughout UI as a trust signal

## Product

- `/` — Map discovery view (60% map + 40% AI chat). Restaurant pins on Leaflet/OSM map. Click a pin to see detail panel with dishes, evidence levels, strengths/weaknesses, links.
- `/admin` — Admin dashboard: restaurant/dish CRUD, AI system prompt editor, CSV bulk upload, stats

## User preferences

- No emojis anywhere in the UI
- Data transparency is a core value — always label "curated database, not live"
- Evidence levels (strong/moderate/weak) must be visible throughout
- Chatbot must never hallucinate menu items

## Gotchas

- `react-leaflet@4.2.1` has peer dep warnings with React 19 — works fine in practice
- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Never use `!important` inside Tailwind `@apply` rules (Tailwind v4 doesn't support it)
- AI streaming endpoint uses SSE — use `response.body.getReader()` on the client, not the generated hook

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
