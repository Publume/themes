# Contributing to Publume Themes

Thank you for improving Publume Themes. Contributions are welcome through issues
and pull requests in the public repository.

## Before you start

- Search existing issues and pull requests.
- Open a proposal before changing the theme contract or generated-content schema.
- Report vulnerabilities through the process in `SECURITY.md`.
- Keep source code, documentation, tests, commits, and issue content in English.

## Development setup

```bash
git clone https://github.com/Publume/themes.git
cd themes
bun install --frozen-lockfile
bun install --frozen-lockfile --cwd themes/editorial
bun run check
```

Use Bun 1.3.14 or newer. A theme must remain self-contained after its directory
is copied out of this repository.

## Making a change

1. Create a focused branch from `main`.
2. Preserve the versioned theme and generated-content contracts.
3. Verify empty, populated, mobile, and long-title states when changing presentation.
4. Run `bun run format`, then `bun run check`.
5. Review the complete diff for secrets, generated artifacts, and unrelated edits.

Prefer semantic HTML, progressive enhancement, and zero client-side JavaScript.
New dependencies require a clear runtime need, compatible license, and maintained
upstream.

## Pull requests

A pull request should explain:

- the problem and intended user outcome;
- contract, accessibility, SEO, or visual changes;
- verification performed;
- compatibility and deployment risks;
- follow-up work intentionally outside the change.

## License

By contributing, you agree that your contributions are licensed under the
Apache License 2.0.
