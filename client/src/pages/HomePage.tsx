export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0a]">
      {/* Event flyer background - responsive */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/images/eventFlyer.jpeg"
          alt="Workers Ball 2026"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/50 to-transparent" />
        <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_top_center,rgba(217,119,6,0.1)_0%,transparent_60%)]" />
      </div>

      {/* Overlay content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#d97706] text-[#0a0a0a] mb-6">
            <span className="font-bold text-lg">WB</span>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2 leading-tight">
            Workers Ball 2026
          </h1>
          <p className="text-[#d97706] font-semibold tracking-wider uppercase text-sm mb-8">
            Light of the Globe
          </p>

          <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <span>22nd Nov. 2026 • 4PM</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.828a4 4 0 01-5.657 0L5.171 16.657a4 4 0 010-5.657l1.414-1.414a2 2 0 012.828 0L12 15.586l1.414-1.414a2 2 0 012.828 0l1.414 1.414a2 2 0 010 2.828z" />
                </svg>
              </span>
              <span>Harvesters Globe Ologolo</span>
            </div>
          </div>

          <a
            href="/register"
            className="w-full bg-[#d97706] text-[#0a0a0a] py-4 rounded-lg font-semibold text-lg hover:bg-[#b45309] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d97706]/30"
          >
            Register to Attend
          </a>
        </div>
      </div>
    </div>
  );
}
