import { useState } from 'react';

const sections = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About Me' },
  { href: '#experience', label: 'Experiences' },
  { href: '#education', label: 'Education' },
  { href: '#projects', label: 'Projects' },
  { href: '#contact', label: 'Contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <nav className="container-responsive flex items-center justify-between py-4">
        <a href="#home" className="text-lg font-semibold uppercase tracking-[0.4em] text-slate-100">
          Portfolio
        </a>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-slate-200 transition hover:bg-slate-800 sm:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          <span className="sr-only">Toggle navigation</span>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
        <ul className="hidden items-center gap-8 text-sm font-medium uppercase tracking-widest text-slate-200 sm:flex">
          {sections.map((item) => (
            <li key={item.href}>
              <a className="relative py-2 transition hover:text-primary" href={item.href}>
                {item.label}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 bg-primary transition-all duration-300 group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950 sm:hidden">
          <ul className="container-responsive space-y-2 py-4 text-sm font-medium uppercase tracking-widest text-slate-200">
            {sections.map((item) => (
              <li key={item.href}>
                <a
                  className="block rounded-md px-3 py-2 transition hover:bg-slate-800/70 hover:text-primary"
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
