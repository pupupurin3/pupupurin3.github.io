import { asset } from '../lib/asset'

// All of the site's text lives in src/content, so updating the portfolio
// never means touching a component. Projects live in packages/shared, since
// the API serves them too.

export const profile = {
  name: 'Noah Matsukuma',
  nameJa: '松隈 埜天',
  handle: 'Purin',
  roles: ['Game Developer', 'Programmer', '3D Modeller'],
  headline: 'Programmer and 3D artist building renderers, games and interactive worlds.',
  intro: "I'm a computer science student at El Camino College. I write renderers and games, model 3D characters and scenes, and build interactive things for the web.",
  heroImage: asset('img/hero-model.png'),
  heroPhoto: asset('img/hero-sunfaded.jpg'),
  heroPhotoTall: asset('img/hero-sunfaded-tall.jpg'),
  // Street corner diorama (exported from Maya as OBJ, converted to .glb).
  heroModel: asset('models/street-corner.glb'),
  avatar: asset('img/avatar.jpg'),
  email: 'noah.mtskm@gmail.com',
  github: 'https://github.com/pupupurin3',
  // TODO: Noah's LinkedIn profile URL. The LinkedIn icon only shows once this is set.
  linkedin: '',
  location: 'Los Angeles, CA',
  bio: [
    "Hi! I'm Noah, a computer science student at El Camino College in Torrance. I graduated from the California Academy of Mathematics and Science in June 2026, and I'm now studying full time while working 25 hours a week.",
    'Most of what I build sits where code meets graphics: RenderLab, a 3D renderer I wrote from scratch in Java; Obese Fat Gorilla Monkey, an online card game hub in Unity; and characters and scenes modelled in Maya and rendered in Arnold.',
    'Games are what got me into all of this. I grew up on the Nintendo 3DS with friends I still play with today, and I want to make things that leave that same kind of impression on someone else.',
  ],
}
