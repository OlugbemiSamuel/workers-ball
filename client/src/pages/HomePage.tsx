export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <h1 className="text-4xl font-serif font-bold text-[#d97706] mb-2">
          Workers Ball 2026
        </h1>
        <p className="text-gray-400 text-lg">Light of the Globe</p>
        <div className="mt-6 flex gap-4">
          <a
            href="/register"
            className="gold-gradient px-6 py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-all"
          >
            Register to Attend
          </a>
          <a
            href="/login"
            className="border border-white/20 px-6 py-3 rounded-lg text-white font-semibold hover:bg-[#1a1a1a] transition-colors"
          >
            Admin Login
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          22nd Nov. 2026 • 4PM • Harvesters Globe Ologolo
        </p>
      </div>
    </div>
  );
}
