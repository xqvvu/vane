# Vane Settings Tabbed Workspace

Targeted edit for the existing Vane Console Settings screen. Preserve the
shared 48px top navigation shell, active Settings item, Vane Console design
system, compact shadcn/base-lyra operational style, neutral light theme,
restrained typography, flat 1px bordered panels, and Remix Icon-like icon
language.

Settings should support two operator modes:

1. Routine configuration through UI controls.
2. Raw portable TOML editing/import/export.

The page must feel like dense self-hosted SRE software, not SaaS account
settings, billing, tenant administration, profile management, or incident
workflow software.

## Page Structure

1. **App Shell:** Keep the existing compact top header with Vane brand,
   horizontal navigation, active Settings nav item, initials/user menu, and no
   left sidebar.

2. **Page Header and Top Controls:** Directly below the shell content area,
   place a compact bordered workspace header with:
   - Title `Settings`
   - Small outline `Configuration` badge
   - No descriptive paragraph
   - A top control row containing the `UI` / `TOML` tab navigation aligned
     left and a small outline `Refresh` action aligned right

3. **Tabs:** The top control row uses a line-style tab bar with exactly two
   tabs:
   - `UI`
   - `TOML`

   `UI` is selected by default with a clear underline/active state. Inactive
   tabs should be quiet. Do not create a secondary sidebar or persistent right
   rail.

4. **Notice Slot:** Reserve a low-profile full-width alert slot below the
   tab/action row for failed update/import/export actions or import results
   with one-time source tokens. Keep it narrow and operational, not a large
   card.

5. **UI Tab Content:**
   - First panel: `OperationalSummary` with enabled Sources, enabled
     Destinations, enabled Routes, and raw payload retention days.
   - Below the summary, a responsive two-column grid:
     - `App Settings` panel with raw payload retention days numeric input and
       `Save settings` button.
     - `Language` panel for dashboard language preference.
   - Remove the old `Portability and Safety` facts panel entirely.
   - Keep helper copy concise.

6. **TOML Tab Content:**
   - One wide code-oriented panel titled `Portable TOML`.
   - Include a compact `TOML` badge and concise helper text.
   - Editor area should look like GitHub light CodeMirror: white/light editor
     surface, line number gutter, syntax-colored TOML sample text, wrapped
     long lines, comfortable fixed height, and no plaintext secrets.
   - Footer actions:
     - Outline `Export current config`
     - Primary `Apply import`, visually disabled when editor is empty.

7. **Responsive Behavior:** On narrow widths, keep tabs at the top, stack UI
   panels vertically, and keep the TOML editor full-width without horizontal
   page overflow.

## Product Boundaries

- Do not add profile management, password changes, OAuth provider setup,
  organizations, teams, billing, SaaS tenants, invitations, marketplaces,
  workflow graphs, arbitrary JavaScript, SQL, shell execution, silences,
  maintenance windows, on-call schedules, incident management, or worker tuning.
- Do not expose source tokens except one-time generated tokens in the import
  result notice.
- Do not expose token hashes, provider signing secrets, destination webhook
  URLs, signing secrets, access tokens, passwords, private keys, raw secret
  config, raw sensitive payloads, Better Auth secrets, session tokens, or
  password hashes.
- Export omits plaintext secrets by default. Do not add a `Secrets omitted`
  toggle unless the backend supports plaintext secret export.

## Implementation Mapping Notes

- Map the design to existing React feature modules:
  `SettingsPage`, `OperationalSummary`, `AppSettingsForm`,
  `LanguageSettingsPanel`, `PortableConfigForm`, and `ImportNoticePanel`.
- The TOML editor maps to a CodeMirror integration, not a plain textarea.
- Use existing shadcn primitives such as `Tabs`, `Button`, `Alert`, `Badge`,
  `Field`, `Input`, `Separator`, and compact bordered panels.
- Keep TanStack Form as the raw retention form behavior owner.
- Keep server state TanStack Query-backed through existing configuration query
  options and configuration mutations.
