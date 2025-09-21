export default function Projects({ projects }) {
  return (
    <section id="projects" className="relative py-24">
      <div className="container-responsive">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.6em] text-sky-200">Projects</p>
          <h2 className="mt-4 section-title text-white">Shipped &amp; in-progress work</h2>
          <p className="section-subtitle mx-auto">
            Game prototypes and interactive experiences that explore storytelling, data, and play.
          </p>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.title}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-slate-950/40 transition duration-500 hover:-translate-y-1 hover:border-sky-400/60"
            >
              <div className="relative overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-6 top-6 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">
                  {project.status}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-sky-300">{project.category}</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{project.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{project.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs uppercase tracking-[0.4em] text-slate-400">
                  <span>{project.date}</span>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 px-4 py-2 text-sky-200 transition hover:bg-sky-400/10"
                    >
                      Visit project
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                        <path d="M12.293 3.293a1 1 0 0 1 1.414 0l4 4a1 1 0 0 1-1.414 1.414L14 6.414V15a1 1 0 1 1-2 0V6.414l-2.293 2.293A1 1 0 0 1 8.293 7.293l4-4Z" />
                        <path d="M5 4a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3a1 1 0 1 0-2 0v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 1 0 0-2H5Z" />
                      </svg>
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
