import {deepStrictEqual, ok, strictEqual} from 'node:assert/strict'
import {describe, test} from 'node:test'

import {dynamicIconImports} from 'lucide-react/dynamic.js'

import {
  ICON_NAMES,
  isIconName,
  readAllowedIcons,
  restrictToAllowed,
  searchIconNames,
} from '../src/icons.ts'

describe('catalogue', () => {
  /**
   * The reason this plugin exists. The community plugin it replaces derived icon names from
   * Lucide's PascalCase component names with a rule that never inserted a separator before a
   * digit, so 153 of the names it offered — `clock1`, `heading2`, `grid2x2`, `axis3d` — were
   * rejected by the very lookup `DynamicIcon` performs.
   *
   * Deriving the catalogue from `iconNames` should make that impossible, because it *is* the
   * key set `DynamicIcon` resolves against. This test is what keeps that true.
   */
  test('every offered name is one DynamicIcon can resolve', () => {
    const unresolvable = ICON_NAMES.filter((name) => !(name in dynamicIconImports))

    deepStrictEqual(unresolvable, [])
  })

  test('the catalogue is not accidentally empty or truncated', () => {
    ok(ICON_NAMES.length > 2000, `expected 2000+ icons, got ${ICON_NAMES.length}`)
  })

  test('names are kebab-case', () => {
    const malformed = ICON_NAMES.filter((name) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name))

    deepStrictEqual(malformed, [])
  })
})

describe('isIconName', () => {
  test('accepts canonical names', () => {
    for (const name of ['clock-1', 'heading-2', 'grid-2x2', 'axis-3d', 'house', 'rocket']) {
      ok(isIconName(name), `expected ${name} to be valid`)
    }
  })

  test('rejects the digit-run names the old plugin produced', () => {
    for (const name of ['clock1', 'heading2', 'grid2x2', 'axis3d', 'edit2', 'bar-chart2']) {
      ok(!isIconName(name), `expected ${name} to be rejected`)
    }
  })

  test('rejects brand icons Lucide removed in v1', () => {
    for (const name of ['github', 'facebook', 'slack', 'twitter', 'figma']) {
      ok(!isIconName(name), `expected ${name} to be rejected`)
    }
  })

  test('rejects non-strings', () => {
    for (const value of [undefined, null, 42, {}, []]) {
      ok(!isIconName(value))
    }
  })
})

describe('restrictToAllowed', () => {
  test('returns the whole catalogue when nothing is specified', () => {
    strictEqual(restrictToAllowed(undefined), ICON_NAMES)
    strictEqual(restrictToAllowed([]), ICON_NAMES)
  })

  test('keeps only the allowed names, in catalogue order', () => {
    deepStrictEqual([...restrictToAllowed(['zap', 'rocket'])], ['rocket', 'zap'])
  })

  test('drops names Lucide does not know rather than offering broken entries', () => {
    deepStrictEqual([...restrictToAllowed(['rocket', 'clock1', 'github'])], ['rocket'])
  })
})

describe('searchIconNames', () => {
  test('an empty query returns everything untouched', () => {
    strictEqual(searchIconNames(ICON_NAMES, ''), ICON_NAMES)
    strictEqual(searchIconNames(ICON_NAMES, '   '), ICON_NAMES)
  })

  test('ranks an exact match first', () => {
    strictEqual(searchIconNames(ICON_NAMES, 'clock')[0], 'clock')
  })

  test('ranks name prefixes above matches later in the name', () => {
    const results = searchIconNames(ICON_NAMES, 'clock')
    const clockOne = results.indexOf('clock-1')
    const alarmClock = results.indexOf('alarm-clock')

    ok(clockOne !== -1 && alarmClock !== -1)
    ok(clockOne < alarmClock, 'expected clock-1 to rank above alarm-clock')
  })

  test('matches on a word inside the name', () => {
    ok(searchIconNames(ICON_NAMES, 'bishop').includes('chess-bishop'))
  })

  test('is case-insensitive', () => {
    deepStrictEqual(
      [...searchIconNames(ICON_NAMES, 'ROCKET')],
      [...searchIconNames(ICON_NAMES, 'rocket')],
    )
  })

  test('returns nothing for a query that matches nothing', () => {
    deepStrictEqual([...searchIconNames(ICON_NAMES, 'zzzznope')], [])
  })
})

describe('readAllowedIcons', () => {
  test('reads the option when present', () => {
    deepStrictEqual(readAllowedIcons({allowedIcons: ['rocket']}), ['rocket'])
  })

  test('tolerates anything a schema author might actually write', () => {
    strictEqual(readAllowedIcons(undefined), undefined)
    strictEqual(readAllowedIcons(null), undefined)
    strictEqual(readAllowedIcons('rocket'), undefined)
    strictEqual(readAllowedIcons({}), undefined)
    strictEqual(readAllowedIcons({allowedIcons: 'rocket'}), undefined)
  })

  test('drops non-string entries instead of passing them through', () => {
    deepStrictEqual(readAllowedIcons({allowedIcons: ['rocket', 42, null, 'zap']}), [
      'rocket',
      'zap',
    ])
  })
})
