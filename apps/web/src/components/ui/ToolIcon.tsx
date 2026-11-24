import { siAutodeskmaya, siBlender, siThreedotjs, siUnity, type SimpleIcon } from 'simple-icons'
import type { Tool } from '../../content/showcase'

const ICONS: Record<Tool, { icon: SimpleIcon; label: string }> = {
  maya: { icon: siAutodeskmaya, label: 'Autodesk Maya' },
  blender: { icon: siBlender, label: 'Blender' },
  three: { icon: siThreedotjs, label: 'Three.js' },
  unity: { icon: siUnity, label: 'Unity' },
}

/** The logo of a program, in its brand colour (or ink when that's white or black). */
export function ToolIcon({ tool, size = 22 }: { tool: Tool; size?: number }) {
  const { icon, label } = ICONS[tool]
  const fill = /^(000000|FFFFFF)$/i.test(icon.hex) ? 'currentColor' : `#${icon.hex}`
  return (
    <svg className="tool-icon" role="img" aria-label={label} viewBox="0 0 24 24" width={size} height={size}>
      <title>{label}</title>
      <path d={icon.path} fill={fill} />
    </svg>
  )
}
