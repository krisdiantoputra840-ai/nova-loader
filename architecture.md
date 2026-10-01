# Architecture — nova-loader-new

## Tech Stack

### Fullstack Runtime & Server
- **Hono** — lightweight web standard API framework
- **@hono/vite-dev-server** — unified Vite dev server middleware for Hono API routes
- **@hono/node-server** — Node.js production runtime server
- **Hono RPC Client** (`hono/client`) — end-to-end type-safe API communication

### Frontend
- **React 19** — UI library
- **TypeScript 5** — type-safe JavaScript
- **Vite 6** — build tool and development server
- **Tailwind CSS v4** — CSS-first utility styling via `@tailwindcss/vite`
- **ShadCN UI Foundation** — UI primitives (`clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`)
- **Lucide React** — iconography

### Tooling & Infrastructure
- **pnpm** — fast, disk-efficient package manager
- **Nix Flakes** — reproducible dev environment
