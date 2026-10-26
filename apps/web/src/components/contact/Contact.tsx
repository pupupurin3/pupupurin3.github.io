import { profile } from '../../content/profile'
import type { ShowToast } from '../../hooks/useToast'
import { apiEnabled } from '../../lib/api'
import { copyText } from '../../lib/platform'
import { Reveal } from '../ui/Reveal'
import { ContactForm } from './ContactForm'
import { Guestbook } from './Guestbook'

export function Contact({ onToast }: { onToast: ShowToast }) {
  const copy = async () => onToast((await copyText(profile.email)) ? 'Email copied' : profile.email)
  return (
    <div className="contact">
      <Reveal as="h2" className="contact-title">
        Let’s build something together.
      </Reveal>
      <Reveal as="p" delay={0.08} className="section-lede">
        Open to collaborations, game jams and internships. The fastest way to reach me is email.
      </Reveal>
      <Reveal delay={0.12} className="links">
        <a className="btn primary" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <button className="btn" onClick={copy}>
          Copy email
        </button>
        <a className="btn" href={profile.github} target="_blank" rel="noreferrer">
          GitHub ↗
        </a>
      </Reveal>
      {/* Both need the API; without it the section is just the links above. */}
      {apiEnabled && (
        <Reveal delay={0.16} className="contact-grid">
          <ContactForm />
          <Guestbook />
        </Reveal>
      )}
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>Built with React, Three.js and Framer Motion{apiEnabled ? ', on a Cloudflare Workers + D1 API' : ''}</span>
      </footer>
    </div>
  )
}
