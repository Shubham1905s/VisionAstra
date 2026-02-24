export default function Input({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring"
        {...props}
      />
    </label>
  );
}
