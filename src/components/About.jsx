export default function About({ skills }) {
  return (
    <section id="about" className="relative py-24">
      <div className="container-responsive grid gap-12 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl shadow-slate-950/50">
          <div className="flex flex-col gap-8 sm:flex-row">
            <div className="mx-auto w-40 shrink-0 overflow-hidden rounded-3xl border border-slate-700 shadow-lg">
              <img
                src="/images/profile.jpg"
                alt="Portrait of Noah Matsukuma"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Profile</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Noah Matsukuma</h2>
                <p className="text-slate-300">Student &amp; Emerging Game Developer</p>
              </div>
              <dl className="grid grid-cols-1 gap-3 text-slate-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Email</dt>
                  <dd className="font-medium text-white">noah.mtskm@gmail.com</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.3em] text-slate-400">Phone</dt>
                  <dd className="font-medium text-white">(310) 245-2447</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-200">Core Skills</h3>
            <ul className="mt-6 space-y-5">
              {skills.map((skill) => (
                <li key={skill.name}>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-200">
                    <span>{skill.name}</span>
                    <span className="text-xs uppercase tracking-wider text-slate-400">{skill.level}</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-200"
                      style={{ width: skill.progress }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col justify-center space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.6em] text-sky-200">About Me</p>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Game development with heart</h2>
            <p className="mt-6 text-base leading-relaxed text-slate-300">
              Hi! I'm Noah, a high school student who lives and breathes video games. I recently started building my own
              projects and am currently developing a top-down escape room adventure that blends storytelling, puzzle
              solving, and a dash of chaos.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              The Nintendo 3DS had the biggest impact on me growing up—it connected me with lifelong friends and showed me
              the power of interactive worlds. My goal is to join Nintendo one day and craft experiences that inspire the
              next generation the same way those games shaped me.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <p className="text-3xl font-semibold text-white">2+</p>
              <p className="mt-2 text-xs uppercase tracking-[0.4em] text-slate-400">Years of coding</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-center">
              <p className="text-3xl font-semibold text-white">8</p>
              <p className="mt-2 text-xs uppercase tracking-[0.4em] text-slate-400">Team collaborators</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
