export default function Contact({ contact }) {
  return (
    <section id="contact" className="relative overflow-hidden bg-footer-pattern bg-cover bg-center py-24">
      <div className="absolute inset-0 bg-slate-950/85" aria-hidden />
      <div className="container-responsive relative">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/80 bg-slate-900/70 p-12 text-center shadow-2xl shadow-slate-950/50">
          <p className="text-sm uppercase tracking-[0.6em] text-sky-200">Get in touch</p>
          <h2 className="mt-4 section-title text-white">Let's build something joyful</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            I'm always excited to talk about games, design, and collaborative projects. Reach out and let's create
            meaningful play experiences together.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-slate-200">
            {contact.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label} className="flex items-center justify-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-base font-medium">{item.value}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-10 flex justify-center gap-4 text-slate-300">
            {['Facebook', 'Instagram', 'Twitter', 'Pinterest'].map((label) => (
              <span
                key={label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-400/40 text-sm uppercase tracking-[0.4em] text-sky-200"
              >
                {label[0]}
              </span>
            ))}
          </div>
          <p className="mt-12 text-xs uppercase tracking-[0.4em] text-slate-500">
            &copy; {new Date().getFullYear()} Noah Matsukuma. Inspired by the original DevFolio design.
          </p>
        </div>
      </div>
    </section>
  );
}
