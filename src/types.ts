import type {IconName} from 'lucide-react/dynamic.js'

/**
 * Options accepted by the `lucide-icon` schema type.
 *
 * @public
 */
export interface LucideIconPickerOptions {
  /**
   * Restrict the picker to these icon names. Names are matched against Lucide's own
   * kebab-case spelling (`'arrow-right'`, `'clock-1'`); anything unrecognised is ignored.
   */
  allowedIcons?: string[]
}

/**
 * The value stored in a `lucide-icon` field: a Lucide icon name.
 *
 * This is Lucide's own `IconName` union rather than a bare `string`, so a typo is a type
 * error rather than an icon that silently fails to render.
 *
 * @public
 */
export type LucideIconPickerValue = IconName

export type {IconName}
