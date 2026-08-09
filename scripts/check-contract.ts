import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { messagesFor, supportedSiteLocales } from '../shared/src/i18n/messages'
import { adPlacementIds, parsePresentation, presentationSchemaVersion } from '../shared/src/lib/presentation'
import { contactUrlSchema, httpUrlSchema } from '../shared/src/lib/url'

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
  'src/lib/presentation.ts',
  'src/lib/url.ts',
  'src/layouts/Document.astro',
  'src/pages/[ads].txt.ts',
  'src/pages/404.astro',
  'src/components/AboutPage.astro',
  'src/components/AdSlot.astro',
  'src/components/ArticleDisclosure.astro',
  'src/components/ArticleSources.astro',
  'src/components/SourcesPage.astro',
  'src/pages/about.astro',
  'src/pages/archive/[...page].astro',
  'src/pages/index.astro',
  'src/pages/[rss].xml.ts',
  'src/pages/robots.txt.ts',
  'src/pages/search.astro',
  'src/pages/sources.astro',
  'src/pages/[language]/sources.astro',
  'src/pages/topics/[...topic].astro',
  'src/styles/responsive.css',
  'src/styles/typography.css',
  'src/theme/ArticleCard.astro',
] as const
const requiredThemePaths = [
  '.publume-theme.json',
  'src/theme/Shell.astro',
  'src/theme/Home.astro',
  'src/theme/Article.astro',
  'src/theme/theme.css',
] as const

const repository = path.resolve(import.meta.dir, '..')

async function assertSharedResponsiveContract(): Promise<void> {
  const responsive = await Bun.file(path.join(repository, 'shared/src/styles/responsive.css')).text()
  const runtime = await Bun.file(path.join(repository, 'shared/src/styles/runtime.css')).text()
  if (
    !/\.publume-page\s*\{(?=[^}]*display:\s*grid;)(?=[^}]*grid-template-columns:\s*minmax\(0, 1fr\);)(?=[^}]*gap:\s*clamp\(1\.5rem, 3vw, 2\.5rem\);)/s.test(
      runtime,
    )
  )
    throw new Error('Shared pages must use one explicit vertical rhythm instead of collapsing child margins')
  for (const selector of [
    '.publume-page:is(.publume-about, .publume-search)',
    '.publume-page-header',
    '.publume-article-list',
    '.publume-topic-directory',
    '.publume-source-directory',
    '.publume-search-results',
    '.publume-facts',
    '.publume-pagination',
    '.publume-contact',
  ]) {
    if (!responsive.includes(selector))
      throw new Error(`Shared page layout must align ${selector} to its page content edge`)
  }
  for (const [component, className] of [
    ['AboutPage.astro', 'publume-about'],
    ['ArchivePage.astro', 'publume-archive'],
    ['SearchPage.astro', 'publume-search'],
    ['SourcesPage.astro', 'publume-sources'],
    ['TopicsPage.astro', 'publume-topics'],
  ] as const) {
    const source = await Bun.file(path.join(repository, 'shared/src/components', component)).text()
    if (!source.includes(className)) throw new Error(`${component} must expose its shared page-layout class`)
  }
  for (const component of ['SearchPage.astro', 'TopicsPage.astro'] as const) {
    const source = await Bun.file(path.join(repository, 'shared/src/components', component)).text()
    if (!source.includes('publume-page-header-plain'))
      throw new Error(`${component} must suppress the empty metadata column on plain page headers`)
  }
  if (
    !/article\s+:where\(h1, h2, h3\)\s*\{(?=[^}]*max-width:\s*none;)(?=[^}]*overflow-wrap:\s*break-word;)(?=[^}]*text-wrap:\s*pretty;)/s.test(
      responsive,
    )
  )
    throw new Error('Shared responsive CSS must let content titles use their available width before wrapping')
  for (const selector of ['.publume-primary-navigation', '.publume-footer-navigation', '.language-switcher']) {
    if (!responsive.includes(selector)) throw new Error(`Shared responsive CSS must restore ${selector}`)
  }
  if (!responsive.includes('.site-header .header-inner'))
    throw new Error('Shared responsive CSS must let flex-based theme headers wrap before navigation overflows')
  if (!responsive.includes('.language-switcher a'))
    throw new Error('Shared responsive CSS must restore every language switcher link')
  if (
    !responsive.includes('.mobile-menu-panel .publume-primary-navigation') ||
    !responsive.includes('.mobile-menu-panel .language-switcher')
  )
    throw new Error('Shared responsive CSS must keep mobile menu navigation vertical and fully visible')
  if (
    !runtime.includes('.article-body :where(img, svg, video)') ||
    !runtime.includes('.article-body :where(iframe, pre)')
  )
    throw new Error('Shared runtime CSS must keep rich article media inside the reading column')
  const documentLayout = await Bun.file(path.join(repository, 'shared/src/layouts/Document.astro')).text()
  if (documentLayout.indexOf('../styles/responsive.css') < documentLayout.indexOf('../theme/theme.css'))
    throw new Error('Shared responsive CSS must load after the theme overlay')
}

async function assertLanguageAwareTypographyContract(): Promise<void> {
  const typography = await Bun.file(path.join(repository, 'shared/src/styles/typography.css')).text()
  for (const snippet of [
    ':where(:root, [lang])',
    '--type-caption-size: 0.875rem;',
    '--type-caption-leading: 1.375rem;',
    '--type-lead-size: 1.25rem;',
    '--type-lead-leading: 1.875rem;',
    '--type-hero-size: clamp(3rem, 6.4vw, 5.75rem);',
    '--type-hero-leading: 1.11;',
    '--type-cover-size: clamp(2.25rem, 4vw, 3.75rem);',
    '--type-cover-leading: 1.1667;',
    '--type-wordmark-size: clamp(2rem, 3vw, 3.375rem);',
    '--type-wordmark-leading: 1.1;',
    '--weight-semibold: 600;',
    '"Noto Sans Variable", "Noto Sans SC Variable", sans-serif',
    '"Noto Serif Variable", "Noto Serif SC Variable", serif',
    '--type-body-leading: 1.875rem;',
    '--type-hero-size: clamp(2.75rem, 5vw, 4.5rem);',
    '--type-hero-leading: 1.22;',
    '--type-cover-size: clamp(2.25rem, 3.5vw, 3.25rem);',
    '--type-cover-leading: 1.23;',
    'line-break: auto;',
    'line-break: strict;',
    'word-break: normal;',
    'overflow-wrap: break-word;',
  ]) {
    if (!typography.includes(snippet))
      throw new Error(`Shared typography is missing the bilingual contract: ${snippet}`)
  }
  if (
    !/:where\(\[lang\]\)\s*\{(?=[^}]*font-family:\s*var\(--font-body\);)(?=[^}]*letter-spacing:\s*var\(--tracking-normal\);)(?=[^}]*line-height:\s*var\(--type-body-leading\);)/s.test(
      typography,
    )
  )
    throw new Error('Every explicit language boundary must recompute its body font, tracking, and line height')
  if (
    !/:where\(\.site-header, \.site-footer, \.publume-article-sources, \.publume-article-disclosure, \.publume-score\)\s*\{[^}]*font-family:\s*var\(--font-ui\);/s.test(
      typography,
    )
  )
    throw new Error('Shared UI language boundaries must recompute their interface font')
  for (const reversedStack of [
    '"Noto Sans SC Variable", "Noto Sans Variable"',
    '"Noto Serif SC Variable", "Noto Serif Variable"',
    '"Noto Sans TC Variable", "Noto Sans Variable"',
    '"Noto Serif TC Variable", "Noto Serif Variable"',
    '"Noto Sans JP Variable", "Noto Sans Variable"',
    '"Noto Serif JP Variable", "Noto Serif Variable"',
    '"Noto Sans KR Variable", "Noto Sans Variable"',
    '"Noto Serif KR Variable", "Noto Serif Variable"',
  ]) {
    if (typography.includes(reversedStack))
      throw new Error(`Shared typography has a reversed CJK fallback: ${reversedStack}`)
  }

  for (const relativePath of ['src/components/ArticleSources.astro', 'src/components/ArticleDisclosure.astro']) {
    const component = await Bun.file(path.join(repository, 'shared', relativePath)).text()
    if (!component.includes('lang={uiLocale}')) throw new Error(`${relativePath} must declare the UI language`)
  }

  const languageSwitcher = await Bun.file(path.join(repository, 'shared/src/components/LanguageSwitcher.astro')).text()
  if (!languageSwitcher.includes('lang={uiLocale}') || languageSwitcher.includes('lang={language}'))
    throw new Error('Localized language names must declare the UI language, not the destination content language')

  const notFoundPage = await Bun.file(path.join(repository, 'shared/src/pages/404.astro')).text()
  if (
    !notFoundPage.includes('contentLanguage={uiLocale}') ||
    !notFoundPage.includes('lang={uiLocale}') ||
    !notFoundPage.includes('textDirection(uiLocale)')
  )
    throw new Error('The UI-only 404 page must use the UI language and direction')

  const sharedArticleCard = await Bun.file(path.join(repository, 'shared/src/theme/ArticleCard.astro')).text()
  assertAccessibleLanguageNames('shared article card', sharedArticleCard)
}

function assertAccessibleLanguageNames(label: string, source: string): void {
  if (source.includes('aria-label={ui.topics}'))
    throw new Error(`${label} must not attach a UI-language label to content-language topics`)
  if (
    /aria-label=[^>]*(?:ui\.readArticle[^>]*article\.data\.title|article\.data\.title[^>]*ui\.readArticle)/.test(source)
  )
    throw new Error(`${label} must not combine UI and content languages in one accessible name`)
}

function assertThemeLanguageBoundaries(themeId: string, home: string, article: string, shell: string): void {
  for (const [pageName, source] of [
    ['home', home],
    ['article', article],
  ] as const) {
    if (!source.includes('uiLocale')) throw new Error(`Theme ${themeId} ${pageName} must import the UI locale`)
  }

  for (const match of home.matchAll(/<a\b[^>]*class="read-link"[^>]*>/g)) {
    if (!match[0].includes('lang={uiLocale}'))
      throw new Error(`Theme ${themeId} read links must declare the UI language`)
  }
  for (const match of article.matchAll(/<a\b[^>]*class="back-link"[^>]*>/g)) {
    if (!match[0].includes('lang={uiLocale}'))
      throw new Error(`Theme ${themeId} back links must declare the UI language`)
  }
  for (const source of [home, article]) {
    for (const match of source.matchAll(/<[^>]+>\s*\{ui\.relevance\}[^<]*<\/[^>]+>/g)) {
      if (!match[0].includes('lang={uiLocale}'))
        throw new Error(`Theme ${themeId} relevance labels must declare the UI language`)
    }
  }
  for (const match of home.matchAll(/<[^>]+class="empty-state"[^>]*>/g)) {
    if (!match[0].includes('lang={uiLocale}'))
      throw new Error(`Theme ${themeId} empty states must declare the UI language`)
  }

  if (shell.includes('siteConfig.aiDisclosure') || shell.includes('{ui.disclosure}'))
    throw new Error(`Theme ${themeId} footer must not repeat the article disclosure`)
}

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

  for (const selector of [
    '.publume-page-header',
    '.publume-article-card',
    '.publume-topic-directory',
    '.publume-search-results',
    '.publume-facts',
  ]) {
    if (!stylesheet.includes(selector)) throw new Error(`Theme ${themeId} must explicitly style ${selector}`)
  }

  if (/\.topic-list[^{}]*\{[^{}]*text-transform\s*:/s.test(stylesheet))
    throw new Error(`Theme ${themeId} must preserve the authored case of content topics`)
  if (!/:focus-visible\s*\{[^{}]*outline\s*:\s*[34]px solid var\(--primary\)/s.test(stylesheet))
    throw new Error(`Theme ${themeId} must expose a primary-color focus indicator`)
}

function assertThemeVisualStates(themeId: string, stylesheet: string): void {
  if (themeId === 'table') {
    const utilityHover = /\.utility-row a:hover,\s*\.utility-row a:focus-visible\s*\{[^}]*color:\s*var\(--surface\);/s
    if (!utilityHover.test(stylesheet))
      throw new Error('Theme table utility navigation must stay legible on hover and keyboard focus')
    if (!/\.utility-row a:focus-visible\s*\{[^}]*outline-color:\s*var\(--surface\);/s.test(stylesheet))
      throw new Error('Theme table utility navigation needs a visible focus outline on its primary background')
  }

  if (['arcade', 'scoreboard', 'studio'].includes(themeId)) {
    const pageHeader = /\.publume-page-header\s*\{([^}]*)\}/s.exec(stylesheet)?.[1] ?? ''
    if (!/(?:padding|padding-inline(?:-start)?):\s*(?!0(?:[;\s]|$))/.test(pageHeader))
      throw new Error(`Theme ${themeId} page headings need inline space after their decorative edge`)
  }
}

type Rgb = readonly [red: number, green: number, blue: number]

function parseHexColor(value: string): Rgb {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  const compact = match?.[1]
  if (!compact) throw new Error(`Expected a hexadecimal color, received ${value}`)
  const expanded = compact.length === 3 ? [...compact].map((character) => character.repeat(2)).join('') : compact
  const channelAt = (offset: number) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255
  return [channelAt(0), channelAt(2), channelAt(4)]
}

function relativeLuminance([red, green, blue]: Rgb): number {
  const linearize = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
}

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function assertRootTextTokenContrast(themeId: string, stylesheet: string): void {
  const root = /:root\s*\{([\s\S]*?)\}/.exec(stylesheet)?.[1]
  if (!root) throw new Error(`Theme ${themeId} must define root color tokens`)

  const tokens = ['background', 'surface', 'text', 'muted', 'primary'] as const
  const colors = Object.fromEntries(
    tokens.map((token) => {
      const value = new RegExp(`--${token}\\s*:\\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\\s*;`).exec(root)?.[1]
      if (!value) throw new Error(`Theme ${themeId} must define --${token} as a hexadecimal root color`)
      return [token, parseHexColor(value)]
    }),
  ) as Record<(typeof tokens)[number], Rgb>

  for (const foreground of ['text', 'muted', 'primary'] as const) {
    for (const background of ['background', 'surface'] as const) {
      const ratio = contrastRatio(colors[foreground], colors[background])
      if (ratio < 4.5)
        throw new Error(
          `Theme ${themeId} root tokens --${foreground}/--${background} have ${ratio.toFixed(2)}:1 contrast; expected at least 4.5:1`,
        )
    }
  }
}

function assertPresentationContract(): void {
  const fallback = parsePresentation(undefined)
  if (fallback.schemaVersion !== presentationSchemaVersion || fallback.ads.provider !== 'none')
    throw new Error('Missing presentation must preserve the reader-first, ads-disabled default')
  if (parsePresentation({}).ads.provider !== 'none')
    throw new Error('The legacy Core empty presentation object must preserve the ads-disabled default')

  const configured = parsePresentation({
    schemaVersion: presentationSchemaVersion,
    ads: { provider: 'adsense', publisherId: 'ca-pub-1234567890123456', slots: { homeAfterFeed: '1234' } },
  })
  if (configured.ads.provider !== 'adsense' || configured.ads.slots.homeAfterFeed !== '1234')
    throw new Error('Valid AdSense presentation did not parse')

  for (const invalid of [
    { schemaVersion: 2, ads: { provider: 'none' } },
    { schemaVersion: 1, ads: { provider: 'none', script: 'https://example.com/ad.js' } },
    { schemaVersion: 1, ads: { provider: 'custom', script: 'https://example.com/ad.js' } },
    { schemaVersion: 1, ads: { provider: 'adsense', publisherId: 'pub-123', slots: { articleEnd: '1' } } },
    { schemaVersion: 1, ads: { provider: 'adsense', publisherId: 'ca-pub-1234567890123456', slots: {} } },
    {
      schemaVersion: 1,
      ads: { provider: 'adsense', publisherId: 'ca-pub-1234567890123456', slots: { articleEnd: 'slot-1' } },
    },
    {
      schemaVersion: 1,
      ads: {
        provider: 'adsense',
        publisherId: 'ca-pub-1234567890123456',
        slots: { articleEnd: '123456789012345678901' },
      },
    },
    { schemaVersion: 1, ads: { provider: 'adsense', publisherId: 'ca-pub-1234567890123456', slots: { sidebar: '1' } } },
  ]) {
    try {
      parsePresentation(invalid)
      throw new Error(`Invalid presentation was accepted: ${JSON.stringify(invalid)}`)
    } catch (error) {
      if (!(error instanceof TypeError)) throw error
    }
  }
  if (adPlacementIds.join(',') !== 'homeAfterFeed,archiveInline,articleEnd')
    throw new Error('Ad placement contract changed unexpectedly')
}

function assertUrlContract(): void {
  for (const value of ['http://example.com/path', 'https://example.com/path']) {
    if (!httpUrlSchema.safeParse(value).success) throw new Error(`HTTP URL contract rejected ${value}`)
    if (!contactUrlSchema.safeParse(value).success) throw new Error(`Contact URL contract rejected ${value}`)
  }
  if (!contactUrlSchema.safeParse('mailto:editor@example.com').success)
    throw new Error('Contact URL contract must accept mailto links')
  for (const value of ['ftp://example.com/file', 'javascript:alert(1)', 'mailto:editor@example.com']) {
    if (httpUrlSchema.safeParse(value).success) throw new Error(`HTTP URL contract accepted ${value}`)
  }
  for (const value of ['ftp://example.com/file', 'javascript:alert(1)']) {
    if (contactUrlSchema.safeParse(value).success) throw new Error(`Contact URL contract accepted ${value}`)
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
assertPresentationContract()
assertUrlContract()
await assertSharedResponsiveContract()
await assertLanguageAwareTypographyContract()

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

  const stylesheet = await Bun.file(path.join(directory, 'src/theme/theme.css')).text()
  assertSemanticTypography(marker.id, stylesheet)
  assertThemeVisualStates(marker.id, stylesheet)
  assertRootTextTokenContrast(marker.id, stylesheet)
  const shell = await Bun.file(path.join(directory, 'src/theme/Shell.astro')).text()
  if (!shell.includes('uiLocale') || !/<header[^>]*lang=\{uiLocale\}/s.test(shell))
    throw new Error(`Theme ${marker.id} header must declare the UI language`)
  if (!/<footer[^>]*lang=\{uiLocale\}/s.test(shell))
    throw new Error(`Theme ${marker.id} footer must declare the UI language`)
  if (/\b(?:01|001)\b/.test(shell))
    throw new Error(`Theme ${marker.id} shell must not present a hard-coded issue or observation number`)
  const article = await Bun.file(path.join(directory, 'src/theme/Article.astro')).text()
  if (!article.includes('siteConfig.showScore')) throw new Error(`Theme ${marker.id} article page must honor showScore`)
  if (!article.includes('<ArticleSources'))
    throw new Error(`Theme ${marker.id} must use the shared article source structure`)
  if (!article.includes('<ArticleDisclosure'))
    throw new Error(`Theme ${marker.id} must use the shared article disclosure structure`)
  const sourceLabelCount = article.match(/\{ui\.sources\}/g)?.length ?? 0
  if (sourceLabelCount > 1) throw new Error(`Theme ${marker.id} article page repeats the visible Sources label`)
  const disclosureLabelCount = article.match(/\{ui\.disclosure\}/g)?.length ?? 0
  if (disclosureLabelCount > 1) throw new Error(`Theme ${marker.id} article page repeats the visible disclosure label`)
  if (
    /class="article-(?:rank|index)"[^>]*>01</.test(article) ||
    />01<\/\w+>/.test(article) ||
    /\{ui\.latest\}\s+01/.test(article)
  )
    throw new Error(`Theme ${marker.id} article page must not present a hard-coded ordinal`)
  const redundantArticleDecoration = {
    briefing: 'memo-stamp',
    editorial: 'article-folio',
    journal: 'article-issue',
  }[marker.id]
  if (redundantArticleDecoration && article.includes(redundantArticleDecoration))
    throw new Error(`Theme ${marker.id} article page contains a repeated non-data decoration`)
  const home = await Bun.file(path.join(directory, 'src/theme/Home.astro')).text()
  if (marker.id === 'briefing' && !home.includes('briefing-more'))
    throw new Error('Theme briefing must move overflow headlines out of the side rail')
  if (marker.id === 'orbit') {
    if (!/\.article-header > \.topic-list\s*\{[^}]*margin-block-start:/s.test(stylesheet))
      throw new Error('Theme orbit article topics need explicit separation from the summary')
    if (!/\.queue-entry \.mission-track\s*\{[^}]*grid-row: 1 \/ span 2/s.test(stylesheet))
      throw new Error('Theme orbit responsive timeline must span the queue action row')
  }
  if (marker.id === 'arcade') {
    const mediumStart = stylesheet.indexOf('@media (max-width: 68rem)')
    const tabletStart = stylesheet.indexOf('@media (max-width: 58rem)')
    const mobileStart = stylesheet.indexOf('@media (max-width: 40rem)')
    const mediumHeader = stylesheet.slice(mediumStart, tabletStart)
    const tabletHeader = stylesheet.slice(tabletStart, mobileStart)
    if (
      !mediumHeader.includes('.header-deck') ||
      !mediumHeader.includes('grid-template-columns: minmax(0, 1fr) auto auto;') ||
      !tabletHeader.includes('.desktop-navigation') ||
      !tabletHeader.includes('.desktop-language') ||
      !tabletHeader.includes('.mobile-menu') ||
      !tabletHeader.includes('display: block;')
    )
      throw new Error('Theme arcade must progressively replace its desktop header before it overflows')
  }
  assertThemeLanguageBoundaries(marker.id, home, article, shell)
  assertAccessibleLanguageNames(`Theme ${marker.id} home`, home)
  assertAccessibleLanguageNames(`Theme ${marker.id} article`, article)
  const articleCardPath = path.join(directory, 'src/theme/ArticleCard.astro')
  if (await Bun.file(articleCardPath).exists())
    assertAccessibleLanguageNames(`Theme ${marker.id} article card`, await Bun.file(articleCardPath).text())
  if (home.includes('sourceCount') && !home.includes('siteConfig.showSources'))
    throw new Error(`Theme ${marker.id} home source metrics must honor showSources`)
  if (['briefing', 'terminal'].includes(marker.id)) {
    if (!shell.includes('siteConfig.showSources'))
      throw new Error(`Theme ${marker.id} shell source status must honor showSources`)
  }
}

if (ids.size === 0) throw new Error('No themes found')
console.log(`Validated the shared runtime, ${supportedSiteLocales.length} locales, and ${ids.size} theme overlays.`)
