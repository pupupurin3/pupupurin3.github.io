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
  { group: 'Languages', items: ['Java', 'C#', 'C++', 'Python', 'TypeScript'] },
  { group: 'Frameworks & engines', items: ['React', 'Node.js', 'Three.js', 'Unity'] },
  { group: 'Tools', items: ['Maya', 'Arnold', 'Git & GitHub', 'Docker', 'Notion'] },
  { group: 'Spoken', items: ['English', 'Japanese'] },
]

export const experience: Experience[] = [
  {
    title: 'Web Development Intern',
    org: 'Anatano Kakehashi · Jun – Aug 2024',
    points: [
      'Worked on a React website that introduces students to programming courses and tutoring services.',
      'Updated the site\'s metadata so search engines describe the tutoring services properly.',
      'Co-wrote lecture slides for an introductory course that teaches programming through Minecraft.',
    ],
  },
  {
    title: 'Chief Programmer',
    org: 'Virtual Escape Room (C#, Unity) · Apr – Jun 2023',
    points: [
      'Led software development for an eight-person team building a 2D top-down escape room game.',
      'Integrated several APIs to bring real-time data into the game.',
      'Managed GitHub branches and reviewed pull requests before merging.',
      'Ran stand-ups and tracked assignments in Kanbanchi against project deadlines.',
    ],
  },
]

export const education: Education[] = [
  {
    school: 'El Camino College',
    dates: 'Fall 2026 – present',
    detail: 'Computer Science · GPA 4.0',
    courses: ['Intro to Computer Science (CSCI-1)', 'Calculus I'],
  },
  {
    school: 'California Academy of Mathematics and Science',
    dates: 'Graduated June 2026',
    detail: 'GPA 4.4',
    courses: ['AP Calculus BC', 'Intro to Web Development', 'Intro to Graphic Design'],
  },
  {
    school: 'Nishiyamato Japanese Academy of California',
    dates: 'Graduated March 2024',
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
