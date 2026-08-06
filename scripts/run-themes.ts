import { mkdtemp, readdir, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { composeTheme } from './compose-theme'

const repository = path.resolve(import.meta.dir, '..')
const themesDirectory = path.join(repository, 'themes')
const selectedTheme = Bun.argv[2]
const entries = (await readdir(themesDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .filter((entry) => !selectedTheme || entry.name === selectedTheme)
  .sort((left, right) => left.name.localeCompare(right.name))

if (entries.length === 0) throw new Error('No themes found')

for (const entry of entries) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), `publume-${entry.name}-`))
  const directory = path.join(temporaryRoot, 'site')
  try {
    console.log(`\n==> ${entry.name}: compose, install, and check`)
    await composeTheme(repository, entry.name, directory)
    for (const args of [
      ['bun', 'install', '--frozen-lockfile', '--cwd', directory],
      ['bun', 'run', '--cwd', directory, 'check'],
    ]) {
      const process = Bun.spawn(args, { stdin: 'inherit', stdout: 'inherit', stderr: 'inherit' })
      const exitCode = await process.exited
      if (exitCode !== 0) throw new Error(`Theme ${entry.name} failed with exit code ${exitCode}`)
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}
