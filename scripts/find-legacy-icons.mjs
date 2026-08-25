#!/usr/bin/env node
/**
 * Finds — and optionally rewrites — icon values written by the unmaintained
 * `sanity-plugin-lucide-icon-picker`.
 *
 * That plugin derived icon names from Lucide's PascalCase component names with a rule that
 * never inserted a separator before a digit, so it stored `clock1` where Lucide calls the icon
 * `clock-1`. 153 names are affected and none of them resolve in `lucide-react`.
 *
 * Usage:
 *   node scripts/find-legacy-icons.mjs                 # print the GROQ query to run in Vision
 *   node scripts/find-legacy-icons.mjs --map           # print the full old -> new mapping
 *   node scripts/find-legacy-icons.mjs --patch <file>  # turn a Vision export into a patch script
 */
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

const map = JSON.parse(
  readFileSync(fileURLToPath(new URL('./legacy-name-map.json', import.meta.url)), 'utf8'),
)

const args = process.argv.slice(2)

if (args.includes('--map')) {
  for (const [from, to] of Object.entries(map)) console.log(`${from}\t${to}`)
  process.exit(0)
}

if (args.includes('--patch')) {
  const file = args[args.indexOf('--patch') + 1]
  if (!file) {
    console.error('--patch needs a path to a JSON array of {_id, icon} objects')
    process.exit(1)
  }
  const docs = JSON.parse(readFileSync(file, 'utf8'))
  for (const doc of docs) {
    const next = map[doc.icon]
    if (next) console.log(`sanity documents patch ${doc._id} --set icon='${next}'`)
    else console.warn(`# no mapping for ${doc._id}: ${doc.icon}`)
  }
  process.exit(0)
}

// Default: emit a GROQ query listing every document holding a legacy name.
const names = Object.keys(map)
  .map((n) => `"${n}"`)
  .join(', ')
console.log(`// Replace \`icon\` with your field name, then run this in Vision.`)
console.log(`*[icon in [${names}]]{_id, _type, icon}`)
