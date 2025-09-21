export default function Experience({ experiences }) {
  return (
    <section id="experience" className="relative border-y border-slate-800 bg-slate-950/70 py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-transparent" aria-hidden />
      <div className="container-responsive relative">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.6em] text-sky-200">Experience</p>
          <h2 className="mt-4 section-title text-white">Where I've been learning</h2>
          <p className="section-subtitle mx-auto">
            Collaborating, shipping, and leading teams to bring interactive ideas to life.
          </p>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {experiences.map((experience) => {
            const Icon = experience.icon;
            return (
              <article
                key={experience.title}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/50 p-8 shadow-lg shadow-slate-950/40 transition duration-500 hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-sky-900/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                    <Icon className="h-7 w-7" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{experience.title}</h3>
                    <p className="text-sm uppercase tracking-[0.4em] text-slate-400">{experience.company}</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-4 text-sm leading-relaxed text-slate-300">
                  {experience.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-sky-400" aria-hidden />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
