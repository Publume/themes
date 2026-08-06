# Security Policy

## Supported versions

Publume Themes is pre-1.0. Security fixes are applied to the latest release and
the `main` branch. Older pre-1.0 releases may not receive patches.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting feature for `Publume/themes`. If
that feature is unavailable, email `publume.cloud@gmail.com` with the affected
theme and version, reproduction steps, expected impact, and known mitigations.

Do not include production tokens, private repository content, personal data, or
third-party secrets. Maintainers will coordinate disclosure after investigation.

## Security boundaries

Themes render untrusted generated Markdown and configuration. Raw HTML is not
enabled, generated URLs are validated, and structured data is serialized before
it reaches HTML. Theme build scripts execute as trusted code in Core and site
workflows, so consumers should pin reviewed theme revisions.
