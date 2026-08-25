# @robotostudio/sanity-plugin-lucide-icon-picker

Pick and preview [Lucide](https://lucide.dev) icons in Sanity Studio v6. All 2,035 icons,
searchable, with each glyph loaded on demand rather than bundled into the Studio.

## Install

```sh
pnpm add @robotostudio/sanity-plugin-lucide-icon-picker
```

Requires Sanity Studio v6, React 19.2+, and Node 20.19+ / 22.12+.

## Usage

```ts
// sanity.config.ts
import {defineConfig} from 'sanity'
import {lucideIconPicker} from '@robotostudio/sanity-plugin-lucide-icon-picker'

export default defineConfig({
  // ...
  plugins: [lucideIconPicker()],
})
```

```ts
// schemas/myDocument.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'myDocument',
  type: 'document',
  fields: [
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'lucide-icon',
    }),
  ],
})
```

The field stores Lucide's own kebab-case name — `'arrow-right'`, `'clock-1'`, `'grid-2x2'`.

### Restricting the choices

```ts
defineField({
  name: 'icon',
  title: 'Feature icon',
  type: 'lucide-icon',
  options: {
    allowedIcons: ['rocket', 'shield-check', 'zap', 'sparkles'],
  },
})
```

Names that Lucide does not recognise are ignored rather than shown as broken entries.

## Rendering on the frontend

Because the stored value is Lucide's own name, it goes straight into `DynamicIcon`:

```tsx
import {DynamicIcon} from 'lucide-react/dynamic'

export function Feature({icon}: {icon: string}) {
  return <DynamicIcon name={icon} size={24} />
}
```

If you prefer to fail loudly on unknown values, the plugin exports a guard and the full list:

```ts
import {ICON_NAMES, isIconName} from '@robotostudio/sanity-plugin-lucide-icon-picker'
```

## How it works

The catalogue is `iconNames` from `lucide-react/dynamic` — used verbatim, with no name
building of our own. That matters: it is the same list `DynamicIcon` resolves against, so
every name the picker offers is guaranteed to render, and there is no conversion step that can
drift from Lucide's spelling.

Glyphs are fetched per icon as you scroll, in windows of 120. Only the icons you actually look
at are downloaded (~364 bytes each) instead of shipping all 2,035 in the Studio bundle.

One wrinkle worth knowing: Lucide's list contains a few pairs that differ only in digit
hyphenation and draw the same glyph — `arrow-down-0-1` / `arrow-down-01`, `grid-2x2` /
`grid-2-x-2`, `axis-3d` / `axis-3-d`. Both spellings are valid and Lucide ships no metadata
saying which is preferred, so the picker lists both.

## Keyboard

The picker is fully operable without a mouse. Tab reaches the grid as a single stop, the arrow
keys move in two dimensions, Home and End jump to the ends of the result set, Enter or Space
selects, and Escape closes. Arrow-down from the search field drops straight into the grid, and
focus returns to the field when the dialog closes.

## Development

```sh
pnpm test     # node --test
pnpm lint     # oxlint
pnpm build    # verify-package + pkg-utils
```

## Migrating from `sanity-plugin-lucide-icon-picker`

If you are moving off the unmaintained community plugin, **check your content first**. That
plugin built its icon names from Lucide's PascalCase component names using a rule that never
inserted a separator before a digit, so it stored `clock1`, `heading2`, `grid2x2`, `axis3d`
where Lucide's names are `clock-1`, `heading-2`, `grid-2x2`, `axis-3d`. 153 names are affected
and none of them resolve in `lucide-react` — including through that plugin's own recommended
`DynamicIcon` usage.

This plugin shows any such value as a `not found` card so it is visible rather than silently
blank, and picking a replacement fixes it.

To find and fix them in bulk:

```sh
# 1. Print a GROQ query listing affected documents — run it in Vision
node scripts/find-legacy-icons.mjs

# 2. Save the Vision result as documents.json, then generate patch commands
node scripts/find-legacy-icons.mjs --patch documents.json

# See the full 153-entry mapping
node scripts/find-legacy-icons.mjs --map
```

Note that the older plugin was built against `lucide-react` 0.x, which still had Lucide's brand
icons. Lucide v1 removed them, so values like `github`, `facebook` and `slack` have no
replacement and need re-picking.

## Prior art

The community plugin [`sanity-plugin-lucide-icon-picker`](https://github.com/contentwrap/sanity-plugin-lucide-icon-picker)
by [ContentWrap](https://contentwrap.io) was the baseline for this one — it is what we used
before it stopped being maintained, and it is the reason we knew we wanted this field type at
all. This package is an independent implementation rather than a fork: it takes a different
approach to the icon catalogue, the picker UI and rendering. Credit to them for the original.

## License

MIT © Roboto Studio
