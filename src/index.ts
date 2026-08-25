import {definePlugin, defineType} from 'sanity'

import {LucideIconInput} from './LucideIconInput'

export {ICON_NAMES, isIconName} from './icons'
export type {IconName, LucideIconPickerOptions, LucideIconPickerValue} from './types'

/**
 * The `lucide-icon` schema type: a string field whose value is a Lucide icon name.
 *
 * @public
 */
export const lucideIconType = defineType({
  title: 'Lucide Icon',
  name: 'lucide-icon',
  type: 'string',
  components: {input: LucideIconInput},
})

/**
 * Registers the `lucide-icon` schema type.
 *
 * @public
 */
export const lucideIconPicker = definePlugin(() => ({
  name: '@robotostudio/sanity-plugin-lucide-icon-picker',
  schema: {
    types: [lucideIconType],
  },
}))
