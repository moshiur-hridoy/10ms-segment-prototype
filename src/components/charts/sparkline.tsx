/** History in grey, the latest value as an accent dot. Missing (null) points break the line. */
export function Sparkline({ values, max, label }: { values: (number | null)[]; max?: number; label: string }) {
  const w = 120;
  const h = 28;
  const top = max ?? Math.max(1, ...values.map((v) => v ?? 0));
  const x = (i: number) => 4 + (i * (w - 8)) / Math.max(1, values.length - 1);
  const y = (v: number) => h - 4 - (v / top) * (h - 8);
  const segments: string[][] = [[]];
  values.forEach((v, i) => {
    if (v === null) segments.push([]);
    else segments[segments.length - 1].push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  });
  const last = values[values.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-7 w-full max-w-32" role="img" aria-label={label}>
      {segments
        .filter((s) => s.length > 1)
        .map((s, i) => (
          <polyline key={i} points={s.join(" ")} fill="none" className="stroke-chart-muted" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      {last !== null && last !== undefined && (
        <circle cx={x(values.length - 1)} cy={y(last)} r={4} className="fill-chart-cat-1 stroke-surface" strokeWidth={2} />
      )}
    </svg>
  );
}
