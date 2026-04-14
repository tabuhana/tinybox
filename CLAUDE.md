@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: verify Next.js APIs before writing code

This repo uses **Next.js 16.2.3** with **React 19.2.4**. Your training data predates both. Before writing or modifying any Next.js code (routing, data fetching, `use*` hooks, metadata, config, caching, server actions), consult the local docs in `node_modules/next/dist/docs/` — specifically `01-app/` for the App Router. The in-tree docs are authoritative; heed deprecation notices.

React Compiler is enabled (`next.config.ts` → `reactCompiler: true`, `babel-plugin-react-compiler` in devDeps). Do not add manual `useMemo`/`useCallback`/`memo` as a reflex — the compiler handles memoization. Only reach for them when profiling shows a specific need.

## Commands

Package manager is **bun** (see `bun.lock`).

- `bun dev` — start the dev server (http://localhost:3000)
- `bun run build` — production build
- `bun start` — run the built app
- `bun run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured.

## Architecture

- **App Router only** — source lives in `src/app/` (`layout.tsx`, `page.tsx`, `globals.css`). No `pages/` directory.
- **Path alias**: `@/*` → `./src/*` (see `tsconfig.json`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` (`postcss.config.mjs`). Tailwind v4 uses CSS-first configuration in `globals.css` (`@import "tailwindcss"`), not a `tailwind.config.js`.
- **TypeScript**: strict mode, `moduleResolution: "bundler"`, JSX via `react-jsx`.
