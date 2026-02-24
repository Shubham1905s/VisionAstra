import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-100 to-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-brand-900">VisionAstra Hackathon Management System</h1>
          <p className="text-sm text-slate-600">Student and Admin portal with team, rounds, marks, and certificates.</p>
          <nav className="mt-3 flex gap-4 text-sm">
            <Link className="text-brand-700 underline" to="/student/register">Student Register</Link>
            <Link className="text-brand-700 underline" to="/student/login">Student Login</Link>
            <Link className="text-brand-700 underline" to="/admin/login">Admin Login</Link>
          </nav>
        </header>
        <Outlet />
      </div>
    </main>
  );
}
