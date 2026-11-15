# SchoolHub Frontend

Integrated frontend workspace for the SchoolHub ERP platform — three React portals (Parent, Admin, Management) wired to the backend microservices in local development.

## What's in this repo

| Path | Description |
|------|-------------|
| `school-hub-frontend/admin/` | Admin portal (port 5174) — fully integrated with backend |
| `school-hub-frontend/webapp/` | Parent portal (port 5173) — UI complete, mock data |
| `school-hub-frontend/management/` | Management portal (port 5175) — UI complete, API-ready empty states |
| `AI-CONTEXT.md` | Master platform context — read this first |
| `cursor-context.md` | Session log + verification checklist |
| `backend-changed.md` | Log of approved backend modifications (for reference) |
| `data/` | Demo CSVs for bulk upload testing |
| `schema.sql` | MySQL DDL derived from the official schema PDF |

## Quick start

```bash
# Admin portal (primary integrated portal)
cd school-hub-frontend/admin && npm install && npm run dev
# → http://localhost:5174

# Parent portal
cd school-hub-frontend/webapp && npm install && npm run dev
# → http://localhost:5173

# Management portal
cd school-hub-frontend/management && npm install && npm run dev
# → http://localhost:5175
```

Backend services (`student-info-service`, `payment-service`, `transport-service`, `notification-service`) run separately on ports 8091–8094. See `AI-CONTEXT.md` for full setup.

## Docs for AI agents

1. Read `AI-CONTEXT.md` — architecture, services, integration roadmap
2. Read `cursor-context.md` — what was built, what to verify
3. Read `backend-changed.md` before touching any backend repo
