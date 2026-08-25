import {type IconName, iconNames} from 'lucide-react/dynamic'

/**
 * Every icon the picker can offer.
 *
 * This is Lucide's own list, used verbatim. It matters that it is the *same* list
 * `DynamicIcon` resolves names against: there is no name-building step here that could drift
 * from Lucide's spelling, so anything the picker offers is guaranteed to render.
 *
 * The list contains a handful of pairs that differ only in digit hyphenation and draw the same
 * glyph (`arrow-down-0-1` / `arrow-down-01`, `grid-2x2` / `grid-2-x-2`). Both spellings are
 * valid, and Lucide ships no metadata saying which is preferred, so both are kept.
 *
 * @public
 */
export const ICON_NAMES: readonly IconName[] = iconNames

const ICON_NAME_SET: ReadonlySet<string> = new Set<string>(iconNames)

/**
 * Whether a stored value is a name Lucide still recognises.
 *
 * @public
 */
export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && ICON_NAME_SET.has(value)
}

/**
 * Narrow the catalogue to a schema's `allowedIcons`, preserving catalogue order and silently
 * dropping entries Lucide does not know about.
 */
export function restrictToAllowed(allowed: readonly string[] | undefined): readonly IconName[] {
  if (!allowed || allowed.length === 0) {
    return ICON_NAMES
  }

  const wanted = new Set(allowed)

  return ICON_NAMES.filter((name) => wanted.has(name))
}

/**
 * Rank matches so the icon someone typed the name of comes first: exact, then name prefix,
 * then the start of any word, then anywhere in the name. Searching "clock" should surface
 * `clock` above `alarm-clock`.
 */
export function searchIconNames(names: readonly IconName[], query: string): readonly IconName[] {
  const term = query.trim().toLowerCase()

  if (!term) {
    return names
  }

  const exact: IconName[] = []
  const startsWithTerm: IconName[] = []
  const wordStartsWithTerm: IconName[] = []
  const containsTerm: IconName[] = []

  for (const name of names) {
    if (name === term) {
      exact.push(name)
    } else if (name.startsWith(term)) {
      startsWithTerm.push(name)
    } else if (name.split('-').some((word) => word.startsWith(term))) {
      wordStartsWithTerm.push(name)
    } else if (name.includes(term)) {
      containsTerm.push(name)
    }
  }

  return [...exact, ...startsWithTerm, ...wordStartsWithTerm, ...containsTerm]
}

/**
 * Read `allowedIcons` back off a schema type's options.
 *
 * Schema options are author-supplied and untyped, so this narrows defensively rather than
 * asserting a shape.
 */
export function readAllowedIcons(options: unknown): string[] | undefined {
  if (typeof options !== 'object' || options === null || !('allowedIcons' in options)) {
    return undefined
  }

  const {allowedIcons} = options

  if (!Array.isArray(allowedIcons)) {
    return undefined
  }

  return allowedIcons.filter((icon): icon is string => typeof icon === 'string')
}
