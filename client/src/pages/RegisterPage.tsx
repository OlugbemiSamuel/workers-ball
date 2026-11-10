import { useState } from "react";
import axios from "axios";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { registrationApi } from "@/services/api.js";
import eventFlyer from "../images/eventFlyer.jpeg";

type RegistrationStatus = "idle" | "loading" | "success" | "error";

export default function RegisterPage(): JSX.Element {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [status, setStatus] = useState<RegistrationStatus>("idle");
  const [error, setError] = useState("");
  const [guestId, setGuestId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [sendingAgain, setSendingAgain] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setEmailError("");
    try {
      const data = await registrationApi.submit({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        attendance_status: "yes",
      });
      setGuestId(String(data.guest.id));
      setTicketId(data.guest.ticket_number || String(data.guest.id));
      setEmailSent(data.email_sent);
      if (!data.email_sent) {
        setEmailError(data.email_error || "Your registration is saved, but we could not send the ticket email.");
      }
      setStatus("success");
    } catch (submitError) {
      setError(getRequestError(submitError, "Registration failed. Please try again."));
      setStatus("error");
    }
  };

  const handleResend = async (): Promise<void> => {
    setSendingAgain(true);
    setEmailError("");
    try {
      const data = await registrationApi.resend({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        attendance_status: "yes",
      }, guestId, ticketId);
      setGuestId(String(data.guest.id));
      setTicketId(data.guest.ticket_number || String(data.guest.id));
      setEmailSent(data.email_sent);
      if (!data.email_sent) {
        setEmailError("We still could not send the ticket email. Please contact the event team.");
      }
    } catch (err) {
      setEmailError(getRequestError(err, "We still could not send the ticket email. Please contact the event team."));
    } finally {
      setSendingAgain(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#10100e] px-4 py-8 sm:px-6 sm:py-12">
      <img
        src={eventFlyer}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_30%] sm:object-center"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black/85 via-black/65 to-[#251708]/75" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(217,119,6,0.22),transparent_58%)]" />

      <div className="w-full max-w-lg">
        <header className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d97706] font-bold text-[#10100e] shadow-lg shadow-black/30">WB</div>
          <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">Workers Ball 2026</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b448]">Light of the Globe</p>
        </header>

        <section className="rounded-2xl border border-white/40 bg-white/95 p-5 text-[#171714] shadow-2xl backdrop-blur-md sm:p-8">
          {status === "success" ? (
            <div className="py-2 text-center" aria-live="polite">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h2 className="mt-4 font-serif text-2xl font-bold">Thank you, {form.firstName}!</h2>
              <p className="mt-2 text-sm leading-6 text-gray-700">Your registration for Workers Ball 2026 is complete.</p>
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
                <p className="flex items-center gap-2 font-semibold text-emerald-900"><Mail className="h-4 w-4" /> Check your email</p>
                <p className="mt-2 break-all text-sm text-emerald-800">{form.email}</p>
                {emailSent ? (
                  <p className="mt-2 text-sm leading-5 text-emerald-800">Your ticket and QR code have been sent. If you don&apos;t see the email, please check your spam or junk folder.</p>
                ) : (
                  <div className="mt-2 text-sm leading-5 text-amber-900">
                    <p>{emailError || "Your ticket email could not be sent yet."}</p>
                    <button type="button" onClick={() => void handleResend()} disabled={sendingAgain} className="mt-3 rounded-lg bg-[#173c30] px-4 py-2 font-semibold text-white hover:bg-[#0f3025] disabled:opacity-60">
                      {sendingAgain ? "Sending..." : "Try sending ticket again"}
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-gray-600">Ticket reference: <span className="font-mono font-semibold">{ticketId}</span></p>
              <button type="button" onClick={() => {
                setForm({ firstName: "", lastName: "", email: "", phone: "" });
                setGuestId("");
                setTicketId("");
                setEmailSent(false);
                setEmailError("");
                setStatus("idle");
              }} className="mt-6 text-sm font-semibold text-[#9a5600] underline decoration-[#9a5600]/50 underline-offset-4 hover:text-[#6f3c00]">
                Register another guest
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-serif text-xl font-bold sm:text-2xl">Register to attend</h2>
                <p className="mt-1 text-sm text-gray-600">Complete your details to receive your event ticket by email.</p>
              </div>

              {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-gray-800">
                    First name *
                    <input
                      type="text"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-800">
                    Last name *
                    <input
                      type="text"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20"
                      required
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-gray-800">
                  Email *
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-800">
                  Phone number <span className="font-normal text-gray-500">(optional)</span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20"
                    placeholder="+234 800 000 0000"
                  />
                </label>
                <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#171714] px-5 py-3.5 font-semibold text-white transition hover:bg-[#30291e] disabled:cursor-not-allowed disabled:opacity-60">
                  {status === "loading" ? "Completing registration..." : <>Complete registration <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            </>
          )}
        </section>

        <p className="mt-5 text-center text-sm font-medium text-white/90">22nd Nov. 2026 · 4PM</p>
        <p className="mt-1 text-center text-sm text-white/75">Harvesters Globe Ologolo</p>
      </div>
    </main>
  );
}

const getRequestError = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message || err.response?.data?.error;
    if (typeof message === "string") return message;
  }
  return err instanceof Error ? err.message : fallback;
};
