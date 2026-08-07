import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { messagesFor, supportedSiteLocales } from '../shared/src/i18n/messages'

const markerSchema = z
  .object({ schemaVersion: z.literal(1), id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/) })
  .strict()
const requiredSharedPaths = [
  '.github/workflows/pages.yml',
  'THIRD_PARTY_NOTICES.md',
  'package.json',
  'public/licenses/OFL-1.1.txt',
  'scripts/generate-fonts.ts',
  'src/content.config.ts',
  'src/data/site-config.generated.json',
  'src/i18n/messages.ts',
  'src/layouts/Document.astro',
  'src/pages/404.astro',
  'src/pages/about.astro',
  'src/pages/archive/[...page].astro',
  'src/pages/index.astro',
  'src/pages/robots.txt.ts',
  'src/pages/search.astro',
  'src/pages/topics/[...topic].astro',
  'src/styles/typography.css',
] as const
const requiredThemePaths = [
  '.publume-theme.json',
  'src/theme/Shell.astro',
  'src/theme/Home.astro',
  'src/theme/Article.astro',
  'src/theme/theme.css',
] as const

const repository = path.resolve(import.meta.dir, '..')

function assertSemanticTypography(themeId: string, stylesheet: string): void {
  const prohibitedFonts =
    /\b(?:Inter|Iowan Old Style|Baskerville|Times New Roman|SFMono-Regular|Consolas|Georgia|Cambria|system-ui|Segoe UI)\b|-apple-system/i
  if (prohibitedFonts.test(stylesheet)) throw new Error(`Theme ${themeId} must use the shared bundled font families`)

  const semanticProperties = {
    'font-family': /^var\(--font-[a-z-]+\)$/,
    'font-size': /^var\(--type-[a-z-]+-size\)$/,
    'font-weight': /^var\(--weight-[a-z-]+\)$/,
    'letter-spacing': /^var\(--tracking-[a-z-]+\)$/,
    'line-height': /^var\(--type-[a-z-]+-leading\)$/,
  } as const

  for (const [property, expected] of Object.entries(semanticProperties)) {
    for (const match of stylesheet.matchAll(new RegExp(`${property}\\s*:\\s*([^;]+);`, 'g'))) {
      const value = match[1]?.trim() ?? ''
      if (!expected.test(value))
        throw new Error(`Theme ${themeId} must use a shared token for ${property}; received ${value}`)
    }
  }
}

for (const relativePath of requiredSharedPaths) {
  if (!(await Bun.file(path.join(repository, 'shared', relativePath)).exists()))
    throw new Error(`Shared runtime is missing ${relativePath}`)
}
for (const locale of supportedSiteLocales) {
  for (const [key, value] of Object.entries(messagesFor(locale).messages)) {
    if (!value.trim()) throw new Error(`Locale ${locale} is missing ${key}`)
  }
}

const themesDirectory = path.resolve(import.meta.dir, '..', 'themes')
const entries = await readdir(themesDirectory, { withFileTypes: true })
const ids = new Set<string>()

for (const entry of entries.filter((item) => item.isDirectory())) {
  const directory = path.join(themesDirectory, entry.name)
  const marker = markerSchema.parse(await Bun.file(path.join(directory, '.publume-theme.json')).json())
  if (marker.id !== entry.name) throw new Error(`Theme directory ${entry.name} does not match marker id ${marker.id}`)
  if (ids.has(marker.id)) throw new Error(`Duplicate theme id: ${marker.id}`)
  ids.add(marker.id)

  for (const relativePath of requiredThemePaths) {
    if (!(await Bun.file(path.join(directory, relativePath)).exists()))
      throw new Error(`Theme ${marker.id} is missing ${relativePath}`)
  }

  assertSemanticTypography(marker.id, await Bun.file(path.join(directory, 'src/theme/theme.css')).text())
}

if (ids.size === 0) throw new Error('No themes found')
console.log(`Validated the shared runtime, ${supportedSiteLocales.length} locales, and ${ids.size} theme overlays.`)
