import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, UserCheck } from 'lucide-react';
import { INTERVIEW_TRACKS, TARGET_COMPANIES } from '../data/soraContent';
import { BookingFormInput, validateBookingForm } from '../utils/videoLoop';

interface BookingModalProps {
  open: boolean;
  source: 'header' | 'hero';
  initialTrack?: string;
  onClose: () => void;
}

export function BookingModal({ open, source, initialTrack, onClose }: BookingModalProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const [form, setForm] = useState<BookingFormInput>({
    name: '',
    email: '',
    targetCompany: 'Google',
    track: initialTrack || 'Live DSA Mock Loop',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormInput, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    setToken(storedToken);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setForm((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
        }));
      } catch (e) {
        // ignore
      }
    }
  }, [open]);

  useEffect(() => {
    if (open && initialTrack) {
      setForm((prev) => ({ ...prev, track: initialTrack }));
    }
  }, [open, initialTrack]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleClose = () => {
    setErrors({});
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateBookingForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#041a2a]/95 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              {source === 'header' ? 'Early Access Queue' : '60-Minute Verified Session'}
            </p>
            <h2
              id="booking-modal-title"
              className="mt-1 text-3xl font-normal tracking-tight text-white"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              {submitted ? 'Your session request is reserved.' : 'Schedule with a Sora engineer.'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close booking dialog"
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="mt-6 space-y-5">
            <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[#0A0A0A]">
                <Check className="h-3.5 w-3.5 font-bold" />
              </div>
              <div className="text-sm leading-relaxed text-zinc-200">
                <p className="font-semibold text-white">Confirmation queued for {form.name}</p>
                <p className="mt-1 text-zinc-300">
                  Target: <span className="text-white font-medium">{form.targetCompany}</span> · Track: <span className="text-cyan-300">{form.track}</span>.
                </p>
                <p className="mt-1.5 text-xs text-zinc-400">
                  {token
                    ? "Your session is queued in the Sora matching engine. Head to your candidate dashboard to review scheduled slots and track status."
                    : "Create or log into your candidate account to unlock the live shared IDE, track match status, and start story practice."}
                </p>
              </div>
            </div>

            {token ? (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/candidate-dashboard');
                  }}
                  className="w-full cursor-pointer rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-all hover:bg-white/90 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Go to Candidate Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full cursor-pointer rounded-full border border-white/15 px-6 py-2.5 text-xs text-zinc-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate(`/signup?company=${encodeURIComponent(form.targetCompany)}`);
                  }}
                  className="w-full cursor-pointer rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-all hover:bg-white/90 flex items-center justify-center gap-2"
                >
                  <span>Create Account to Finalize Session</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    navigate('/login');
                  }}
                  className="w-full cursor-pointer rounded-full border border-white/15 px-6 py-2.5 text-xs text-zinc-300 hover:bg-white/10"
                >
                  Already have an account? Log In
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="booking-name" className="block text-xs font-medium text-zinc-300">
                Full name
              </label>
              <input
                id="booking-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Aarav Krishnan"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
              {errors.name && (
                <p role="alert" className="mt-1 text-xs text-rose-300">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="booking-email" className="block text-xs font-medium text-zinc-300">
                Email address
              </label>
              <input
                id="booking-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="aarav@domain.com"
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
              />
              {errors.email && (
                <p role="alert" className="mt-1 text-xs text-rose-300">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="booking-company" className="block text-xs font-medium text-zinc-300">
                  Target Company
                </label>
                <select
                  id="booking-company"
                  value={form.targetCompany}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetCompany: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#051f33] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  {TARGET_COMPANIES.map((company) => (
                    <option key={company} value={company} className="bg-[#041826] text-white">
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="booking-track" className="block text-xs font-medium text-zinc-300">
                  Interview Track
                </label>
                <select
                  id="booking-track"
                  value={form.track}
                  onChange={(e) => setForm((prev) => ({ ...prev, track: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#051f33] px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  {INTERVIEW_TRACKS.map((track) => (
                    <option key={track} value={track} className="bg-[#041826] text-white">
                      {track}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full cursor-pointer rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-transform duration-200 hover:scale-[1.02] hover:bg-white/95"
            >
              Confirm Reservation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
