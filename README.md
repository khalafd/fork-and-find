# Fork & Find — Restaurant Discovery

A curated restaurant discovery platform with an AI dining advisor. Designed to feel like a private dining concierge — sophisticated, honest about evidence levels, and beautifully crafted. Data is explicitly labelled as curated, not live Google/Tripadvisor data.

**Live features:**
- Interactive Leaflet/OpenStreetMap map with restaurant pins
- Click any pin to see a full detail panel: dishes, evidence levels, strengths/weaknesses, links
- AI chatbot (GPT-5.2 via Replit AI integration) with SSE streaming — receives restaurant context automatically
- Admin dashboard: restaurant/dish CRUD, AI system prompt editor, CSV bulk import
- Shortlist system (add/remove restaurants across sessions)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind v4 + shadcn/ui + wouter |
| Map | Leaflet + react-leaflet (OpenStreetMap, no paid API) |
| AI Chatbot | Replit AI Integration (OpenAI-compatible, gpt-5.2) |
| Backend | Express 5 (Node.js 24, TypeScript) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API contract | OpenAPI spec → Orval codegen (React Query hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
artifacts/
  api-server/       # Express 5 API server (port 8080, proxied to /api)
    src/
      routes/       # restaurants.ts, dishes.ts, shortlist.ts, admin.ts, openai.ts
  restaurant-app/   # React + Vite frontend (proxied to /)
    src/
      pages/        # discovery.tsx (map + chat), admin.tsx (dashboard)
      components/
        map/        # RestaurantMap (Leaflet)
        chat/       # ChatPanel (SSE streaming AI)
        restaurant/ # RestaurantDetailPanel (slide-in detail)
        admin/      # RestaurantList, DishManagement, CSVBulkUpload, SystemPromptEditor
        layout/     # Navbar

lib/
  api-spec/
    openapi.yaml    # OpenAPI spec — source of truth for all API contracts
  api-client-react/ # Generated: TanStack Query hooks (via Orval)
  api-zod/          # Generated: Zod schemas (via Orval)
  db/
    src/schema/     # Drizzle schemas: restaurants, dishes, admin_settings, conversations, messages
  integrations-openai-ai-server/  # Replit AI OpenAI client (server-side)
  integrations-openai-ai-react/   # Replit AI client (client-side, if needed)

scripts/            # Utility scripts
```

---

## Setup & Run (Local / New Environment)

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/fork-and-find.git
cd fork-and-find
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root (never commit this):

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/forkfind

# Replit AI integration (only needed on Replit — use your own OpenAI key otherwise)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...

# Session secret for Express
SESSION_SECRET=your-random-secret-here
```

> **Note:** On Replit, `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` are provisioned automatically by the Replit AI integration — no manual setup needed.

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 5. Run in development

In two separate terminals (or use Replit workflows):

```bash
# Terminal 1 — API server
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/restaurant-app run dev
```

The API server runs on port `8080` (proxied to `/api`).  
The frontend runs on port `19460` (proxied to `/`).

---

## Useful Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build the API server
pnpm --filter @workspace/api-server run build

# Push DB schema changes (dev only — never run on production)
pnpm --filter @workspace/db run push
```

---

## API Overview

All routes are under `/api`. Key endpoints:

| Method | Path | Description |
|---|---|---|
| GET | `/api/restaurants` | List all restaurants (supports `?search=`, `?city=`, `?cuisine=`, `?evidenceLevel=`) |
| GET | `/api/restaurants/:id` | Get restaurant + its dishes |
| GET | `/api/restaurants/featured` | Get featured restaurants |
| GET | `/api/restaurants/cities` | List distinct cities |
| GET | `/api/restaurants/cuisines` | List distinct cuisines |
| POST | `/api/restaurants` | Create restaurant |
| PUT | `/api/restaurants/:id` | Update restaurant |
| DELETE | `/api/restaurants/:id` | Delete restaurant |
| GET | `/api/restaurants/:id/dishes` | List dishes for a restaurant |
| POST | `/api/restaurants/:id/dishes` | Add dish |
| PUT | `/api/dishes/:id` | Update dish |
| DELETE | `/api/dishes/:id` | Delete dish |
| GET | `/api/shortlist` | Get shortlisted restaurants (session-based) |
| POST | `/api/shortlist/:restaurantId` | Add to shortlist |
| DELETE | `/api/shortlist/:restaurantId` | Remove from shortlist |
| GET | `/api/admin/settings` | Get AI chatbot settings |
| PUT | `/api/admin/settings` | Update system prompt / chatbot name |
| POST | `/api/admin/bulk-upload` | Bulk upload restaurants via JSON rows |
| GET | `/api/admin/stats` | Get stats (totals, top cuisines, top cities) |
| POST | `/api/openai/conversations` | Create AI conversation |
| POST | `/api/openai/conversations/:id/messages` | Send message (SSE streaming) |

Full OpenAPI spec: [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml)

---

## For Developers / AI Agents Reviewing This Code

**Start here:**
1. [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml) — the entire API contract
2. [`lib/db/src/schema/`](lib/db/src/schema/) — database structure (Drizzle ORM)
3. [`artifacts/api-server/src/routes/`](artifacts/api-server/src/routes/) — all backend logic
4. [`artifacts/restaurant-app/src/pages/`](artifacts/restaurant-app/src/pages/) — frontend entry points

**Architecture decisions worth knowing:**
- The API is contract-first. Always edit `openapi.yaml` first, then run `codegen` to regenerate hooks.
- The AI chatbot uses raw `fetch` with SSE on the client (not the generated hook) — see `ChatPanel.tsx`.
- Shortlist is in-memory on the server (keyed by `X-Session-Id` header or IP). It resets on server restart. A production version would store it in DB per user.
- Evidence levels (`strong` / `moderate` / `weak`) are a core data trust signal throughout the app.

---

## Data Model

### Restaurant fields
`name`, `city`, `district`, `cuisine`, `latitude`, `longitude`, `googleMapsUrl`, `instagramUrl`, `websiteUrl`, `menuSourceUrl`, `ratingSourceNotes`, `openingHoursNotes`, `reviewConsensusSummary`, `evidenceLevel`, `bestFor`, `strengths`, `weaknesses`, `isFeatured`

### Dish fields
`restaurantId`, `name`, `category` (starter/salad/sushi-raw/main/dessert), `rawOrCooked`, `description`, `evidenceType`, `evidenceLevel`, `recommendationScore` (1–10), `dietTags` (comma-separated)

---

## License

MIT
