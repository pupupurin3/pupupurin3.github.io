export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-pattern bg-cover bg-center"
    >
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="relative z-10 container-responsive flex flex-col items-center text-center">
        <p className="text-sm uppercase tracking-[0.6em] text-sky-200">Purin1522</p>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">Noah Matsukuma</h1>
        <p className="mt-4 font-display text-base uppercase tracking-[0.4em] text-slate-200 sm:text-lg">
          Game Developer &amp; Student
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm font-medium uppercase tracking-widest">
          <a
            href="#projects"
            className="rounded-full bg-primary px-6 py-3 text-slate-950 shadow-lg shadow-sky-500/40 transition hover:bg-sky-300"
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="rounded-full border border-sky-400/40 px-6 py-3 text-sky-200 transition hover:bg-sky-400/10"
          >
            Contact Me
          </a>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950" />
    </section>
  );
}
