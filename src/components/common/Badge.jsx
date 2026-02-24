export default function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
