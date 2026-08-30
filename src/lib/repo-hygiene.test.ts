import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Files that are legitimately binary and so legitimately contain NUL bytes.
const BINARY_EXTENSIONS = [
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.db', '.sqlite', '.sqlite3',
]

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'buffer' })
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
}

describe('repository hygiene', () => {
  // Editors on Windows have silently written UTF-16 into this repo four
  // separate times (.gitignore, .node-version, .nvmrc). The damage is always
  // invisible in an editor and always breaks a tool that expects UTF-8: the
  // UTF-16 .gitignore stopped ignoring build output, and a UTF-16
  // .node-version made actions/setup-node resolve the version as "2\0 0\0"
  // and fail the deploy. Catch it here instead of in CI ten minutes later.
  it('has no UTF-16 or NUL bytes in tracked text files', () => {
    const offenders: string[] = []

    for (const file of trackedFiles()) {
      if (BINARY_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext))) continue

      let data: Buffer
      try {
        data = readFileSync(file)
      } catch {
        continue // deleted or unreadable in this checkout
      }

      if (data.includes(0)) {
        const bom = data[0] === 0xff && data[1] === 0xfe
        offenders.push(`${file} (${bom ? 'UTF-16 LE with BOM' : 'contains NUL bytes'})`)
      }
    }

    expect(
      offenders,
      `These tracked files are not UTF-8. Re-save them as UTF-8:\n  ${offenders.join('\n  ')}`,
    ).toEqual([])
  })

  // A wrong value here does not fail the build — it fails the deploy, after
  // the runner has already spent minutes installing and building.
  it('pins a Node version the runner can actually resolve', () => {
    for (const file of ['.node-version', '.nvmrc']) {
      const raw = readFileSync(file)
      expect(raw.includes(0), `${file} is not UTF-8`).toBe(false)
      expect(raw.toString('utf8').trim()).toMatch(/^\d+(\.\d+)*$/)
    }
  })
})
