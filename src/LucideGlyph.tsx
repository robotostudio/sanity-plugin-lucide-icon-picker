import {type DynamicIconModule, type IconName, dynamicIconImports} from 'lucide-react/dynamic.js'
import {useEffect, useState} from 'react'

type IconNode = DynamicIconModule['__iconNode']

/**
 * Narrowed once, so the rest of the file is not working against a 2,000-member union of
 * per-icon import thunks.
 */
const loaders: Record<string, () => Promise<DynamicIconModule>> = dynamicIconImports

/**
 * Resolved icon geometry, kept for the lifetime of the page.
 *
 * Lucide's own `DynamicIcon` holds this in per-instance state and fetches it in an effect, so
 * closing the picker throws it all away. Reopening then repaints every cell from blank — about
 * 250ms of empty grid even when every chunk is already in the module cache, because the cache
 * saves the network round trip but not the render. Reading the geometry from here during render
 * lets an icon that has been seen once paint on the very first frame.
 */
const geometry = new Map<string, IconNode>()

/** Lucide's own SVG defaults, matched so these render identically to `DynamicIcon`. */
const SVG_ATTRIBUTES = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

interface LucideGlyphProps {
  name: IconName
  size?: number
}

/**
 * Renders a single Lucide icon, fetching its geometry the first time it is needed.
 *
 * Deliberately does not import from the `lucide-react` root: that barrel pulls in all ~2,000
 * icon components, which is exactly what loading them on demand is meant to avoid.
 */
export function LucideGlyph({name, size = 24}: LucideGlyphProps) {
  // The cache is the source of truth; this only re-renders once a fetch fills it in.
  const [, setLoadCount] = useState(0)
  const iconNode = geometry.get(name)

  useEffect(() => {
    if (geometry.has(name)) {
      return undefined
    }

    let active = true

    void (async () => {
      try {
        const module = await loaders[name]?.()

        if (module) {
          geometry.set(name, module.__iconNode)

          if (active) {
            setLoadCount((count) => count + 1)
          }
        }
      } catch {
        // A name in the catalogue that fails to load leaves an empty box rather than taking
        // the whole form down.
      }
    })()

    return () => {
      active = false
    }
  }, [name])

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        width: size,
        height: size,
      }}
    >
      {iconNode ? (
        <svg {...SVG_ATTRIBUTES} width={size} height={size}>
          {/* Lucide ships a stable `key` on every geometry node; it must be passed directly
              rather than spread, or React takes it from the spread and warns. */}
          {iconNode.map(([Tag, {key, ...attributes}]) => (
            <Tag key={key} {...attributes} />
          ))}
        </svg>
      ) : null}
    </span>
  )
}
