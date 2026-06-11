// The big picture at the top of the page.
// When the cartoon of the girls is ready, drop the file into the `public`
// folder and change the line below to its name (for example "/hero.png").
const HERO_IMAGE = "/hero.jpg";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-10 pt-14 sm:pt-20 lg:grid-cols-2 lg:gap-6 lg:pb-16">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-bold text-grape-500 shadow-card ring-1 ring-grape-100">
            <span aria-hidden>🌈</span> Handmade with love
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-slate-800 sm:text-5xl lg:text-6xl">
            Ellie &amp; Grace&rsquo;s
            <span className="mt-1 block rainbow-text">Rainbow Loom Shop</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-600 lg:mx-0">
            Bracelets, keychains, chokers, rings &amp; one-of-a-kind custom
            creations &mdash; all made by hand by two cousins who love rainbows,
            hearts &amp; flowers.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#order"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-bubblegum-500 px-7 py-3.5 text-base font-extrabold text-white shadow-lift transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-bubblegum-600 sm:w-auto"
            >
              Start your order <span aria-hidden>→</span>
            </a>
            <a
              href="#shop"
              className="inline-flex w-full items-center justify-center rounded-full bg-white/80 px-7 py-3.5 text-base font-bold text-slate-700 ring-1 ring-slate-200 transition-colors duration-150 ease-out hover:bg-white sm:w-auto"
            >
              See what we make
            </a>
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-500">
            💵 Cash only · We&rsquo;ll text you to set up pickup
          </p>
        </div>

        <div className="relative">
          <div className="animate-floaty">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt="Cartoon of Ellie and Grace at their rainbow loom stand with a big rainbow and their handmade bracelets"
              className="mx-auto w-full max-w-xl rounded-[2.25rem] shadow-lift ring-4 ring-white"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
