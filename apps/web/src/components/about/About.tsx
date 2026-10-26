import { aboutPhotos, education, experience, skills } from '../../content/about'
import { profile } from '../../content/profile'
import { Reveal } from '../ui/Reveal'
import { Tags } from '../ui/Tags'
import { PhotoStack } from './PhotoStack'

export function About() {
  return (
    <div className="about">
      <div className="about-top">
        <div className="about-bio">
          <Reveal className="about-person">
            <img src={profile.avatar} alt={`${profile.name} avatar`} className="avatar" />
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.location}</span>
            </div>
          </Reveal>
          {profile.bio.map((p, i) => (
            <Reveal key={i} as="p" delay={0.05 * i}>
              {p}
            </Reveal>
          ))}
          <Reveal className="skills">
            {skills.map((s) => (
              <div key={s.group} className="skill-group">
                <p>{s.group}</p>
                <Tags items={s.items} />
              </div>
            ))}
          </Reveal>
        </div>
        {aboutPhotos.length > 0 && <PhotoStack />}
      </div>
      <div className="about-cv">
        <div>
          <Reveal as="h3" className="cv-title">
            Experience
          </Reveal>
          {experience.map((e, i) => (
            <Reveal key={e.title} delay={0.05 * i} className="cv-item">
              <div className="cv-head">
                <h4>{e.title}</h4>
                <span>{e.org}</span>
              </div>
              <ul>
                {e.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <div>
          <Reveal as="h3" className="cv-title">
            Education
          </Reveal>
          {education.map((e, i) => (
            <Reveal key={e.school} delay={0.05 * i} className="cv-item">
              <div className="cv-head">
                <h4>{e.school}</h4>
                <span>{e.dates}</span>
              </div>
              {e.detail && <p className="cv-detail">{e.detail}</p>}
              {e.courses && <Tags items={e.courses} />}
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  )
}
