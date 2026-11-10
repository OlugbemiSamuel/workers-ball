import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import eventFlyer from "../images/eventFlyer.jpeg";

export default function HomePage(): JSX.Element {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#10100e] px-4 py-10 sm:px-6">
      <img
        src={eventFlyer}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_30%] sm:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/85 via-black/55 to-[#251708]/80" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.2),transparent_60%)]" />

      <section className="w-full max-w-2xl rounded-3xl border border-white/20 bg-black/35 px-5 py-9 text-center shadow-2xl backdrop-blur-sm sm:px-10 sm:py-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#d97706] text-lg font-bold text-[#10100e] shadow-lg shadow-black/30">WB</div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#f4b448] sm:text-sm">Light of the Globe</p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">Workers Ball 2026</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-white/85 sm:text-lg">
          Join us for an evening of celebration, connection, and community.
        </p>

        <div className="mx-auto mt-7 flex max-w-md flex-col items-center justify-center gap-3 text-sm text-white sm:flex-row sm:gap-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#f4b448]" />
            <span>22nd Nov. 2026 · 4PM</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[#f4b448]" />
            <span>Harvesters Globe Ologolo</span>
          </div>
        </div>

        <Link
          to="/register"
          className="mx-auto mt-8 flex w-full max-w-sm items-center justify-center rounded-xl bg-[#f0a52e] px-6 py-4 text-base font-bold text-[#17120a] shadow-lg shadow-[#d97706]/30 transition hover:bg-[#ffc15b] focus:outline-none focus:ring-4 focus:ring-[#ffc15b]/40 sm:text-lg"
        >
          Register to Attend
        </Link>
      </section>
    </main>
  );
}
