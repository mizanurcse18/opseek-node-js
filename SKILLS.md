# opseek-node-js — Project Skills

> Monorepo for the Opseek Node.js application and future .NET services.
> This file is a project-specific reference loaded when working on this repo.

---

## Repository Structure

```
D:\SourceCode\Opseek\source\node-js\
├── .gitignore
├── README.md
├── SKILLS.md                    ← this file
├── memory.md
└── admin-vite-to-modrnize-theme/   ← React 19 admin panel
    ├── src/
    │   ├── app/router/
    │   ├── components/
    │   │   ├── ui/              ← shadcn/radix-style components
    │   │   └── ui-old/          ← legacy component wrappers (Select, etc.)
    │   ├── constants/           ← api.ts, routes.ts
    │   ├── features/            ← feature modules
    │   ├── layouts/
    │   └── lib/
    ├── package.json
    └── vite.config.ts
```

## Git Remote

- **URL:** `https://github.com/mizanurcse18/opseek-node-js.git`
- **Branch:** `master`
- **Monorepo root:** `D:\SourceCode\Opseek\source\node-js\`
- **Last commit:** `2539e66` — 374 files

## Source Project (PayStation Admin Vite)

- **Path:** `D:\SourceCode\paystation\microservices\ui\admin-vite`
- **Stack:** React 18 + Vite + TypeScript + Tailwind
- **This is the SOURCE** for features being ported to the modernized target

## Sync Status with PayStation Admin Vite

The modernized target (`admin-vite-to-modrnize-theme`) is a different template with:
- AccordionMenu sidebar (280px/80px hover-expand, Ctrl+K) vs custom recursive sidebar (260px/80px, Ctrl+/)
- CSS Grid AdminLayout vs flex AdminLayout
- shadcn/radix-ui components vs custom components
- **DO NOT** sync sidebar, header, footer, login CSS, or logo between the two

### Completed Ports

| Domain | Status | Files | Config Patches |
|--------|--------|-------|----------------|
| **SCM** — Category, Product, PR, PQ, Supplier | ✅ Done | 22 feature files, 5 lib services | api.ts (+11 groups), routes.ts (+9), router (+10 routes) |
| **Support/Mail** — Config, Group, Log, Unified | ✅ Done | 19 feature files, HtmlEditor, mail.service.ts | api.ts (+MAIL module + 4 groups), routes.ts (+8), router (+8 routes) |

### Remaining

- **Request Log Monitor** — routes.ts has entries, router needs adding
- **Finance pages** — api.ts has endpoint groups, features not yet ported

### Known Import Fixes (applied during porting)

| Issue | Fix |
|-------|-----|
| `@/components/ui/Select` (old API: options/value/onChange) | Redirect to `@/components/ui-old/Select` |
| `HtmlEditor.tsx` missing in target | Copied from source `components/ui/HtmlEditor.tsx` |
| `Textarea.tsx` (PascalCase) vs `textarea.tsx` (kebab) | Copied PascalCase file to preserve imports |

### Sidebar

Fully dynamic — builds navigation from Redux `auth.permissions[]` loaded at login. No sidebar code changes needed for new features.

---

## Future .NET Services

This monorepo root will also host .NET microservices and backend projects alongside the React app.
