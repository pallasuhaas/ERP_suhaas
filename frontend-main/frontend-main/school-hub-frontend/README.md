# school-hub-frontend

Standalone React 18 + Vite frontend monorepo for the SchoolHub ERP Platform.
No dependency on any backend repo — all data is currently mock.

## Portals

| Folder | Portal | Dev Port |
|--------|--------|----------|
| `webapp/` | Parent Portal (mobile-first) | 5173 |
| `admin/` | Admin Portal (desktop) | 5174 |
| `management/` | Management Portal (desktop, read-only analytics) | 5175 |

## Running

```bash
cd webapp      && npm install && npm run dev   # http://localhost:5173
cd admin       && npm install && npm run dev   # http://localhost:5174
cd management  && npm install && npm run dev   # http://localhost:5175
```

## Notes
- All data is hardcoded mock data. Backend integration is a separate phase.
- See AI-CONTEXT.md in the platform workspace for full integration roadmap.
