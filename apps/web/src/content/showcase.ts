import { asset } from '../lib/asset'

export interface ShowcaseModel {
  name: string
  /** A .glb path or a built-in procedural model key. */
  model: string
  note: string
}

// Models in the hero panel, newest first. When Angela's .glb is exported,
// drop it in public/models and put her at the top of this list.
export const heroModels: ShowcaseModel[] = [
  { name: 'Vending Machine', model: asset('models/vending-machine.glb'), note: 'Modelled in Maya · drag to rotate' },
  { name: 'Street Corner', model: asset('models/street-corner.glb'), note: 'Diorama modelled in Maya · drag to rotate' },
]
