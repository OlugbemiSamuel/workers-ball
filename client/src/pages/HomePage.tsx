export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Sixth Season flyer background - responsive */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/images/sixth-season-flyer.jpeg"
          alt="Sixth Season Pop-Up Experience"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-white/40 mb-6">
            <span className="font-bold text-lg tracking-tight text-white">S6</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2 leading-tight tracking-wide">
            SIXTH SEASON
          </h1>
          <p className="text-zinc-400 font-semibold tracking-[0.25em] uppercase text-xs mb-8">
            Beyond Limits. Beyond Seasons.
          </p>

          <div className="flex flex-col items-center gap-2 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span>Sunday, 22nd November 2026 • 6:00 PM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a4 4 0 01-5.657 0L5.171 16.657a4 4 0 010-5.657l1.414-1.414a2 2 0 012.828 0L12 15.586l1.414-1.414a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828z" />
                </svg>
              </span>
              <span>BYD, Victoria Island, Lagos</span>
            </div>
          </div>

          <a
            href="/register"
            className="mt-8 w-full bg-white text-black py-4 rounded-none font-semibold text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
          >
            Register to Attend
          </a>
        </div>
      </div>
    </div>
  );
}
