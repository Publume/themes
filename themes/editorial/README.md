# Editorial theme

Editorial is the default Publume theme for source-linked news and analysis. It
prioritizes reading speed, clear provenance, responsive typography, and static
delivery without client-side JavaScript.

## Features

- responsive article index and detail pages;
- configurable identity, colors, type scale, and commercial links;
- canonical URLs, Open Graph, Twitter cards, and JSON-LD;
- RSS feed and sitemap;
- accessible semantic markup and focus states;
- GitHub Pages deployment workflow;
- support for root domains and repository subpaths.

## Local development

```bash
bun install --frozen-lockfile
bun run dev
```

Edit `src/data/site-config.generated.json` and the sample Markdown only for local
theme development. Publume Core overwrites the generated configuration and
removes sample articles when it creates a real site.
