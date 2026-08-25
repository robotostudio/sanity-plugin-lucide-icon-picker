import {DynamicIcon, type IconName} from 'lucide-react/dynamic'

interface LucideGlyphProps {
  name: IconName
  size?: number
}

/**
 * Renders a single Lucide icon.
 *
 * `DynamicIcon` code-splits every glyph and renders nothing until its chunk resolves, so the
 * icon is wrapped in a box of the final size. Without it a grid of icons reflows as each one
 * arrives.
 */
export function LucideGlyph({name, size = 24}: LucideGlyphProps) {
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
      <DynamicIcon name={name} size={size} />
    </span>
  )
}
