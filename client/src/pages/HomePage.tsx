const ACCENT = "#F17A1E";

export default function HomePage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-10">
      <div className="w-full max-w-3xl">
        {/* Official Sixth Season artwork (cropped from the flyer) */}
        <div className="overflow-hidden border border-white/10 bg-black">
          <img
            src="/images/sixth-season-hero.jpeg"
            alt="Sixth Season — Beyond Limits. Beyond Seasons."
            className="h-auto w-full"
          />
        </div>

        <div className="mt-8 text-center">
          <div className="flex flex-col items-center gap-2 text-sm text-zinc-300">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: ACCENT }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Sunday, 22nd November 2026 • 6:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: ACCENT }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a4 4 0 01-5.657 0L5.171 16.657a4 4 0 010-5.657l1.414-1.414a2 2 0 012.828 0L12 15.586l1.414-1.414a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828z" />
              </svg>
              <span>BYD, Victoria Island, Lagos</span>
            </div>
          </div>

          <a
            href="/register"
            className="mt-8 flex w-full items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:brightness-110"
            style={{ backgroundColor: ACCENT }}
          >
            Register to Attend
          </a>
        </div>
      </div>
    </div>
  );
}
