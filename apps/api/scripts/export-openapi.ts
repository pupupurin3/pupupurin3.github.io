// Writes the OpenAPI document to openapi.json, so the spec is reviewable in
// pull requests and usable without running the Worker. CI fails if the
// committed file is out of date (`npm run openapi -- --check`).
import { readFileSync, writeFileSync } from 'node:fs'
import { createApp, openApiConfig } from '../src/app'

const file = new URL('../openapi.json', import.meta.url)
const doc = createApp().getOpenAPI31Document(openApiConfig)
const text = `${JSON.stringify(doc, null, 2)}\n`

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(file, 'utf8')
  } catch {
    // Missing file: reported below.
  }
  if (current !== text) {
    console.error('apps/api/openapi.json is out of date. Run `npm run openapi -w @portfolio/api` and commit the result.')
    process.exit(1)
  }
  console.log('openapi.json is up to date.')
} else {
  writeFileSync(file, text)
  console.log('Wrote openapi.json')
}
