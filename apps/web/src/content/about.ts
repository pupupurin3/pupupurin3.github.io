import { asset } from '../lib/asset'

export interface SkillGroup {
  group: string
  items: string[]
}

export interface Experience {
  title: string
  org: string
  points: string[]
}

export interface Education {
  school: string
  dates: string
  detail?: string
  courses?: string[]
}

export interface AboutPhoto {
  src: string
  /** Natural image size, for the aspect ratio. */
  w: number
  h: number
  /** Clip path for the photo itself (cut-outs are transparent PNGs instead). */
  clip?: string
  /** Rough polygon for the paper-cut backing behind the photo. */
  backing: string
  alt: string
  caption: string
}

export const skills: SkillGroup[] = [
  { group: 'Languages', items: ['Python', 'C++', 'C#', 'HTML'] },
  { group: 'Engines & tools', items: ['Unity', 'WordPress', 'GitHub'] },
  { group: 'Craft', items: ['Game design', '3D modelling', 'Team leadership'] },
]

export const experience: Experience[] = [
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

export const education: Education[] = [
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

// Photos for the sticker stack in About. Drop new images into public/img/
// and add them here.
export const aboutPhotos: AboutPhoto[] = [
  { src: asset('img/cut-beach.webp'), w: 640, h: 442, backing: 'polygon(17.2% 14.8%, 21.4% 50.9%, 0.0% 99.8%, 99.9% 99.8%, 99.9% 44.3%, 84.3% 21.3%, 54.1% 13.4%, 46.4% 37.5%, 38.2% 9.2%)', alt: 'Three friends posing with a hand under the chin on a boardwalk leading to the beach', caption: 'Beach day' },
  // Underwater shot: kept whole (a cut-out would lose the divers), torn to a rough shape instead.
  { src: asset('img/about-diving.jpg'), w: 900, h: 675, clip: 'polygon(4% 10%, 36% 5%, 68% 9%, 96% 5%, 97% 46%, 93% 94%, 56% 91%, 21% 95%, 4% 85%, 7% 50%)', backing: 'polygon(1% 7%, 36% 0%, 69% 5%, 99% 0%, 100% 48%, 97% 100%, 56% 96%, 20% 100%, 0% 88%, 3% 50%)', alt: 'Three scuba divers posing underwater above a coral reef', caption: 'Scuba diving' },
  { src: asset('img/cut-tokyo.webp'), w: 640, h: 604, backing: 'polygon(64.2% 9.0%, 40.9% 9.2%, 30.7% 40.7%, 0.0% 43.6%, 0.0% 99.8%, 84.3% 99.8%, 93.8% 51.6%, 62.7% 53.1%, 72.7% 26.0%)', alt: 'Smiling and holding up a peace sign in front of a giant white Gundam statue', caption: 'Gundam, Tokyo' },
]
