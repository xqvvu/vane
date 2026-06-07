# AGENTS.md

This file is the project contract for Vane. Follow it when planning,
reviewing, or changing code in this repository.

## Product Contract

Vane is an open-source, self-hosted Alert Hub for SRE and operations teams.
It receives alerts from monitoring systems, normalizes them, routes them, and
delivers them to destinations such as Feishu, Slack, email, or generic
webhooks.

Build Vane like Uptime Kuma-style self-hosted operations software:

- One deployment belongs to one team, environment, or organization.
- Prefer private deployment over SaaS assumptions.
- Prefer a single Docker image and a mounted data volume.
- Keep setup simple enough that Redis, Postgres, Kafka, Temporal, or other
  middleware are not required for the default path.
- Optimize for reliable alert intake, routing, delivery history, retry, and
  debugging.

Do not turn Vane into a general Zapier/n8n-style automation platform. Do not
start with incident management, on-call scheduling, escalation policies, or
multi-tenant SaaS architecture. Leave room for those ideas only when the core
Alert Hub is already solid.

## Domain Language

Use user-facing language that feels natural for SREs:

- Alert
- Source
- Route
- Destination
- Delivery
- Retry
- History

Use `Event` as the internal persistence concept for inbound webhooks. An
Event is one immutable inbound fact: a webhook request was received from a
Source at a specific time. Most Events represent alert state changes, but an
Event may also be a test notification, a resolved notification, a heartbeat, a
generic webhook, or another provider-specific message.

Core domain concepts:

- `Source`: an upstream system such as SigNoz, Grafana, Uptime Kuma,
  Alertmanager, or a generic webhook sender. Each Source has its own webhook
  URL and token or secret.
- `Event`: an immutable inbound webhook record. Store raw payload, normalized
  fields, provider metadata, dedupe data, and receipt metadata.
- `NormalizedEvent`: provider-independent alert fields such as `title`,
  `message`, `severity`, `status`, `fingerprint`, `labels`, and `occurredAt`.
- `Route`: a rule that matches normalized events and selects destinations.
- `Destination`: an outbound integration such as Feishu, Slack, email, or a
  generic webhook.
- `Delivery`: one outbound delivery job or attempt created from an Event and a
  Destination.

Do not add an `Incident` model until alert grouping, suppression, lifecycle
management, or incident management is explicitly in scope.

## Architecture Contract

Vane is SQLite-first and single-image-first.

- SQLite should carry persistence, delivery queue state, migrations, event
  history, and configuration for the default deployment.
- Use an in-process SQLite-backed delivery worker for the MVP.
- Webhook handlers should save inbound Events and create Delivery jobs quickly,
  then return `202 Accepted` when the Event was accepted for processing.
- Outbound delivery should happen asynchronously through the delivery worker.
- Do not introduce Redis, Postgres, an external queue, or a separate worker
  service unless a later decision explicitly changes the deployment model.
- The MVP does not need distributed queue semantics or multi-instance write
  coordination.

Keep deployable runtime simple:

- `apps/app` is the TanStack Start application.
- The app owns UI, API routes, auth, SQLite migrations, persistence,
  orchestration, and the in-process worker.
- `packages/*` contain reusable domain and integration modules.
- Avoid splitting API, frontend, and worker into separate deployables for the
  MVP.

## Package Boundaries

Use the monorepo to make integrations easy to contribute.

Recommended package shape:

- `packages/core`: shared schemas, domain types, normalized event schema,
  route rule schema, delivery types, and shared errors.
- `packages/providers`: inbound provider parsers and parser registry.
- `packages/destinations`: outbound destination senders and sender registry.
- `apps/app`: TanStack Start UI/API, SQLite persistence, auth, migrations, and
  worker orchestration.

Provider adapters should parse inbound payloads only. They may validate payload
shape, extract normalized fields, compute fingerprints or idempotency hints,
and preserve provider-specific metadata. They must not decide destinations,
perform outbound delivery, own retries, or access destination secrets.

Destination adapters should implement a shared interface with their own config
schema and send function. The app should store configuration, protect secrets,
call the adapter, and record Delivery results without hard-coding Feishu,
Slack, or other destination behavior into route handlers.

Adding a provider or destination should usually require:

- One adapter implementation.
- Fixtures based on real or representative payloads.
- Parser or sender tests.
- Registry registration.
- UI changes only when the integration needs new configuration fields.

## Routing And Rules

Keep MVP routing intentionally small and inspectable.

Supported rule concepts should start with:

- Source matches.
- Severity matches.
- Status matches.
- Label equals or contains.
- Title or message contains.
- Send to one or more destinations.

Do not introduce arbitrary JavaScript expressions, workflow graphs, delayed
steps, scheduled jobs, if/else pipelines, or general-purpose automation logic
for route rules.

Silence, suppression, maintenance windows, per-fingerprint mute, schedules, and
alert grouping are future concepts. For the MVP, prefer disabled Sources,
Routes, or Destinations and clear route conditions.

## Delivery Queue

Deliveries are asynchronous jobs persisted in SQLite.

Use states like:

- `pending`
- `running`
- `succeeded`
- `failed`

Track at least:

- Event reference.
- Destination reference.
- Attempt count.
- Next attempt time.
- Last error.
- Created, updated, and finished timestamps.

Use bounded retry with backoff. A destination outage must not make inbound
webhook intake slow or unreliable.

## Dedupe And Fingerprints

Separate alert identity from request idempotency.

- `fingerprint` means "these events belong to the same upstream alert or
  monitored object."
- `idempotencyKey` means "this webhook request appears to be the same inbound
  submission as another request."

Store inbound Events even when they are duplicates, but avoid creating duplicate
Deliveries for the same Source and idempotency key inside a short dedupe window.
Use provider-native IDs when available. Otherwise derive idempotency from
normalized fields and a raw payload hash.

Do not use fingerprint alone to suppress repeated firing notifications. Many
monitoring systems intentionally repeat firing alerts, and Vane should not
silence them by accident.

## Raw Payloads, Secrets, And Retention

Store raw webhook payloads by default because they are critical for debugging,
replay, parser fixtures, and audit history.

Raw payload handling must include:

- A maximum request and payload size.
- Redaction for common sensitive headers and fields.
- No source tokens, destination secrets, or signing secrets in logs.
- Normalized alert fields as the default UI view.
- Raw payload visible only in detail/debug views.
- Configurable retention such as 7, 30, or 90 days.

Destination secrets must stay server-side and must not be returned to the UI in
plain text. TOML export must not include secrets by default.

## Configuration

Vane supports two configuration paths:

- UI is the primary day-to-day setup surface.
- TOML is the preferred portable/config-as-code format.

Do not introduce YAML for Vane-owned configuration.

Keep Source, Route, Destination, and app settings structurally exportable to
TOML. Secret values should be entered through the UI or referenced through
environment variables, not exported as plaintext.

Example TOML shape:

```toml
[app]
base_url = "https://vane.example.com"
retention_days = 30

[[sources]]
name = "signoz-prod"
provider = "signoz"
enabled = true

[[destinations]]
name = "sre-feishu"
kind = "feishu"
enabled = true

[destinations.config]
webhook_url_env = "VANE_FEISHU_WEBHOOK_URL"

[[routes]]
name = "critical-to-feishu"
enabled = true
sources = ["signoz-prod", "grafana-prod"]
severities = ["critical"]
destinations = ["sre-feishu"]
```

## Database And Migrations

Use explicit SQLite migrations. Do not scatter schema creation through business
code.

Recommended location:

- `apps/app/src/infra/sqlite/migrations/`
- `apps/app/src/infra/sqlite/migrate.server.ts`

Migration rules:

- Record applied migrations in `schema_migrations`.
- Migrations only move forward.
- Do not edit old migrations after they are committed.
- Keep route handlers thin; access SQLite through repositories or services.
- Validate JSON payloads and config blobs with schemas at the boundary.
- Use one consistent timestamp representation across tables.

## API Surface

The stable external MVP surface is:

- Inbound webhook endpoints.
- TOML import/export format, once implemented.

Dashboard APIs may evolve with the UI and do not need to be public REST API
contracts at first. Do not create a full `/api/v1` management API unless the
project explicitly commits to maintaining that surface.

Each Source should have its own webhook URL and token or secret. Do not make all
providers share one generic unauthenticated endpoint.

Starter/demo MCP code is not part of the Vane architecture. If MCP sample files
remain in the repository, treat them as starter residue and do not build product
decisions around them.

## Authentication Model

MVP is a single workspace self-hosted app, not a SaaS tenant platform.

- Dashboard access uses Better Auth.
- Webhook intake uses Source tokens or provider secrets, not user sessions.
- The first registered user may become owner/admin.
- Complex invitation, organization, billing, tenant, and workspace systems are
  out of scope for the MVP.

Do not add tenant IDs to every table unless the project explicitly changes to a
SaaS or multi-workspace product.

## Template Safety

Do not execute user-provided JavaScript, shell, SQL, or dynamic code from route
rules or message templates.

Templates must be deterministic, sandboxed, previewable, and tested with
fixtures. Prefer a small variable interpolation language over executable
expressions.

Useful template data should come from normalized alert/event fields, such as:

- `alert.title`
- `alert.status`
- `alert.severity`
- `alert.source.name`
- `alert.labels.*`
- `event.receivedAt`
- `event.url`

## TanStack Start Practices

This project uses TanStack Start.

- Keep server-only modules marked or organized so client bundles do not import
  SQLite, filesystem, secrets, or server runtime code.
- Use API routes for external webhook endpoints.
- Validate all external inputs with schemas before persistence or adapter use.
- Keep route handlers thin and delegate domain work to services/repositories.
- Protect dashboard routes and server functions with auth checks.
- Do not expose secrets through loaders, client components, or serialized route
  data.

## UI Direction

Vane is an operational tool. The UI should be dense, calm, and built for repeat
use.

Prefer:

- Clear tables for Events, Sources, Routes, Destinations, and Deliveries.
- Fast filtering by source, severity, status, destination, and delivery state.
- Detail drawers or pages for raw payloads, delivery attempts, errors, and
  route matches.
- Test buttons for Sources and Destinations.
- Explicit enabled/disabled controls.

Avoid marketing-page layouts, oversized hero sections, decorative dashboards,
or visual noise that makes alert triage slower.

Use the existing UI stack in `apps/app` before adding another component system.

## Engineering Workflow

Before major code work:

- Read the surrounding code first.
- Preserve the architecture decisions in this file.
- Keep integration code in packages when it is reusable.
- Keep app orchestration, SQLite persistence, and UI in `apps/app`.

For validation, prefer the scripts and tools already declared in
`package.json`, workspace package manifests, and local config files. Do not add
new toolchain requirements just to validate documentation or narrow changes.
