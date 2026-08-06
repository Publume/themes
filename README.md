# Publume Themes

[![CI](https://github.com/Publume/themes/actions/workflows/ci.yml/badge.svg)](https://github.com/Publume/themes/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Publume Themes contains self-contained static site themes for
[Publume Core](https://github.com/Publume/core). Each theme can be copied into an
empty repository, configured by Core, built independently, and deployed with its
own GitHub Pages workflow.

> **Project status:** Publume Themes is pre-1.0. Theme and generated-content
> contracts may change before the first stable release.

## Available themes

| Theme | Purpose | Runtime JavaScript |
| --- | --- | --- |
| [`editorial`](themes/editorial) | Fast, readable publication for news and analysis | None |

## Contract

Every directory under `themes/` is a complete project. A compatible theme must:

- contain a `.publume-theme.json` marker with schema version `1`;
- build with `bun install --frozen-lockfile` and `bun run build`;
- read generated settings from `src/data/site-config.generated.json`;
- read generated Markdown from `src/content/articles/`;
- include `.github/workflows/pages.yml` that builds private repositories and deploys public repositories to GitHub Pages;
- avoid reading Core credentials or requiring a long-running server.

The complete contract is documented in [Theme contract](docs/theme-contract.md).

## Development

```bash
git clone https://github.com/Publume/themes.git
cd themes
bun install --frozen-lockfile
bun install --frozen-lockfile --cwd themes/editorial
bun run check
```

Preview the editorial theme with:

```bash
bun run --cwd themes/editorial dev
```

Repository-wide checks validate the theme marker and required files, then run
the theme's own Astro checks and production build. CI also runs Publume Core's
acceptance flow against the real theme.

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Security
issues must follow [SECURITY.md](SECURITY.md), not the public issue tracker.

## License

Publume Themes is licensed under the [Apache License 2.0](LICENSE).
