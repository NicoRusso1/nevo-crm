# neVo — Frontend

React + TypeScript + Vite + TailwindCSS. Dark SaaS shell inspired by Stripe and Linear.

## Getting started

```bash
npm install
npm run dev
# → http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the backend at `http://localhost:4000`, so any future fetch calls can use relative URLs.

## Project layout

```
src/
├── main.tsx            # entry — renders <App />
├── App.tsx             # mounts the router
├── index.css           # Tailwind base + global tweaks (scrollbar, focus ring)
├── lib/
│   ├── cn.ts           # clsx + tailwind-merge helper
│   └── nav.ts          # sidebar navigation config
├── components/
│   ├── ui/             # Button, Card, Input, Avatar, Badge — base primitives
│   └── layout/         # AppLayout, Sidebar, Topbar, PageHeader
├── pages/
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── TasksPage.tsx
│   └── SettingsPage.tsx
└── routes/
    └── index.tsx       # react-router config
```

## Design system

Tokens live in `tailwind.config.ts`:

| Token                   | Value                          | Use                       |
| ----------------------- | ------------------------------ | ------------------------- |
| `bg-background`         | `#0B0F19`                      | page background           |
| `bg-surface`            | `#0F1420`                      | sidebar, cards            |
| `bg-surface-elevated`   | `#141A2A`                      | inputs, hover, popups     |
| `bg-surface-hover`      | `#1A2236`                      | hover-on-elevated         |
| `text-foreground`       | `#FAFAFA`                      | primary text              |
| `text-muted`            | `#9CA3AF`                      | secondary text            |
| `text-muted-foreground` | `#6B7280`                      | helper / placeholder text |
| `border-line`           | `rgba(255,255,255,0.06)`       | dividers, card outlines   |
| `border-line-strong`    | `rgba(255,255,255,0.10)`       | hover dividers, keyboard  |
| `bg-accent`             | `#5B6CFF`                      | primary brand accent      |
| `bg-accent-muted`       | `rgba(91,108,255,0.12)`        | active nav, chips         |

Typography is **Inter** (loaded from Google Fonts in `index.html`), with tighter letter-spacing on display sizes for the Linear feel.

## Scripts

| Script               | Purpose                          |
| -------------------- | -------------------------------- |
| `npm run dev`        | Vite dev server on :5173         |
| `npm run build`      | Type-check + production build    |
| `npm run preview`    | Preview the production build     |
| `npm run typecheck`  | Type-check without emitting      |
