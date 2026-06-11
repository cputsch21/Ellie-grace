export default function SiteFooter() {
  return (
    <footer className="px-6 pb-28 pt-6 text-center sm:pb-12">
      <div className="mx-auto max-w-3xl">
        <div
          className="mx-auto mb-6 h-1.5 w-40 rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg,#FF4D97,#FFB13D,#FBBF12,#7BD88F,#1F86F5,#8B4DFF)",
          }}
        />
        <p className="text-lg font-bold text-slate-700">
          Ellie &amp; Grace&rsquo;s Rainbow Loom Shop
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Made by hand with 💜 · Cash only · Kids, grab a grown-up to help you
          order!
        </p>
      </div>
    </footer>
  );
}
