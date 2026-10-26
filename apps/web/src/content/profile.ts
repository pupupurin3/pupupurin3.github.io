import { asset } from '../lib/asset'

// All of the site's text lives in src/content, so updating the portfolio
// never means touching a component. Projects live in packages/shared, since
// the API serves them too.

export const profile = {
  name: 'Noah Matsukuma',
  nameJa: '松隈 埜天',
  handle: 'Purin',
  roles: ['Game Developer', 'Programmer', '3D Modeller'],
  headline: 'Game developer and 3D artist building interactive worlds.',
  intro: "I'm a high school student at the California Academy of Mathematics and Science. I make games, model 3D scenes and build interactive things for the web.",
  heroImage: asset('img/hero-model.png'),
  heroPhoto: asset('img/hero-sunfaded.jpg'),
  heroPhotoTall: asset('img/hero-sunfaded-tall.jpg'),
  // Live model in the Lab gallery (exported from Maya as OBJ, converted to .glb).
  heroModel: asset('models/street-corner.glb'),
  avatar: asset('img/avatar.jpg'),
  email: 'noah.mtskm@gmail.com',
  github: 'https://github.com/pupupurin3',
  location: 'Los Angeles, CA',
  bio: [
    "Hi! I'm Noah, a high school student who is very invested in video games. I'm currently building my own game, which I hope to publish.",
    'Many games got me into gaming, but the one that left the biggest impact was the Nintendo 3DS. It let me spend most of my childhood with good friends I still play with today.',
    'I hope that one day, if I am ever lucky enough to work as a game developer at Nintendo, I can leave the same kind of impact on other children that Nintendo left on me.',
  ],
}
