import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

type FontPack = {
  readonly sans: string
  readonly serif?: string
}

const baseImports = [
  '@fontsource-variable/noto-sans/index.css',
  '@fontsource-variable/noto-serif/index.css',
  '@fontsource-variable/noto-sans-mono/index.css',
] as const

const scriptPacks: Readonly<Record<string, FontPack>> = {
  ar: {
    sans: '@fontsource-variable/noto-sans-arabic/index.css',
    serif: '@fontsource-variable/noto-naskh-arabic/index.css',
  },
  hi: {
    sans: '@fontsource-variable/noto-sans-devanagari/index.css',
    serif: '@fontsource-variable/noto-serif-devanagari/index.css',
  },
  ja: {
    sans: '@fontsource-variable/noto-sans-jp/index.css',
    serif: '@fontsource-variable/noto-serif-jp/index.css',
  },
  ko: {
    sans: '@fontsource-variable/noto-sans-kr/index.css',
    serif: '@fontsource-variable/noto-serif-kr/index.css',
  },
  th: {
    sans: '@fontsource-variable/noto-sans-thai/index.css',
    serif: '@fontsource-variable/noto-serif-thai/index.css',
  },
  'zh-CN': {
    sans: '@fontsource-variable/noto-sans-sc/index.css',
    serif: '@fontsource-variable/noto-serif-sc/index.css',
  },
  'zh-TW': {
    sans: '@fontsource-variable/noto-sans-tc/index.css',
    serif: '@fontsource-variable/noto-serif-tc/index.css',
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readLocales(value: unknown): readonly string[] {
  if (!isRecord(value)) throw new Error('Site configuration must be an object')
  const { locale, outputLanguages } = value
  if (typeof locale !== 'string') throw new Error('Site configuration locale must be a string')
  if (!Array.isArray(outputLanguages) || outputLanguages.some((language) => typeof language !== 'string'))
    throw new Error('Site configuration outputLanguages must be an array of strings')
  return [...new Set([locale, ...outputLanguages])]
}

function packFor(locale: string): FontPack | undefined {
  if (locale in scriptPacks) return scriptPacks[locale]
  return scriptPacks[locale.split('-')[0] ?? '']
}

export function fontImportsFor(locales: readonly string[]): readonly string[] {
  const imports = new Set<string>(baseImports)
  for (const locale of locales) {
    const pack = packFor(locale)
    if (!pack) continue
    imports.add(pack.sans)
    if (pack.serif) imports.add(pack.serif)
  }
  return [...imports]
}

const root = process.cwd()
const configPath = path.join(root, 'src/data/site-config.generated.json')
const outputPath = path.join(root, 'src/styles/fonts.generated.css')
const config = JSON.parse(await readFile(configPath, 'utf8')) as unknown
const imports = fontImportsFor(readLocales(config))
const stylesheet = [
  '/* Generated from site-config.generated.json. Do not edit. */',
  ...imports.map((font) => `@import "${font}";`),
  '',
].join('\n')

await writeFile(outputPath, stylesheet)
console.log(`Generated ${path.relative(root, outputPath)} with ${imports.length} local font packs.`)
