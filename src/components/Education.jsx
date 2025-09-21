export default function Education({ schools }) {
  return (
    <section id="education" className="relative overflow-hidden bg-education-pattern bg-cover bg-center py-24">
      <div className="absolute inset-0 bg-slate-950/85" aria-hidden />
      <div className="container-responsive relative">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.6em] text-sky-200">Education</p>
          <h2 className="mt-4 section-title text-white">Learning foundations</h2>
          <p className="section-subtitle mx-auto">
            Rigorous academics and passion projects that fuel my creativity and technical growth.
          </p>
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          {schools.map((school) => (
            <article
              key={school.name}
              className="rounded-3xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.3em] text-slate-400">
                <span>{school.period}</span>
                {school.gpa ? <span>GPA: {school.gpa}</span> : null}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{school.name}</h3>
              {school.subtitle ? <p className="mt-1 text-sm text-slate-300">{school.subtitle}</p> : null}
              {school.courses?.length ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.4em] text-sky-300">Relevant coursework</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200">
                    {school.courses.map((course) => (
                      <li key={course} className="flex items-start gap-3">
                        <span className="mt-2 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" aria-hidden />
                        <span>{course}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
