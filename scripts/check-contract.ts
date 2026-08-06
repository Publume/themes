import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'

const markerSchema = z
  .object({ schemaVersion: z.literal(1), id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/) })
  .strict()
const requiredPaths = [
  '.github/workflows/pages.yml',
  '.publume-theme.json',
  'package.json',
  'src/content.config.ts',
  'src/data/site-config.generated.json',
] as const

const themesDirectory = path.resolve(import.meta.dir, '..', 'themes')
const entries = await readdir(themesDirectory, { withFileTypes: true })
const ids = new Set<string>()

for (const entry of entries.filter((item) => item.isDirectory())) {
  const directory = path.join(themesDirectory, entry.name)
  const marker = markerSchema.parse(await Bun.file(path.join(directory, '.publume-theme.json')).json())
  if (marker.id !== entry.name) throw new Error(`Theme directory ${entry.name} does not match marker id ${marker.id}`)
  if (ids.has(marker.id)) throw new Error(`Duplicate theme id: ${marker.id}`)
  ids.add(marker.id)

  for (const relativePath of requiredPaths) {
    if (!(await Bun.file(path.join(directory, relativePath)).exists()))
      throw new Error(`Theme ${marker.id} is missing ${relativePath}`)
  }
}

if (ids.size === 0) throw new Error('No themes found')
console.log(`Validated ${ids.size} theme contract${ids.size === 1 ? '' : 's'}.`)
