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
target repositories without its own ownership marker. A theme overlay requires
`Shell.astro`, `Home.astro`, `Article.astro`, and `theme.css` under `src/theme/`.
It may also override the shared fallback `ArticleCard.astro` at the same path.
It does not duplicate Astro, routes, feeds, or translations.

## Generated input

Core owns two paths in the target site:

- `src/data/site-config.generated.json` contains validated site identity,
  interface locale, output languages, default content language, display
  choices, disclosure text, and optional commercial links.
- `src/content/articles/<language>/<slug>.md` contains validated article
  frontmatter and Markdown body content.

Shared runtime code and theme overlays must treat both paths as generated input.
Do not ask users to edit them directly. `shared/` may include sample articles for
local development; Core removes those samples when it bootstraps a target site.

`SiteConfig.presentation` is a reader-first, versioned optional section. A
missing section or Core's historical empty object is equivalent to disabled
advertising. Version 1 accepts only the following closed union:

```json
{
  "presentation": {
    "schemaVersion": 1,
    "ads": {
      "provider": "adsense",
      "publisherId": "ca-pub-1234567890123456",
      "slots": {
        "homeAfterFeed": "1001",
        "archiveInline": "1002",
        "articleEnd": "1003"
      }
    }
  }
}
```

The alternative is `{ "provider": "none" }`. AdSense publisher IDs must be
`ca-pub-` followed by 16 digits, slot IDs contain 1 to 20 digits, and an AdSense
configuration enables at least one of the three named placements. Omitted slot
keys disable only that placement. Unknown versions, providers, fields, and
placement names fail the build. Themes do not accept arbitrary script URLs.

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
accessibility, metadata, feeds, archive, topic, search, sources, about, error
and machine-readable routes, visual overlays, static build, and deployment.
Each overlay defines its colors, content width, and component geometry directly
in `theme.css`; generated site configuration cannot override those styles.

The selected interface locale controls navigation, headings, buttons, empty
states, source and disclosure labels, accessibility copy, localized defaults,
and footer copy. Output languages control content routes. The default content
language is listed at `/`; every additional language receives its own
`/<language>/` index. Article routes remain language-scoped, so languages are
never mixed in a single listing.

Every composed site provides the same reader-facing route capabilities: a latest
index, article pages, paginated archives, topic indexes and topic pages, a
language-scoped source directory, static multilingual search, an about page, a
404 page, RSS, sitemap output, and `robots.txt`. The homepage receives the latest
twelve articles plus the language-scoped article and source totals before that
limit is applied; the archive owns complete historical browsing. Visual overlays
may change how these routes look, but must not remove or rename them.

The shared document layout assigns schema.org types by page family, emits
canonical and language-alternate links, and gives every indexable page Open
Graph and Twitter image metadata with the Publume logo as the automatic
fallback. Search pages are `noindex,follow`; search and 404 output is excluded
from sitemaps. Generic generated articles use `Article`, not `NewsArticle`,
unless a future validated content contract supplies a more specific kind.

Canonical URLs, language alternates, RSS output, sitemap output, and the logo
social-image fallback require `SiteConfig.url`. When it is absent, the build
omits those absolute-URL features instead of publishing placeholder origins. An
explicit absolute `socialImageUrl` remains valid without a site URL.

When AdSense is disabled, rendered pages contain no advertising DOM or scripts.
When enabled, the shared head emits the fixed Google provider script once on
each page that contains a configured slot, shared slots render only at named
placements, and `/ads.txt` exposes the validated publisher record. Pages
without a slot keep zero provider code. Theme overlays cannot add another
advertising provider or script source.

Themes must not require Core credentials at build time. They must not fetch AI
output, mutate source content, or run a persistent backend.

## Typography and bundled fonts

`shared/src/styles/typography.css` is the only typography authority. It defines
the interface, reading, display, and monospace families together with semantic
caption, metadata, body, lead, title, section, page, and display roles. Theme
overlays may choose those roles, but must not introduce raw font sizes, numeric
weights, line heights, tracking values, system font stacks, or a theme-specific
title-size setting.

The scale is language-aware instead of applying one display formula to every
script. Interface text starts at `14/22px`; reading text stays at `17/28px` for
Latin and `17/30px` for CJK; Editorial display text uses separate fluid ranges
for Latin and CJK, with CJK headings receiving looser line height and zero
tracking. These are Publume product tokens, not a claim that one universal Web
pixel standard exists. They are informed by the [W3C Chinese Layout
Requirements](https://www.w3.org/TR/clreq/), the distinction between productive
and expressive typography in [Carbon](https://carbondesignsystem.com/elements/typography/style-strategies/),
and application-scale guidance from [Ant Design](https://ant.design/docs/spec/font/).

The document declares the content language, and interface fragments embedded
in content of another language declare their own `lang`. This is required for
font and glyph selection, line breaking, and assistive technology; see the
[W3C language declaration guidance](https://www.w3.org/International/questions/qa-html-language-declarations.html).
CJK stacks place the generic Noto family before the regional fallback as shown
in the [official Noto Web guidance](https://notofonts.github.io/noto-docs/website/use/).
Continuous CJK text uses normal word breaking and strict line breaking;
`overflow-wrap: anywhere` is reserved for URLs and other unbreakable data.
Content titles inside an `article` use the complete width of their assigned
layout track instead of a separate character-count measure. The final shared
layer clears overlay `max-width` caps, replaces balanced title wrapping with
natural pretty wrapping, and only breaks a word when it would otherwise
overflow.

Publume self-hosts Noto variable fonts under the SIL Open Font License 1.1. The
build generates `src/styles/fonts.generated.css` from the configured interface
and output languages, so a site includes the base Latin families plus only the
script-specific packs it needs. No page requests fonts from Google Fonts or
another remote font CDN. Notices and the complete license live in
`THIRD_PARTY_NOTICES.md` and `public/licenses/OFL-1.1.txt`.
