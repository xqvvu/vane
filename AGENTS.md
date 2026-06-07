# AGENTS.md

This file is the working contract for agents changing Vane. Keep it focused on
project workflow and engineering rules. Product scope, user stories, and
architecture decisions live in docs.

## Reference Docs

Before product or architecture work, read:

- `docs` for MVP scope, domain language,
  architecture decisions, testing expectations, and out-of-scope items.

Do not duplicate PRD content here. If a product decision changes, update the
relevant doc instead of expanding `AGENTS.md`.

## Project Shape

- `apps/app` is the TanStack Start app. It owns UI, API routes, auth, SQLite
  persistence, migrations, repositories/services, orchestration, and the
  in-process worker.
- `packages/core` owns shared schemas, domain types, route rules, delivery
  types, and shared errors.
- `packages/providers` owns inbound provider parsers and the parser registry.
- `packages/destinations` owns outbound destination senders and the sender
  registry.

Keep reusable integration code in packages. Keep app runtime concerns in
`apps/app`. Do not introduce new deployable services or default middleware
without an explicit architecture decision.

## Engineering Workflow

- Read surrounding code before changing it.
- Keep changes narrow and aligned with existing local patterns.
- Prefer schema-validated boundaries for external input, config blobs, and
  raw payloads.
- Keep route handlers thin; delegate persistence and orchestration to
  repositories or services.
- Add or update tests when behavior, schemas, migrations, routing, delivery,
  providers, or destinations change.
- Do not add new toolchain requirements for narrow changes; use the scripts
  already declared in package manifests.

## Imports

- In `apps/app`, import app source through the configured alias: `#/*`.
  Example: `import { cn } from "#/lib/utils.ts";`
- Use relative imports only for same-directory package internals, generated
  route-tree files, or colocated tests where an alias would make ownership less
  clear.
- Import workspace packages through their package names, such as `@vane/core`,
  `@vane/providers`, and `@vane/destinations`.
- Include `.ts` or `.tsx` extensions on local TypeScript imports, matching the
  current compiler settings.
- Keep server-only imports out of client components and serialized route data.

## Toolchain

Use pnpm and the existing workspace scripts.

- Runtime: Node `24.x`.
- Package manager: `pnpm@11.5.2`.
- Formatting: `pnpm --filter <package> fmt` or `fmt:check`.
- Linting: `pnpm --filter <package> lint`.
- Tests: `pnpm --filter <package> test`.
- Dev server: `pnpm --filter @vane/app dev`.

Prefer package-scoped commands while working on a focused area. Run broader
checks when touching shared packages or cross-package contracts.

## TanStack Start

- Use API routes for external webhook endpoints.
- Protect dashboard routes and server functions with auth checks.
- Keep SQLite, filesystem, secrets, and server runtime modules server-only.
- Do not expose source tokens, destination secrets, signing secrets, or raw
  secret config through loaders, client components, or serialized data.
- Use the existing UI stack in `apps/app` before adding another component
  system.

## SQLite And Migrations

- Put explicit migrations in `apps/app/src/infra/sqlite/migrations/`.
- Apply migrations through `apps/app/src/infra/sqlite/migrate.server.ts`.
- Record applied migrations in `schema_migrations`.
- Migrations move forward only. Do not edit old committed migrations.
- Use one consistent timestamp representation across tables.

## UI Direction

Vane is an operational SRE tool. Favor dense, calm, repeat-use interfaces:
tables, filters, detail pages or drawers, explicit enabled/disabled controls,
and test actions for Sources and Destinations. Avoid marketing-style layouts,
oversized hero sections, and decorative dashboards.

Use shadcn for shared UI primitives:

- Run `npx shadcn@latest add <component>` from `apps/app` when adding common
  UI components, so the CLI reads `apps/app/components.json`.
- Follow the current shadcn config: `style` is `base-lyra`, `baseColor` is
  `neutral`, `iconLibrary` is `remixicon`, menu color is `default`, and menu
  accent is `subtle`.
- Keep the visual style compact and utilitarian: small text, tight controls,
  neutral surfaces, restrained borders, and mostly square corners.
- Use the configured aliases from `components.json`, especially
  `#/components/ui` for UI primitives and `#/lib/utils` for utilities.
- Use Remix Icon components for action icons unless an existing local component
  already establishes a more specific icon convention.

## Skill Usage

Use repository skills when the request matches them:

- `tanstack-start-best-practices` for TanStack Start architecture or full-stack
  implementation questions.
- `review` for branch, PR, or work-in-progress reviews.
- `to-prd` when converting conversation context into a PRD.
- `to-issues` when breaking a plan or PRD into tracker issues.
- `grill-me` or `grill-with-docs` when stress-testing a plan or design.
- `improve-codebase-architecture` when looking for deeper refactoring or
  architecture opportunities.

Read only the relevant skill instructions before using a skill. Do not carry a
skill across turns unless the user asks for it again or the current request
still clearly depends on it.
