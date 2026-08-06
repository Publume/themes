# Publume Themes

[![CI](https://github.com/Publume/themes/actions/workflows/ci.yml/badge.svg)](https://github.com/Publume/themes/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Publume Themes combines one multilingual Astro runtime with lightweight visual
overlays for [Publume Core](https://github.com/Publume/core). Core composes the
shared runtime and the selected overlay into a standalone Website repository.

> **Project status:** Publume Themes is pre-1.0. Theme and generated-content
> contracts may change before the first stable release.

## Available themes

| Theme | Purpose | Runtime JavaScript |
| --- | --- | --- |
| [`editorial`](themes/editorial) | Fast, readable publication for news and analysis | None |
| [`journal`](themes/journal) | Warm, typography-led magazine for long-form reading | None |
| [`briefing`](themes/briefing) | High-density intelligence feed for rapid scanning | None |

## Contract

Contract 1 has two deliberately separate parts:

- `shared/` owns Astro, routes, language separation, the single interface
  translation catalog, accessible semantic typography, self-hosted Noto fonts,
  SEO, feeds, and GitHub Pages deployment;
- `themes/<theme-id>/` owns only `Shell.astro`, `Home.astro`, `Article.astro`,
  `theme.css`, and the schema-version-1 marker.

The composed site builds with `bun install --frozen-lockfile` and `bun run
build`, reads generated settings from `src/data/site-config.generated.json`, and
reads generated Markdown from `src/content/articles/`. Themes never receive Core
credentials and require no persistent server.

At build time, the shared runtime bundles only the Noto script packs required by
the configured interface and output languages. Every overlay uses the same
semantic type scale; visual themes cannot silently replace it with oversized
headings or platform-dependent system fonts.

The complete contract is documented in [Theme contract](docs/theme-contract.md).

## Development

```bash
git clone https://github.com/Publume/themes.git
cd themes
bun install --frozen-lockfile
bun run check
```

Preview any theme with:

```bash
bun run dev:theme editorial
bun run dev:theme journal
bun run dev:theme briefing
```

Repository-wide checks validate the theme marker and required files, then run
every theme's own Astro checks and production build. CI also runs Publume Core's
acceptance flow against each real theme.

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security
issues must follow [SECURITY.md](SECURITY.md), not the public issue tracker.

## License

Publume Themes is licensed under the [Apache License 2.0](LICENSE).
