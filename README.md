# ADR Cascade

A simple web app for creating and managing **Architecture Decision Records (ADRs)**.

Group decisions by project, auto-number them, edit in a rich markdown editor with live preview, and track status (Proposed → Accepted → Deprecated / Superseded).

## Features

- **Projects** — one workspace per system or codebase
- **Auto scaffolding** — number, date, status, scope and section template generated when you name a decision
- **Markdown editor** — formatting toolbar, keyboard shortcuts, split live preview
- **Sorting** — by number, title, date, status or last edit
- **Lifecycle status** — Proposed, Accepted, Deprecated, Superseded (updates the file header)
- **Email sign-in** — passwordless OTP via Convex Auth

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4, shadcn/ui |
| Animation | Framer Motion |
| Backend / DB | [Convex](https://convex.dev) |
| Auth | Convex Auth (email OTP) |

## Getting started

### Prerequisites

- Node.js 20+ (or Bun)
- A [Convex](https://convex.dev) account

### Install

```bash
npm install
# or: bun install
```

### Environment

Copy the example env and fill in your Convex values:

```bash
cp .env.example .env.local
```

```env
VITE_CONVEX_URL=          # from `npx convex dev`
CONVEX_DEPLOYMENT=        # from `npx convex dev`
CONVEX_SITE_URL=http://localhost:5173
```

### Run locally

```bash
# terminal 1 — Convex backend
npx convex dev

# terminal 2 — frontend
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/     # shared UI (header, editor, auth guard, …)
  components/ui/  # shadcn primitives
  convex/         # schema, queries, mutations, auth
  hooks/          # useAuth, useMobile
  lib/            # ADR helpers, markdown rendering
  pages/          # Landing, Auth, Dashboard, Adrs, AdrEditor, Settings
```

## License

MIT
