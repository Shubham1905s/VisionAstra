import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-2xl font-bold">Page not found</p>
        <Link className="mt-3 inline-block text-brand-700 underline" to="/">
          Go to home
        </Link>
      </div>
    </main>
  );
}
