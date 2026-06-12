# Vane Settings and Portability Page

Design the Settings page for Vane, a self-hosted Alert Hub console used by SREs
to manage app-level retention and portable TOML configuration. Settings are for
bounded storage, config-as-code backup/restore, and secret-safe import/export;
they are not account management, billing, SaaS tenancy, or workflow automation.

**PLATFORM:** Web, desktop-first, responsive down to narrow dashboard widths.

**PAGE STRUCTURE:**

1. **App Shell:** Preserve the Vane console shell pattern from Events,
   Deliveries, Sources, Routes, and Destinations: compact top navigation, active
   Settings item, dense work area, calm operational styling, and no global
   "Create Alert" action.

2. **Page Toolbar:** A compact bordered toolbar above the settings surfaces with:
   - Title "Settings"
   - Short description about raw payload retention, TOML portability, and
     secret-safe configuration transfer
   - Secondary utility action "Refresh"
   Avoid marketing copy and avoid profile settings, tenant switching,
   organization billing, invites, marketplace browsing, incident lifecycle, or
   on-call scheduling.

3. **Main Operational Summary:** A dense primary panel that summarizes current
   configuration health:
   - Enabled Sources with total count
   - Enabled Destinations with total count
   - Enabled Routes with total count
   - Raw payload retention value in days
   Include short helper copy that raw payload retention bounds SQLite storage
   while ordinary UI displays redacted payloads.

4. **Portability and Safety Panel:** A compact information panel below the
   summary explaining the current portability rules:
   - TOML is the Vane-owned portable config format
   - Exports omit plaintext secrets by default
   - Secret references can be resolved from environment variables during import
   - Imported Sources may create one-time source tokens that must be copied
   Keep this panel factual and implementation-bound; do not claim a specific
   encryption algorithm.

5. **Notice Area:** Compact alert panels above the summary when present:
   - Error notice for failed update/import/export actions
   - Import result notice with generated source tokens when an import creates
     new Sources
   The import notice should show webhook path, copyable webhook URL, and the
   one-time source token. Make the one-time nature visually clear without
   exposing token hashes or provider signing secrets.

6. **Right Rail App Settings Form:** A persistent right rail form for:
   - Raw payload retention days, numeric input, allowed range 0 to 3650
   - Save settings button
   Include concise field description explaining that retention controls raw
   webhook payload storage, not normalized Events or Delivery history.

7. **Right Rail Portable Config Form:** A second right rail form for TOML:
   - Monospace textarea for TOML
   - Export button
   - Import button disabled when TOML is empty
   - Helper copy: export omits plaintext secrets by default; imports validate
     structure before changing stored configuration
   Keep the TOML area compact but reviewable.

**PRODUCT BOUNDARIES:**

- Do not expose source tokens except one-time generated tokens in the import
  result notice.
- Do not expose token hashes, provider signing secrets, destination webhook
  URLs, signing secrets, access tokens, passwords, private keys, raw secret
  config, raw sensitive payloads, Better Auth secrets, session tokens, or
  password hashes.
- Do not add profile management, password changes, OAuth provider setup,
  organizations, teams, billing, SaaS tenants, invitations, marketplaces,
  workflow graphs, arbitrary JavaScript, SQL, shell execution, silences,
  maintenance windows, on-call schedules, or incident management.
- Keep Settings focused on retention, TOML import/export, configuration
  summary, and secret-safe portability.

**IMPLEMENTATION MAPPING NOTES:**

- Map the design to existing React feature modules:
  `SettingsPage`, `OperationalSummary`, `AppSettingsForm`,
  `PortableConfigForm`, and `ImportNoticePanel`.
- Use existing shadcn primitives such as Button, Alert, Badge, Field, Input,
  Textarea, Separator, Empty, and compact bordered panels.
- Keep TanStack Form as the raw retention form behavior owner and shadcn Field
  primitives as presentation.
- Keep server state TanStack Query-backed through existing configuration query
  options and configuration mutations.
