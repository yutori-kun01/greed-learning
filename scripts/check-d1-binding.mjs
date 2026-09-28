// Confirms that wrangler.toml's D1 binding points at a database that exists
// in the Cloudflare account being deployed to.
//
// database_id is committed to the repository, so a fork — or a database that
// was deleted and re-created — leaves it pointing at an id this account does
// not own. Wrangler still deploys, and the app then fails on every query.
//
// Usage: node scripts/check-d1-binding.mjs <d1-list.json> <wrangler.toml>

import { readFileSync } from 'node:fs'

export function readBinding(toml) {
  const block = toml.split(/^\[\[d1_databases\]\]\s*$/m)[1] ?? ''
  const field = (name) => (block.match(new RegExp(`^\\s*${name}\\s*=\\s*"([^"]+)"`, 'm')) || [])[1] ?? null
  return { name: field('database_name'), id: field('database_id') }
}

export function checkBinding(databases, binding) {
  if (!binding.name || !binding.id) {
    return { ok: false, message: 'wrangler.toml has no [[d1_databases]] entry with database_name and database_id.' }
  }
  const byName = databases.find((db) => db.name === binding.name)
  if (!byName) {
    return {
      ok: false,
      message: `D1 database '${binding.name}' does not exist in this Cloudflare account. Run 'npx wrangler d1 create ${binding.name}' and put the printed database_id into wrangler.toml.`,
    }
  }
  if (byName.uuid !== binding.id) {
    return {
      ok: false,
      message: `wrangler.toml points at database_id '${binding.id}', but '${binding.name}' in this account is '${byName.uuid}'. Set database_id in wrangler.toml to '${byName.uuid}' and re-run; otherwise the deployed app cannot reach its database.`,
    }
  }
  return { ok: true, message: `D1 binding OK: ${binding.name} (${binding.id})` }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [listPath, tomlPath] = process.argv.slice(2)
  const databases = JSON.parse(readFileSync(listPath, 'utf8'))
  const result = checkBinding(databases, readBinding(readFileSync(tomlPath, 'utf8')))
  if (!result.ok) {
    console.log(`::error::${result.message}`)
    process.exit(1)
  }
  console.log(result.message)
}
