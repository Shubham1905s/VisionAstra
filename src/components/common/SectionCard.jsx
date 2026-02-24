export default function SectionCard({ title, right, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
        {right}
      </header>
      {children}
    </section>
  );
}
