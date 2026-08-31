// Pushes runtime secrets into the deployed Worker.
//
// These deliberately do NOT live in D1 or in the app's own settings UI:
// Workers secrets are encrypted at rest, write-only, and never readable back
// through any app route, so a compromise of the admin UI cannot leak the
// Stripe key. See DEPLOY.md.
//
// Reads them from the environment (GitHub Actions injects them from repo
// secrets) and sends them in a single `wrangler secret bulk` request, since
// each individual `secret put` would otherwise trigger its own Worker
// deployment. Values are never printed — only names.

import { writeFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// BETTER_AUTH_URL is listed first because auth breaks in confusing ways
// without it; the rest are optional and simply skipped when unset, so a
// partial setup (no Stripe yet, no email yet) still deploys and runs.
const SECRET_NAMES = [
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]

const present = {}
for (const name of SECRET_NAMES) {
  const value = process.env[name]
  if (value && value.length > 0) present[name] = value
}

const names = Object.keys(present)

if (names.length === 0) {
  console.log(
    '::warning::No Worker runtime secrets were provided, so none were synced. ' +
      'Login and signup will fail until BETTER_AUTH_SECRET is set as a repository secret.',
  )
  process.exit(0)
}

if (!present.BETTER_AUTH_SECRET) {
  console.log(
    '::warning::BETTER_AUTH_SECRET is not set. Better Auth needs it to sign sessions, ' +
      'so login and signup will fail until it is added as a repository secret.',
  )
}

const file = join(tmpdir(), `worker-secrets-${process.pid}.json`)
writeFileSync(file, JSON.stringify(present), { mode: 0o600 })

try {
  execFileSync('npx', ['wrangler', 'secret', 'bulk', file], { stdio: 'inherit' })
  console.log(`Synced ${names.length} Worker secret(s): ${names.join(', ')}`)
} finally {
  rmSync(file, { force: true })
}
