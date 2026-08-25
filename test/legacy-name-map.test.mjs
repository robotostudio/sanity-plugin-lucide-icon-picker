import {deepStrictEqual, ok, strictEqual} from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {describe, test} from 'node:test'

import {isIconName} from '../src/icons.ts'

const map = JSON.parse(
  readFileSync(new URL('../scripts/legacy-name-map.json', import.meta.url), 'utf8'),
)

describe('legacy name map', () => {
  test('covers all 153 names the old plugin stored in a form Lucide rejects', () => {
    strictEqual(Object.keys(map).length, 153)
  })

  test('every key is a name that genuinely needs migrating', () => {
    // If a key were already valid it would not belong in the map, and rewriting it would be a
    // pointless content mutation.
    const alreadyValid = Object.keys(map).filter(isIconName)

    deepStrictEqual(alreadyValid, [])
  })

  test('every target is a name Lucide can actually resolve', () => {
    const brokenTargets = Object.entries(map).filter(([, to]) => !isIconName(to))

    deepStrictEqual(brokenTargets, [])
  })

  test('nothing maps to itself', () => {
    const selfMapped = Object.entries(map).filter(([from, to]) => from === to)

    deepStrictEqual(selfMapped, [])
  })

  test('maps the known digit-run cases correctly', () => {
    strictEqual(map['clock1'], 'clock-1')
    strictEqual(map['heading2'], 'heading-2')
    strictEqual(map['bar-chart2'], 'bar-chart-2')
    strictEqual(map['calendar1'], 'calendar-1')
  })

  test('every mapping differs only in hyphenation, so no icon silently changes', () => {
    // The old plugin dropped separators before digits; it never picked a different icon. A
    // mapping that changed more than hyphens would mean rewriting content to the wrong glyph.
    const flat = (name) => name.replace(/-/g, '')
    const suspicious = Object.entries(map).filter(([from, to]) => flat(from) !== flat(to))

    deepStrictEqual(suspicious, [])
  })

  test('removed brand icons are absent — they have no replacement', () => {
    for (const name of ['github', 'facebook', 'slack', 'twitter']) {
      ok(!(name in map), `${name} was removed by Lucide and cannot be mapped`)
    }
  })
})
