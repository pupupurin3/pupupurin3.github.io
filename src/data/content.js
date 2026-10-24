// All of the site's text lives here, so updating the portfolio never means
// touching a component. Blurbs followed by `// TODO` were written from the
// repo name only and should be replaced with a real description.

// Public files are referenced through the build's base URL, so the site also
// works when served from a sub-path (e.g. a preview host).
const asset = (path) => import.meta.env.BASE_URL + path

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
  // Live model in the header (exported from Maya as OBJ, converted to .glb).
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

export const skills = [
  { group: 'Languages', items: ['Python', 'C++', 'C#', 'HTML'] },
  { group: 'Engines & tools', items: ['Unity', 'WordPress', 'GitHub'] },
  { group: 'Craft', items: ['Game design', '3D modelling', 'Team leadership'] },
]

export const experience = [
  {
    title: 'Chief Programmer',
    org: '2D top-down escape room game',
    points: [
      'Collaborated in a cross-functional team of 8 to develop a captivating 2D top-down escape room video game.',
      'Used various APIs to build a real-time data system for a seamless, immersive experience.',
      'Managed branches, reviewed pull requests and ran code reviews on GitHub to keep code quality high.',
      'Organized team tasks in Kanbanchi and ran stand-up meetings to keep the project on schedule.',
    ],
  },
  {
    title: 'President of Class Council',
    org: 'Nishiyamato Japanese Academy',
    points: [
      'Worked with teachers to help students submit assignments, raising submissions by about 20% over the previous semester.',
      'Gave the opening speech of the school year to over 150 students from 4th to 9th grade.',
      'Read the Starting Oath of the annual sporting event.',
    ],
  },
]

export const education = [
  {
    school: 'California Academy of Mathematics and Science',
    dates: 'Aug 2022 - Present',
    detail: 'GPA 4.31',
    courses: ['AP Computer Science Principles', 'Intro to Web Development', 'AP Precalculus'],
  },
  {
    school: 'Nishiyamato Japanese Academy',
    dates: 'Apr 2013 - Mar 2024',
  },
]

// Categories drive the filter tabs in the Projects section.
// Photos for the sticker stack in About. Edit captions and alt text here;
// drop new images into public/img/ and add them to the list.
// Cut-out photos: a transparent PNG of the people plus a rough polygon (clip
// path) for the paper-cut backing behind them. `w` and `h` are the image size.
export const aboutPhotos = [
  { src: asset('img/cut-beach.webp'), w: 640, h: 442, backing: 'polygon(17.2% 14.8%, 21.4% 50.9%, 0.0% 99.8%, 99.9% 99.8%, 99.9% 44.3%, 84.3% 21.3%, 54.1% 13.4%, 46.4% 37.5%, 38.2% 9.2%)', alt: 'Three friends posing with a hand under the chin on a boardwalk leading to the beach', caption: 'Beach day' },
  // Underwater shot: kept whole (a cut-out would lose the divers), torn to a rough shape instead.
  { src: asset('img/about-diving.jpg'), w: 900, h: 675, clip: 'polygon(4% 10%, 36% 5%, 68% 9%, 96% 5%, 97% 46%, 93% 94%, 56% 91%, 21% 95%, 4% 85%, 7% 50%)', backing: 'polygon(1% 7%, 36% 0%, 69% 5%, 99% 0%, 100% 48%, 97% 100%, 56% 96%, 20% 100%, 0% 88%, 3% 50%)', alt: 'Three scuba divers posing underwater above a coral reef', caption: 'Scuba diving' },
  { src: asset('img/cut-tokyo.webp'), w: 640, h: 604, backing: 'polygon(64.2% 9.0%, 40.9% 9.2%, 30.7% 40.7%, 0.0% 43.6%, 0.0% 99.8%, 84.3% 99.8%, 93.8% 51.6%, 62.7% 53.1%, 72.7% 26.0%)', alt: 'Smiling and holding up a peace sign in front of a giant white Gundam statue', caption: 'Gundam, Tokyo' },
]

export const categories = ['All', 'Games', 'Simulations', 'Apps', '3D']

// `model` (optional) opens an interactive 3D viewer in the project popup.
// It is either a built-in procedural model key ('purin', 'mars', 'maze')
// or a path to a .glb file you drop into /public/models.
export const projects = [
  {
    title: 'Carpe Diem',
    featured: true,
    category: 'Games',
    status: 'In progress',
    image: asset('img/carpe-diem.jpg'),
    color: '#3b5b7a',
    tags: ['Game Dev', 'Pixel Art'],
    blurb: 'My original game, currently in development.',
  },
  {
    title: 'Blackjack Simulator',
    featured: true,
    category: 'Games',
    status: 'Nov 2023',
    image: asset('img/blackjack.jpg'),
    color: '#1f7a3a',
    tags: ['Python'],
    blurb: 'A playable blackjack game with hit and stand controls.',
    links: [{ label: 'Play on Replit', url: 'https://replit.com/@NoahMatsukuma/125-Shall-We-Play-a-Game' }],
  },
  {
    title: 'Virtual Escape Room',
    featured: true,
    category: 'Games',
    color: '#5b3b7a',
    tags: ['Team project', 'Game Dev'],
    blurb: 'The 2D top-down escape room game I built as Chief Programmer with a team of 8.',
    repo: 'Project_VirtualEscapeRoom',
  },
  {
    title: 'Hanafuda',
    featured: true,
    category: 'Games',
    color: '#b23a48',
    tags: ['Card game'],
    blurb: 'A take on the traditional Japanese Hanafuda card game.', // TODO
    repo: 'Hanafuda',
  },
  {
    title: 'Coup Web App',
    category: 'Games',
    color: '#7a5b3b',
    tags: ['Web', 'Card game'],
    blurb: 'A web version of the card game Coup.', // TODO
    repo: 'Project_CoupWebApp',
  },
  {
    title: 'TetOis',
    category: 'Games',
    color: '#3b7a74',
    tags: ['Puzzle'],
    blurb: 'A falling-block puzzle game.', // TODO
    repo: 'Project_TetOis',
  },
  {
    title: 'Minesweeper',
    category: 'Games',
    color: '#596273',
    tags: ['Puzzle'],
    blurb: 'A recreation of classic Minesweeper.', // TODO
    repo: 'Project_Minesweeper',
  },
  {
    title: 'Pancake Stacker',
    category: 'Games',
    color: '#c58a3a',
    tags: ['Arcade'],
    blurb: 'A pancake stacking game.', // TODO
    repo: 'Project_PancakeStacker',
  },
  {
    title: 'Fluid Simulation',
    category: 'Simulations',
    color: '#2f6fb0',
    tags: ['Physics', 'Simulation'],
    blurb: 'A fluid simulation.', // TODO
    repo: 'Project_FluidSim',
  },
  {
    title: 'Mars Simulation',
    featured: true,
    category: 'Simulations',
    color: '#b5532f',
    tags: ['Simulation', '3D'],
    blurb: 'A simulation set on Mars.', // TODO
    repo: 'Project_MarsSimulation',
    model: 'mars',
  },
  {
    title: 'Fractal Visualizer',
    category: 'Simulations',
    color: '#6b3bb5',
    tags: ['Math', 'Graphics'],
    blurb: 'An interactive fractal visualizer.', // TODO
    repo: 'Project_FractalVisualizer',
  },
  {
    title: '3D Maze Maker',
    featured: true,
    category: '3D',
    color: '#2f8f6f',
    tags: ['3D', 'Procedural'],
    blurb: 'A tool that generates 3D mazes.', // TODO
    repo: 'Project_3DMazeMaker',
    model: 'maze',
  },
  {
    title: 'Student Manager App',
    category: 'Apps',
    color: '#3b4f7a',
    tags: ['App'],
    blurb: 'An app for managing student records.', // TODO
    repo: 'Project_StudentManagerApp',
  },
  {
    title: 'Number Riddle',
    category: 'Apps',
    color: '#7a3b5b',
    tags: ['Logic'],
    blurb: 'A number riddle game.', // TODO
    repo: 'Project_NumberRiddle',
  },
]

// Models shown in the 3D Gallery. Add your own by exporting a .glb from
// Blender into /public/models and adding { name, model: '/models/x.glb' }.
export const gallery = [
  { name: 'Street Corner', model: profile.heroModel, note: 'Diorama modelled in Maya' },
  { name: 'Purin', model: 'purin', note: 'Voxel pudding mascot' },
  { name: 'Mars Terrain', model: 'mars', note: 'Procedural low-poly terrain' },
  { name: 'Maze', model: 'maze', note: 'Generated 3D maze' },
]
