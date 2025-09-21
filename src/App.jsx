import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import About from './components/About.jsx';
import Experience from './components/Experience.jsx';
import Education from './components/Education.jsx';
import Projects from './components/Projects.jsx';
import Contact from './components/Contact.jsx';

const skills = [
  { name: 'Python', progress: '100%', level: 'Expert' },
  { name: 'C++ / C#', progress: '100%', level: 'Expert' },
  { name: 'Unity', progress: '70%', level: 'Advanced' },
  { name: 'WordPress', progress: '90%', level: 'Advanced' },
  { name: 'HTML', progress: '60%', level: 'Intermediate' },
];

function MonitorIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6" />
      <path d="M12 16v4" />
    </svg>
  );
}

function LeadershipIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l3 7H9l3-7Z" />
      <path d="M5 21h14l-1.5-7h-11L5 21Z" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

const experiences = [
  {
    title: 'Chief Programmer',
    company: '2D Escape Room Project',
    icon: MonitorIcon,
    highlights: [
      'Collaborated with a cross-functional team of eight to build a captivating top-down escape room game.',
      'Integrated APIs to deliver real-time data systems and smooth player experiences.',
      'Managed source control with GitHub, reviewed pull requests, and coached teammates on code quality.',
      'Led sprint planning with Kanbanchi boards and stand-ups to keep goals aligned and on schedule.',
    ],
  },
  {
    title: 'President of Class Council',
    company: 'Nishiyamato Japanese Academy',
    icon: LeadershipIcon,
    highlights: [
      'Partnered with teachers to raise assignment completion by roughly 20% compared to the previous semester.',
      'Spoke to an audience of 150+ students from grades 4–9 to kick off the academic year.',
      'Presented the opening oath at the annual school sports festival.',
    ],
  },
];

const schools = [
  {
    name: 'California Academy of Mathematics and Science',
    period: 'Aug 2022 – Present',
    gpa: '4.31',
    courses: ['AP Computer Science Principles', 'Intro to Web Development', 'AP Precalculus'],
  },
  {
    name: 'Nishiyamato Japanese Academy',
    period: 'Apr 2013 – Mar 2024',
  },
];

const projects = [
  {
    title: 'Project Carpe Diem',
    category: 'Game Development',
    status: 'In Progress',
    date: '2024',
    description:
      'A narrative-driven escape room adventure blending puzzle solving, exploration, and time-loop surprises.',
    image: '/images/intro-bg.jpg',
  },
  {
    title: 'Blackjack Simulator',
    category: 'Game Development',
    status: 'Released',
    date: 'Nov 2023',
    description:
      'A probability-focused blackjack experience built to teach friends the fundamentals of strategic card play.',
    image: '/images/work-2.jpg',
    link: 'https://replit.com/@NoahMatsukuma/125-Shall-We-Play-a-Game',
  },
];

function LocationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21c-4.8-4.8-8-8.4-8-12a8 8 0 0 1 16 0c0 3.6-3.2 7.2-8 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.36 12.6 12.6 0 0 0 4 0.64 1.5 1.5 0 0 1 1.5 1.5v3.1a1.5 1.5 0 0 1-1.5 1.5A18.5 18.5 0 0 1 2.25 5.25 1.5 1.5 0 0 1 3.75 3.75h3.1a1.5 1.5 0 0 1 1.5 1.5 12.6 12.6 0 0 0 0.64 4 1.5 1.5 0 0 1-.36 1.5l-2.03 2.05Z" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7.5 12 13l9-5.5" />
    </svg>
  );
}

const contact = [
  { label: 'Location', value: 'Los Angeles, CA 90503', icon: LocationIcon },
  { label: 'Phone', value: '(310) 245-2447', icon: PhoneIcon },
  { label: 'Email', value: 'noah.mtskm@gmail.com', icon: MailIcon },
];

export default function App() {
  return (
    <div className="relative min-h-screen bg-slate-950">
      <Navbar />
      <main className="space-y-24 pb-24">
        <Hero />
        <About skills={skills} />
        <Experience experiences={experiences} />
        <Education schools={schools} />
        <Projects projects={projects} />
        <Contact contact={contact} />
      </main>
    </div>
  );
}
