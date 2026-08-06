# Theme contract

Publume Core bootstraps a target site by composing `shared/` with one visual
overlay from `themes/<theme-id>`. The result is a complete, independently
buildable static site. This is the only supported version 1 shape; the repository
does not carry a compatibility path for the former duplicated-site layout.

## Versioned marker

Each theme root must contain `.publume-theme.json`:

```json
{
  "schemaVersion": 1,
  "id": "editorial"
}
```

Core rejects unknown schema versions, mismatched identifiers, and non-empty
target repositories without its own ownership marker. A theme overlay contains
only `Shell.astro`, `Home.astro`, `Article.astro`, and `theme.css` under
`src/theme/`; it does not duplicate Astro, routes, feeds, or translations.

## Generated input

Core owns two paths in the target site:

- `src/data/site-config.generated.json` contains validated site identity,
  presentation tokens, interface locale, output languages, default content
  language, disclosure text, and optional commercial links.
- `src/content/articles/<language>/<slug>.md` contains validated article
  frontmatter and Markdown body content.

Shared runtime code and theme overlays must treat both paths as generated input.
Do not ask users to edit them directly. `shared/` may include sample articles for
local development; Core removes those samples when it bootstraps a target site.

The version 1 article frontmatter contract is:

```yaml
decisionKey: "stable-decision-identity"
language: "en"
title: "Article title"
summary: "Article summary"
publishedAt: "2026-01-01T00:00:00.000Z"
score: 0.92
topics:
  - "example"
sourceUrls:
  - "https://source.example/article"
```

`score` and `topics` are optional. All other fields are required. Article bodies
are Markdown without raw HTML.

## Build and deployment

Core runs these commands from the copied theme root:

```bash
bun install --frozen-lockfile
bun run build
```

The build must write deployable static output to `dist/`. The target repository
runs `.github/workflows/pages.yml` after Core pushes a commit. The workflow must
always build from source, deploy `dist/` from public repositories to GitHub
Pages, and skip Pages configuration and deployment for private repositories.

## Ownership boundaries

Core owns collection, filtering, AI gating, article generation, generated
configuration, content identity, and Git publication. Themes owns the shared
rendering runtime, the single interface translation catalog, navigation,
accessibility, metadata, feeds, visual overlays, static build, and deployment.

The selected interface locale controls navigation, headings, buttons, empty
states, source and disclosure labels, accessibility copy, localized defaults,
and footer copy. Output languages control content routes. The default content
language is listed at `/`; every additional language receives its own
`/<language>/` index. Article routes remain language-scoped, so languages are
never mixed in a single listing.

Themes must not require Core credentials at build time. They must not fetch AI
output, mutate source content, or run a persistent backend.

## Typography and bundled fonts

`shared/src/styles/typography.css` is the only typography authority. It defines
the interface, reading, display, and monospace families together with semantic
caption, metadata, body, lead, title, section, page, and display roles. Theme
overlays may choose those roles, but must not introduce raw font sizes, numeric
weights, line heights, tracking values, system font stacks, or a theme-specific
title-size setting.

Publume self-hosts Noto variable fonts under the SIL Open Font License 1.1. The
build generates `src/styles/fonts.generated.css` from the configured interface
and output languages, so a site includes the base Latin families plus only the
script-specific packs it needs. No page requests fonts from Google Fonts or
another remote font CDN. Notices and the complete license live in
`THIRD_PARTY_NOTICES.md` and `public/licenses/OFL-1.1.txt`.
