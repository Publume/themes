import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { topicIdForLabel } from '../shared/src/lib/topics'
import { composeTheme } from './compose-theme'

const repository = path.resolve(import.meta.dir, '..')
const themesDirectory = path.join(repository, 'themes')
const expectedHomeArticleCount = 12
const adsensePublisherId = 'ca-pub-1234567890123456'
const selectedTheme = Bun.argv.slice(2).find((argument) => argument !== '--keep-fixture')

const archiveFixtures = [
  {
    title: 'Small signals, clear decisions',
    summary: 'A compact field guide to separating useful evidence from ambient noise.',
    topics: ['research', 'decision-making'],
    sourceUrl: 'https://www.w3.org/TR/clreq/',
  },
  {
    title: 'The week in public infrastructure',
    summary: 'Five developments that changed how public systems are funded, measured, and maintained.',
    topics: ['infrastructure', 'public-interest'],
    sourceUrl: 'https://data.europa.eu/',
  },
  {
    title: 'What changed, what did not',
    summary: 'A before-and-after review that keeps the durable context beside the latest update.',
    topics: ['analysis', 'change-log'],
    sourceUrl: 'https://www.reuters.com/',
  },
  {
    title: 'A slower map of fast-moving systems',
    summary: 'Tracing dependencies, handoffs, and overlooked constraints across a changing network.',
    topics: ['systems', 'mapping'],
    sourceUrl: 'https://www.openstreetmap.org/',
  },
  {
    title: 'Seven notes from the edge of the network',
    summary: 'Short observations on latency, maintenance, resilience, and the people who keep services online.',
    topics: ['networks', 'operations'],
    sourceUrl: 'https://www.ietf.org/standards/',
  },
  {
    title:
      'How a carefully documented handoff prevents small publishing errors from becoming expensive operational failures',
    summary: 'A deliberately long headline that proves the layout can preserve hierarchy without clipping or overflow.',
    topics: ['publishing', 'operations'],
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
  },
  {
    title: 'Field notes: water, heat, and resilient streets',
    summary: 'What local measurements reveal about climate adaptation at the scale of a single block.',
    topics: ['climate', 'cities'],
    sourceUrl: 'https://www.noaa.gov/',
  },
  {
    title: 'An index of tools worth keeping',
    summary: 'A selective catalog of small, dependable utilities that reduce routine editorial work.',
    topics: ['tools', 'workflow'],
    sourceUrl: 'https://github.com/topics/static-site-generator',
  },
  {
    title: 'Beyond the dashboard',
    summary: 'Why responsible reporting needs narrative context as much as charts, counters, and status lights.',
    topics: ['data', 'storytelling'],
    sourceUrl: 'https://pudding.cool/',
  },
  {
    title: 'The shape of a trustworthy archive',
    summary: "Stable links, legible chronology, and source trails turn yesterday's updates into durable knowledge.",
    topics: ['archives', 'trust'],
    sourceUrl: 'https://www.loc.gov/web-archiving/',
  },
  {
    title: 'Three questions for automated research',
    summary: 'A practical test for provenance, uncertainty, and human review before generated material is published.',
    topics: ['automation', 'research'],
    sourceUrl: 'https://www.nist.gov/artificial-intelligence',
  },
  {
    title: 'When source trails become product infrastructure',
    summary: 'Provenance is not a footnote when readers, search engines, and future editors all depend on it.',
    topics: ['sources', 'product'],
    sourceUrl: 'https://schema.org/Article',
  },
  {
    title: 'A practical guide to calmer release days',
    summary: 'Small verification loops make launches easier to understand, reverse, and improve.',
    topics: ['releases', 'quality'],
    sourceUrl: 'https://web.dev/learn/performance/',
  },
  {
    title: 'The quiet work behind reliable feeds',
    summary: 'Caching, validation, and graceful failure determine whether a feed remains useful over time.',
    topics: ['feeds', 'reliability'],
    sourceUrl: 'https://www.rssboard.org/rss-specification',
  },
  {
    title: 'Reading the city through open data',
    summary: 'A tour of the public datasets that make invisible urban patterns easier to see.',
    topics: ['open-data', 'cities'],
    sourceUrl: 'https://data.gov/',
  },
  {
    title: 'Protocols, people, and the space between',
    summary: 'Technical standards only become real when teams can interpret and maintain them together.',
    topics: ['standards', 'collaboration'],
    sourceUrl: 'https://www.ecma-international.org/publications-and-standards/',
  },
  {
    title: 'A concise brief on durable interfaces',
    summary: 'Clear contracts let independent parts of a publishing system evolve without constant coordination.',
    topics: ['interfaces', 'architecture'],
    sourceUrl: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    title: 'The evidence desk: five links that changed our view',
    summary: 'A source-first reading list with enough context to explain why each reference matters.',
    topics: ['evidence', 'reading-list'],
    sourceUrl: 'https://www.oecd.org/',
  },
  {
    title: 'Designing for the article nobody expected to be this long',
    summary:
      'Long-form pages need a stable reading measure, useful landmarks, and metadata that never competes with the text.',
    topics: ['design', 'long-form'],
    sourceUrl: 'https://www.w3.org/International/questions/qa-scripts.en',
  },
  {
    title: 'One publication, many languages, no manual assembly',
    summary:
      'Shared content contracts can support distinct scripts and layouts without duplicating the publishing pipeline.',
    topics: ['localization', 'publishing'],
    sourceUrl: 'https://www.unicode.org/standard/standard.html',
  },
] as const

const expectedPublishedTotal = archiveFixtures.length + 1
const expectedSourceCount = new Set(
  ['https://github.com/Publume/core', ...archiveFixtures.map((fixture) => fixture.sourceUrl)].map(
    (url) => new URL(url).hostname,
  ),
).size
const publishedTotalMarkers: Readonly<Record<string, string>> = {
  arcade: `<dt>Published</dt><dd>${expectedPublishedTotal}</dd>`,
  atlas: `<dt>Published</dt><dd>${expectedPublishedTotal}</dd>`,
  briefing: `<dt>Published</dt><dd>${expectedPublishedTotal}</dd>`,
  editorial: `<p class="cover-count">${expectedPublishedTotal} articles</p>`,
  laboratory: `<dt>Published</dt><dd>${expectedPublishedTotal}</dd>`,
  ledger: `<p class="label">Published</p><h2 id="latest-heading">Latest</h2><span>${expectedPublishedTotal}</span>`,
  orbit: `<dt>Published</dt><dd>${expectedPublishedTotal}</dd>`,
  scoreboard: `<span>Published</span><strong>${expectedPublishedTotal}</strong>`,
  studio: `<div class="hero-index" aria-hidden="true">${expectedPublishedTotal}</div>`,
  terminal: `<dt>Published</dt><dd>${String(expectedPublishedTotal).padStart(3, '0')}</dd>`,
}
const sourceCountMarkers: Readonly<Record<string, string>> = {
  arcade: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  atlas: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  briefing: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  laboratory: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  ledger: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  orbit: `<dt>Sources</dt><dd>${expectedSourceCount}</dd>`,
  scoreboard: `<span>Sources</span><strong>${expectedSourceCount}</strong>`,
  terminal: `<dt>Sources</dt><dd>${String(expectedSourceCount).padStart(3, '0')}</dd>`,
}
const expectedHtmlCount = 36 + new Set(['publume', ...archiveFixtures.flatMap((fixture) => fixture.topics)]).size

const keepFixture = Bun.argv.includes('--keep-fixture')
const entries = (await readdir(themesDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .filter((entry) => !selectedTheme || entry.name === selectedTheme)
  .sort((left, right) => left.name.localeCompare(right.name))

if (entries.length === 0) throw new Error('No themes found')

async function filesBelow(directory: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesBelow(entryPath)))
    else if (entry.isFile()) files.push(entryPath)
  }
  return files
}

async function assertBuiltSite(directory: string, themeName: string, adsEnabled: boolean): Promise<void> {
  const dist = path.join(directory, 'dist')
  const topicId = topicIdForLabel('publume')
  const required = [
    'index.html',
    '404.html',
    'about/index.html',
    'archive/index.html',
    'archive/page/2/index.html',
    'search/index.html',
    'sources/index.html',
    'topics/index.html',
    `topics/${topicId}/index.html`,
    'rss.xml',
    'robots.txt',
    'sitemap-index.xml',
    'pagefind/pagefind.js',
    'pagefind/pagefind-ui.js',
    'publume-logo.png',
    'zh-CN/index.html',
    'zh-CN/archive/index.html',
    'zh-CN/search/index.html',
    'zh-CN/sources/index.html',
    'zh-CN/topics/index.html',
    'zh-CN/rss.xml',
    'zh-CN/welcome/index.html',
  ]
  for (const relativePath of required) {
    if (!(await Bun.file(path.join(dist, relativePath)).exists()))
      throw new Error(`Built site is missing ${relativePath}`)
  }

  const home = await readFile(path.join(dist, 'index.html'), 'utf8')
  if (!home.includes('class="publume-attribution-link" href="https://github.com/Publume"'))
    throw new Error('Home page is missing the Publume GitHub attribution link')
  if (!home.includes('class="publume-attribution-logo" src="/publume-logo.png"'))
    throw new Error('Home page is missing the Publume attribution logo')
  const homeArticlePaths = new Set([...home.matchAll(/\bhref="(\/en\/[^/"?#]+\/)"/g)].map((match) => match[1]))
  if (homeArticlePaths.size !== expectedHomeArticleCount)
    throw new Error(`Home page has ${homeArticlePaths.size} articles; expected ${expectedHomeArticleCount}`)
  const publishedTotalMarker = publishedTotalMarkers[themeName]
  if (publishedTotalMarker && !home.includes(publishedTotalMarker))
    throw new Error(`Home page does not show the full published total for theme ${themeName}`)
  const sourceCountMarker = sourceCountMarkers[themeName]
  if (sourceCountMarker && !home.includes(sourceCountMarker))
    throw new Error(`Home page does not show the full source count for theme ${themeName}`)

  const search = await readFile(path.join(dist, 'search/index.html'), 'utf8')
  if (
    !search.includes('class="shell publume-page publume-search"') ||
    !search.includes('class="publume-search-results"') ||
    search.includes('<pagefind-results>')
  )
    throw new Error('Search page must render results in the page body instead of a suggestion popover')
  if (!search.includes('<meta name="robots" content="noindex,follow">'))
    throw new Error('Search page must be noindex,follow')

  const sources = await readFile(path.join(dist, 'sources/index.html'), 'utf8')
  if (
    !sources.includes('class="shell publume-page publume-sources"') ||
    !sources.includes('class="publume-source-directory"') ||
    !sources.includes('href="https://github.com"')
  )
    throw new Error('Sources page must aggregate the language-scoped article sources')

  const archive = await readFile(path.join(dist, 'archive/index.html'), 'utf8')
  const archiveScores = new Set([...archive.matchAll(/>Relevance (\d+)</g)].map((match) => match[1]))
  if (archiveScores.size < 2) throw new Error('Score-enabled archive fixture must demonstrate content-specific scores')

  for (const [relativePath, className] of [
    ['about/index.html', 'publume-about'],
    ['archive/index.html', 'publume-archive'],
    ['topics/index.html', 'publume-topics'],
  ] as const) {
    const html = await readFile(path.join(dist, relativePath), 'utf8')
    if (!html.includes(`class="shell publume-page ${className}"`))
      throw new Error(`${relativePath} is missing its shared page-layout class`)
  }

  const article = await readFile(path.join(dist, 'en/welcome/index.html'), 'utf8')
  if (!article.includes('Relevance 92')) throw new Error('Score-enabled article page does not render its score')
  const translatedArticle = await readFile(path.join(dist, 'zh-CN/welcome/index.html'), 'utf8')

  for (const [pageName, html, selector] of [
    ['home', home, 'read-link'],
    ['article', article, 'back-link'],
    ['translated article', translatedArticle, 'back-link'],
  ] as const) {
    for (const match of html.matchAll(new RegExp(`<a\\b[^>]*class="${selector}"[^>]*>`, 'g'))) {
      if (!match[0].includes('lang="en"'))
        throw new Error(`${pageName} ${selector} must declare the configured UI language`)
    }
  }
  for (const [pageName, html] of [
    ['home', home],
    ['article', article],
    ['translated article', translatedArticle],
  ] as const) {
    for (const match of html.matchAll(/<[^>]+>Relevance 92<\/[^>]+>/g)) {
      if (!match[0].includes('lang="en"'))
        throw new Error(`${pageName} relevance label must declare the configured UI language`)
    }
  }
  const disclosure = 'Automation assists with selection and drafting. Every article retains its source links.'
  for (const [pageName, html] of [
    ['article', article],
    ['translated article', translatedArticle],
  ] as const) {
    const count = html.split(disclosure).length - 1
    if (count !== 1) throw new Error(`${pageName} renders the AI disclosure ${count} times; expected exactly once`)
  }

  const sitemapFiles = (await filesBelow(dist)).filter((entry) => /sitemap.*\.xml$/.test(entry))
  const sitemap = (await Promise.all(sitemapFiles.map((file) => readFile(file, 'utf8')))).join('\n')
  if (/\/(?:search|404)(?:\/|\.html?)/.test(sitemap)) throw new Error('Sitemap must exclude search and 404 pages')

  const htmlFiles = (await filesBelow(dist)).filter((entry) => entry.endsWith('.html'))
  if (htmlFiles.length !== expectedHtmlCount)
    throw new Error(`Built site has ${htmlFiles.length} HTML files; expected ${expectedHtmlCount}`)

  const expectedSchemas = new Map([
    ['index.html', 'WebSite'],
    ['archive/index.html', 'CollectionPage'],
    ['topics/index.html', 'CollectionPage'],
    ['sources/index.html', 'CollectionPage'],
    ['search/index.html', 'SearchResultsPage'],
    ['about/index.html', 'AboutPage'],
    ['en/welcome/index.html', 'Article'],
  ])
  for (const [relativePath, expectedType] of expectedSchemas) {
    const html = await readFile(path.join(dist, relativePath), 'utf8')
    const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
    if (!match?.[1]) throw new Error(`${relativePath} is missing JSON-LD`)
    const structuredData = JSON.parse(match[1]) as { '@type'?: string }
    if (structuredData['@type'] !== expectedType)
      throw new Error(`${relativePath} has JSON-LD type ${structuredData['@type']}; expected ${expectedType}`)
  }

  const adsPath = path.join(dist, 'ads.txt')
  if (adsEnabled) {
    for (const file of htmlFiles) {
      const html = await readFile(file, 'utf8')
      const providerScripts = (html.match(/pagead2\.googlesyndication\.com/g) ?? []).length
      const expectedProviderScripts = html.includes('data-ad-placement=') ? 1 : 0
      if (providerScripts !== expectedProviderScripts)
        throw new Error(
          `${path.relative(dist, file)} has ${providerScripts} AdSense provider scripts; expected ${expectedProviderScripts}`,
        )
    }
    if (!home.includes('data-ad-placement="homeAfterFeed"')) throw new Error('Enabled home ad placement is missing')
    if (!archive.includes('data-ad-placement="archiveInline"'))
      throw new Error('Enabled archive ad placement is missing')
    if (!archive.includes('class="publume-score"')) throw new Error('Enabled score configuration is not rendered')
    if (!article.includes('data-ad-placement="articleEnd"')) throw new Error('Enabled article ad placement is missing')
    if ((await readFile(adsPath, 'utf8')) !== 'google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n')
      throw new Error('Enabled ads.txt does not contain the validated AdSense publisher record')
  } else {
    for (const file of htmlFiles) {
      const html = await readFile(file, 'utf8')
      if (html.includes('adsbygoogle') || html.includes('googlesyndication'))
        throw new Error(`${path.relative(dist, file)} contains advertising markup while ads are disabled`)
    }
    if (await Bun.file(adsPath).exists()) throw new Error('Disabled build must not emit ads.txt')
  }

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8')
    const relativePath = path.relative(dist, file)
    if (html.includes('example.invalid')) throw new Error(`${relativePath} contains a placeholder absolute URL`)
    if (relativePath !== '404.html') {
      const routePath = relativePath === 'index.html' ? '/' : `/${relativePath.replace(/index\.html$/, '')}`
      const canonical = new URL(routePath, 'https://example.com/').href
      if (!html.includes(`<link rel="canonical" href="${canonical}">`))
        throw new Error(`${relativePath} is missing canonical ${canonical}`)
    }
    if (!relativePath.includes('/search/') && relativePath !== 'search/index.html' && relativePath !== '404.html') {
      if (!html.includes('<meta property="og:image"') || !html.includes('<meta name="twitter:image"'))
        throw new Error(`${relativePath} is missing automatic social image metadata`)
    }
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const href = match[1]
      if (!href || href.startsWith('#')) continue
      const url = new URL(href, 'https://example.com/')
      if (url.origin !== 'https://example.com') continue
      const target = url.pathname.endsWith('/')
        ? path.join(dist, url.pathname, 'index.html')
        : path.join(dist, url.pathname)
      if (!(await Bun.file(target).exists())) throw new Error(`${relativePath} links to missing ${url.pathname}`)
    }
  }
}

function replaceFixtureValue(contents: string, current: string, replacement: string): string {
  if (!contents.includes(current)) throw new Error(`Visual fixture template is missing ${current}`)
  return contents.replace(current, replacement)
}

async function addArchiveFixtures(directory: string): Promise<void> {
  const source = path.join(directory, 'src/content/articles/en/welcome.md')
  const template = await readFile(source, 'utf8')
  for (const [index, fixture] of archiveFixtures.entries()) {
    const fixtureNumber = index + 1
    const filename = `archive-${String(fixtureNumber).padStart(2, '0')}.md`
    const decisionKey = `archive-${String(fixtureNumber).padStart(2, '0')}`
    const publishedAt = `2026-01-${String(index + 2).padStart(2, '0')}T00:00:00.000Z`
    const score = (0.72 + index * 0.01).toFixed(2)
    const topics = fixture.topics.map((topic) => `  - ${JSON.stringify(topic)}`).join('\n')
    const body = [
      `${fixture.summary} This fixture keeps visual acceptance grounded in realistic editorial metadata.`,
      '',
      '## What we observed',
      '',
      'The source trail stays visible, the hierarchy remains readable, and the page can adapt without manual theme-specific content.',
      '',
      '- A distinct headline length',
      '- A useful summary and topic pair',
      '- A source host that exercises the directory layout',
    ].join('\n')
    const replacements = [
      ['decisionKey: "welcome"', `decisionKey: ${JSON.stringify(decisionKey)}`],
      ['title: "A source-linked publication, ready to make your own"', `title: ${JSON.stringify(fixture.title)}`],
      [
        'summary: "This sample shows how Publume separates verified content from the visual theme."',
        `summary: ${JSON.stringify(fixture.summary)}`,
      ],
      ['publishedAt: "2026-01-01T00:00:00.000Z"', `publishedAt: ${JSON.stringify(publishedAt)}`],
      ['score: 0.92', `score: ${score}`],
      ['topics:\n  - "publume"', `topics:\n${topics}`],
      ['sourceUrls:\n  - "https://github.com/Publume/core"', `sourceUrls:\n  - ${JSON.stringify(fixture.sourceUrl)}`],
      [
        'Publume keeps the publishing runtime and interface translations shared while each theme controls its visual expression.',
        body,
      ],
    ] as const
    const contents = replacements.reduce(
      (current, [expected, replacement]) => replaceFixtureValue(current, expected, replacement),
      template,
    )
    await writeFile(path.join(directory, 'src/content/articles/en', filename), contents)
  }
}

async function enableScore(directory: string): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  config.showScore = true
  config.contactUrl = 'mailto:editor@example.com'
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function enableAdsense(directory: string): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  config.presentation = {
    schemaVersion: 1,
    ads: {
      provider: 'adsense',
      publisherId: adsensePublisherId,
      slots: { homeAfterFeed: '1001', archiveInline: '1002', articleEnd: '1003' },
    },
  }
  config.showScore = true
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function disableOptionalMetadata(directory: string): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  config.showTopics = false
  config.showScore = false
  config.showSources = false
  config.presentation = { schemaVersion: 1, ads: { provider: 'none' } }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function assertOptionalMetadataDisabled(directory: string): Promise<void> {
  const dist = path.join(directory, 'dist')
  const home = await readFile(path.join(dist, 'index.html'), 'utf8')
  if (/href="[^"]*\/(?:topics|sources)\//.test(home))
    throw new Error('Disabled topic or source navigation remains visible')
  if (home.includes('>Sources<')) throw new Error('Disabled source metric remains visible on the home page')
  if (home.includes('Monitoring / Sources') || home.includes('Sources · Published'))
    throw new Error('Disabled source status remains visible in the theme shell')
  const about = await readFile(path.join(dist, 'about/index.html'), 'utf8')
  if (about.includes('<dt>Sources</dt>') || about.includes('Every article retains its original source links'))
    throw new Error('Disabled source disclosure remains visible on the about page')
  const article = await readFile(path.join(dist, 'en/welcome/index.html'), 'utf8')
  if (article.includes('Relevance 92')) throw new Error('Disabled score remains visible on the article page')
  if (article.includes('href="https://github.com/Publume/core"'))
    throw new Error('Disabled source link remains visible on the article page')
  for (const route of ['topics', 'sources']) {
    const html = await readFile(path.join(dist, route, 'index.html'), 'utf8')
    if (!html.includes('<meta name="robots" content="noindex,follow">'))
      throw new Error(`Disabled ${route} directory must be noindex,follow`)
  }
  for (const route of ['zh-CN/topics/index.html', 'zh-CN/sources/index.html']) {
    if (await Bun.file(path.join(dist, route)).exists()) throw new Error(`Disabled directory still emitted ${route}`)
  }
  const sitemapFiles = (await filesBelow(dist)).filter((entry) => /sitemap.*\.xml$/.test(entry))
  const sitemap = (await Promise.all(sitemapFiles.map((file) => readFile(file, 'utf8')))).join('\n')
  if (/\/(?:topics|sources)\//.test(sitemap)) throw new Error('Disabled directories remain in sitemap output')
}

async function disableSiteUrl(directory: string): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  config.url = ''
  config.socialImageUrl = ''
  config.presentation = { schemaVersion: 1, ads: { provider: 'none' } }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function assertSiteUrlDisabled(directory: string): Promise<void> {
  const dist = path.join(directory, 'dist')
  for (const relativePath of ['rss.xml', 'zh-CN/rss.xml', 'sitemap-index.xml']) {
    if (await Bun.file(path.join(dist, relativePath)).exists())
      throw new Error(`Site without a URL still emitted ${relativePath}`)
  }
  for (const file of await filesBelow(dist)) {
    if (!/\.(?:html|xml|txt|css|js)$/.test(file)) continue
    const contents = await readFile(file, 'utf8')
    if (contents.includes('example.invalid'))
      throw new Error(`${path.relative(dist, file)} contains example.invalid without a site URL`)
  }
  const home = await readFile(path.join(dist, 'index.html'), 'utf8')
  for (const forbidden of [
    '<link rel="canonical"',
    'hreflang=',
    'type="application/rss+xml"',
    '<meta property="og:url"',
    '<meta property="og:image"',
    '<meta name="twitter:image"',
  ]) {
    if (home.includes(forbidden)) throw new Error(`Site without a URL still emits ${forbidden}`)
  }
  if (home.includes('href="/rss.xml"')) throw new Error('Site without a URL still links to RSS')
  const structuredDataMatch = home.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
  if (!structuredDataMatch?.[1]) throw new Error('Site without a URL is missing JSON-LD')
  const structuredData = JSON.parse(structuredDataMatch[1]) as { url?: string; image?: string }
  if (structuredData.url || structuredData.image)
    throw new Error('Site without a URL contains absolute JSON-LD URL metadata')
}

async function configurePartialAdsense(directory: string, placement: 'articleEnd' | 'archiveInline'): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>
  config.url = 'https://example.com/'
  config.presentation = {
    schemaVersion: 1,
    ads: { provider: 'adsense', publisherId: adsensePublisherId, slots: { [placement]: '2001' } },
  }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function assertPartialArticleAds(directory: string): Promise<void> {
  const dist = path.join(directory, 'dist')
  for (const relativePath of ['index.html', 'archive/index.html']) {
    const html = await readFile(path.join(dist, relativePath), 'utf8')
    if (html.includes('adsbygoogle') || html.includes('googlesyndication'))
      throw new Error(`Partial article slot leaked advertising into ${relativePath}`)
  }
  const article = await readFile(path.join(dist, 'en/welcome/index.html'), 'utf8')
  if (!article.includes('data-ad-placement="articleEnd"')) throw new Error('Partial article slot is missing')
  if ((article.match(/pagead2\.googlesyndication\.com/g) ?? []).length !== 1)
    throw new Error('Partial article slot must load one provider script')
}

async function removeArticleFixtures(directory: string): Promise<void> {
  const articlesDirectory = path.join(directory, 'src/content/articles')
  await rm(articlesDirectory, { recursive: true, force: true })
  await mkdir(articlesDirectory, { recursive: true })
  await rm(path.join(directory, '.astro'), { recursive: true, force: true })
}

async function assertEmptyArchiveAds(directory: string): Promise<void> {
  const dist = path.join(directory, 'dist')
  for (const relativePath of ['index.html', 'archive/index.html']) {
    const html = await readFile(path.join(dist, relativePath), 'utf8')
    if (html.includes('adsbygoogle') || html.includes('googlesyndication'))
      throw new Error(`Empty ${relativePath} loaded advertising without a rendered slot`)
  }
}

async function runEmptyArchiveFixture(repository: string, temporaryRoot: string): Promise<void> {
  const directory = path.join(temporaryRoot, 'empty-site')
  await composeTheme(repository, 'editorial', directory)
  await removeArticleFixtures(directory)
  await configurePartialAdsense(directory, 'archiveInline')

  const install = Bun.spawn(['bun', 'install', '--frozen-lockfile', '--cwd', directory], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const installExitCode = await install.exited
  if (installExitCode !== 0) throw new Error(`Empty archive fixture install failed with exit code ${installExitCode}`)

  await buildFixture(directory, 'Theme editorial empty archive ad fixture')
  await assertEmptyArchiveAds(directory)
}

async function buildFixture(directory: string, label: string): Promise<void> {
  const process = Bun.spawn(['bun', 'run', '--cwd', directory, 'build'], {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  })
  const exitCode = await process.exited
  if (exitCode !== 0) throw new Error(`${label} failed with exit code ${exitCode}`)
}

async function expectUrlBuildRejection(directory: string, label: string): Promise<void> {
  const process = Bun.spawn(['bun', 'run', '--cwd', directory, 'build'], { stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ])
  const output = `${stdout}\n${stderr}`
  if (exitCode === 0) throw new Error(`${label} accepted a non-HTTP URL`)
  if (!output.includes('must use HTTP or HTTPS')) throw new Error(`${label} failed for an unexpected reason\n${output}`)
}

async function assertInvalidUrlFixtures(directory: string): Promise<void> {
  const configPath = path.join(directory, 'src/data/site-config.generated.json')
  const articlePath = path.join(directory, 'src/content/articles/en/welcome.md')
  const originalConfig = await readFile(configPath, 'utf8')
  const originalArticle = await readFile(articlePath, 'utf8')

  try {
    const config = JSON.parse(originalConfig) as Record<string, unknown>
    config.sponsorUrl = 'javascript:alert(1)'
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
    await expectUrlBuildRejection(directory, 'Site config URL fixture')

    await writeFile(configPath, originalConfig)
    const invalidArticle = originalArticle.replace(
      'https://github.com/Publume/core',
      'ftp://example.com/untrusted-source',
    )
    if (invalidArticle === originalArticle) throw new Error('Source URL fixture could not find the sample source URL')
    await writeFile(articlePath, invalidArticle)
    await rm(path.join(directory, '.astro'), { recursive: true, force: true })
    await expectUrlBuildRejection(directory, 'Article source URL fixture')
  } finally {
    await writeFile(configPath, originalConfig)
    await writeFile(articlePath, originalArticle)
  }
}

for (const entry of entries) {
  const temporaryRoot = keepFixture
    ? path.join(repository, '.local', `${entry.name}-fixture`)
    : await mkdtemp(path.join(os.tmpdir(), `publume-${entry.name}-`))
  const directory = path.join(temporaryRoot, 'site')
  try {
    console.log(`\n==> ${entry.name}: compose, install, and check`)
    await composeTheme(repository, entry.name, directory)
    await addArchiveFixtures(directory)
    await enableScore(directory)
    for (const args of [
      ['bun', 'install', '--frozen-lockfile', '--cwd', directory],
      ['bun', 'run', '--cwd', directory, 'check'],
    ]) {
      const process = Bun.spawn(args, { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
      const exitCode = await process.exited
      if (exitCode !== 0) throw new Error(`Theme ${entry.name} failed with exit code ${exitCode}`)
    }
    await assertBuiltSite(directory, entry.name, false)
    if (keepFixture) {
      console.log(`Kept visual fixture at ${directory}`)
      continue
    }
    if (entry.name === 'editorial') {
      await enableAdsense(directory)
      await buildFixture(directory, `Theme ${entry.name} AdSense fixture`)
      await assertBuiltSite(directory, entry.name, true)
    }

    await disableOptionalMetadata(directory)
    await buildFixture(directory, `Theme ${entry.name} disabled metadata fixture`)
    await assertOptionalMetadataDisabled(directory)

    if (entry.name === 'editorial') {
      await disableSiteUrl(directory)
      await buildFixture(directory, `Theme ${entry.name} no-site-URL fixture`)
      await assertSiteUrlDisabled(directory)

      await configurePartialAdsense(directory, 'articleEnd')
      await buildFixture(directory, `Theme ${entry.name} partial article ad fixture`)
      await assertPartialArticleAds(directory)

      await runEmptyArchiveFixture(repository, temporaryRoot)
      await assertInvalidUrlFixtures(directory)
    }
  } finally {
    if (!keepFixture) await rm(temporaryRoot, { recursive: true, force: true })
  }
}
