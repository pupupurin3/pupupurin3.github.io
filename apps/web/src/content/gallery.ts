import { profile } from './profile'

export interface GalleryModel {
  name: string
  /** A built-in model key or a .glb URL. */
  model: string
  note: string
}

// Models shown in the Lab's model viewer. Export a .glb into public/models
// and add { name, model: asset('models/x.glb'), note }.
export const gallery: GalleryModel[] = [
  { name: 'Street Corner', model: profile.heroModel, note: 'Diorama modelled in Maya' },
  { name: 'Purin', model: 'purin', note: 'Voxel pudding mascot' },
  { name: 'Mars Terrain', model: 'mars', note: 'Procedural low-poly terrain' },
  { name: 'Maze', model: 'maze', note: 'Generated 3D maze' },
]
