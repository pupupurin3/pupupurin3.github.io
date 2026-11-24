import { asset } from '../lib/asset'

export type Tool = 'maya' | 'blender' | 'three' | 'unity'

export interface ShowcaseModel {
  name: string
  /** A .glb path or a built-in procedural model key. */
  model: string
  /** When it was made, shown as written (e.g. "Oct 2026"). */
  date?: string
  /** Programs used, shown as their icons. */
  tools: Tool[]
}

// The models the hero scrolls through, in order. To add one, export a .glb
// into public/models and add an entry here (Angela goes at the top once her
// export is in).
export const heroModels: ShowcaseModel[] = [
  { name: 'Street Corner', model: asset('models/street-corner.glb'), date: undefined, tools: ['maya'] }, // TODO: date
  { name: 'Mars Terrain', model: 'mars', date: undefined, tools: ['three'] }, // TODO: date
  { name: '3D Maze', model: 'maze', date: undefined, tools: ['three'] }, // TODO: date
]
