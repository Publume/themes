import { copyFile, mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { topicIdForLabel } from '../shared/src/lib/topics'
import { composeTheme } from './compose-theme'

const repository = path.resolve(import.meta.dir, '..')
const themesDirectory = path.join(repository, 'themes')
const expectedHomeArticleCount = 12
const selectedTheme = Bun.argv[2]
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

async function assertBuiltSite(directory: string): Promise<void> {
  const dist = path.join(directory, 'dist')
  const topicId = topicIdForLabel('publume')
  const required = [
    'index.html',
    '404.html',
    'about/index.html',
    'archive/index.html',
    'archive/page/2/index.html',
    'search/index.html',
    'topics/index.html',
    `topics/${topicId}/index.html`,
    'rss.xml',
    'robots.txt',
    'sitemap-index.xml',
    'pagefind/pagefind.js',
    'pagefind/pagefind-ui.js',
    'zh-CN/index.html',
    'zh-CN/archive/index.html',
    'zh-CN/search/index.html',
    'zh-CN/topics/index.html',
    'zh-CN/rss.xml',
  ]
  for (const relativePath of required) {
    if (!(await Bun.file(path.join(dist, relativePath)).exists()))
      throw new Error(`Built site is missing ${relativePath}`)
  }

  const home = await readFile(path.join(dist, 'index.html'), 'utf8')
  if (!home.includes('href="https://github.com/Publume">Publume</a>'))
    throw new Error('Home page is missing the Publume GitHub attribution link')
  const homeArticlePaths = new Set([...home.matchAll(/\bhref="(\/en\/[^/"?#]+\/)"/g)].map((match) => match[1]))
  if (homeArticlePaths.size !== expectedHomeArticleCount)
    throw new Error(`Home page has ${homeArticlePaths.size} articles; expected ${expectedHomeArticleCount}`)

  const search = await readFile(path.join(dist, 'search/index.html'), 'utf8')
  if (!search.includes('class="publume-search-results"') || search.includes('<pagefind-results>'))
    throw new Error('Search page must render results in the page body instead of a suggestion popover')

  for (const file of (await filesBelow(dist)).filter((entry) => entry.endsWith('.html'))) {
    const html = await readFile(file, 'utf8')
    for (const match of html.matchAll(/\bhref="([^"]+)"/g)) {
      const href = match[1]
      if (!href || href.startsWith('#')) continue
      const url = new URL(href, 'https://example.com/')
      if (url.origin !== 'https://example.com') continue
      const target = url.pathname.endsWith('/')
        ? path.join(dist, url.pathname, 'index.html')
        : path.join(dist, url.pathname)
      if (!(await Bun.file(target).exists()))
        throw new Error(`${path.relative(dist, file)} links to missing ${url.pathname}`)
    }
  }
}

async function addArchiveFixtures(directory: string): Promise<void> {
  const source = path.join(directory, 'src/content/articles/en/welcome.md')
  for (let index = 1; index <= 20; index += 1) {
    const filename = `archive-${String(index).padStart(2, '0')}.md`
    await copyFile(source, path.join(directory, 'src/content/articles/en', filename))
  }
}

for (const entry of entries) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `publume-${entry.name}-`))
  const directory = path.join(temporaryRoot, 'site')
  try {
    console.log(`\n==> ${entry.name}: compose, install, and check`)
    await composeTheme(repository, entry.name, directory)
    await addArchiveFixtures(directory)
    for (const args of [
      ['bun', 'install', '--frozen-lockfile', '--cwd', directory],
      ['bun', 'run', '--cwd', directory, 'check'],
    ]) {
      const process = Bun.spawn(args, { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
      const exitCode = await process.exited
      if (exitCode !== 0) throw new Error(`Theme ${entry.name} failed with exit code ${exitCode}`)
    }
    await assertBuiltSite(directory)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}
