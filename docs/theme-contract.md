# Theme contract

Publume Core bootstraps a target site by copying one directory from
`themes/<theme-id>` into an empty Git repository. The copied directory must be a
complete, independently buildable static site.

## Versioned marker

Each theme root must contain `.publume-theme.json`:

```json
{
  "schemaVersion": 1,
  "id": "editorial"
}
```

Core rejects unknown schema versions, mismatched identifiers, and non-empty
target repositories without its own ownership marker.

## Generated input

Core owns two paths in the target site:

- `src/data/site-config.generated.json` contains validated site identity,
  presentation tokens, disclosure text, and optional commercial links.
- `src/content/articles/<language>/<slug>.md` contains validated article
  frontmatter and Markdown body content.

Theme source code must treat both paths as generated input. Do not ask users to
edit them directly. A theme may include sample articles for local development;
Core removes those samples when it bootstraps a target site.

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
configuration, content identity, and Git publication. A theme owns rendering,
navigation, accessibility, metadata, feeds, visual design, static build, and
site deployment.

Themes must not require Core credentials at build time. They must not fetch AI
output, mutate source content, or run a persistent backend.
