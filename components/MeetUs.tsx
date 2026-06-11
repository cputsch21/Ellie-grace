export default function MeetUs() {
  return (
    <section className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl rounded-5xl bg-gradient-to-br from-grape-50 via-white to-bubblegum-50 p-8 text-center shadow-card ring-1 ring-white sm:p-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-grape-500 shadow-card">
          <span aria-hidden>💕</span> Meet the makers
        </span>
        <h2 className="mt-5 text-3xl font-bold text-slate-800 sm:text-4xl">
          Ellie &amp; Grace
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
          We&rsquo;re two cousins who love pink, yellow, purple &amp; blue
          &mdash; plus rainbows, hearts, and flowers. We make every bracelet,
          keychain, choker &amp; ring by hand, and we&rsquo;re saving up for a
          big dream: building a real business of our own one day.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-700">
          Thanks for helping two little entrepreneurs on their way! 🌈
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {["🌈 Rainbows", "💗 Hearts", "🌸 Flowers", "🐾 Pets"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-600 shadow-sm"
            >
              {t}
            </span>
          ))}
        </div>

        <a
          href="#order"
          className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-grape-500 px-7 py-3.5 text-base font-extrabold text-white shadow-lift transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-grape-600"
        >
          Order some sparkle <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
