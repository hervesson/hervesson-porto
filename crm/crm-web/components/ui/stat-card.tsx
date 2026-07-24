export default function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div className="bg-surface-2 border border-line rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p
        className={`text-xl font-semibold ${
          tone === "pos" ? "text-emerald-300" : tone === "neg" ? "text-red-300" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
