import { Link } from "react-router-dom";

const highlights = [
  { title: "Create Team", text: "Leaders can create teams instantly and share team IDs." },
  { title: "Join by ID", text: "Any participant can open a shared team link and request access." },
  { title: "Track Rounds", text: "Submission windows, marks, and certificates are managed in one place." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fafc_40%,_#e2e8f0_100%)] px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl shadow-slate-300/40 backdrop-blur">
          <p className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold tracking-wide text-brand-900">
            VisionAstra 2026
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            One portal for team creation, submissions, and results.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-700 md:text-base">
            Create leader accounts, generate shareable team IDs, and manage the full hackathon flow across students and admins.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/student/register" className="rounded-lg bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-900">
              Create Leader Account
            </Link>
            <Link to="/student/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
              Student Login
            </Link>
            <Link to="/admin/login" className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100">
              Admin Login
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
