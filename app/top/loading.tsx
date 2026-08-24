export default function TopLoading() {
  return (
    <div aria-hidden>
      <div className="skeleton mb-6 h-9 w-48" />
      <ul className="space-y-2">
        {Array.from({ length: 8 }, (_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-xl border border-fg/5 bg-base-800/60 p-4"
          >
            <div className="skeleton h-6 w-8" />
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-40" />
              <div className="skeleton h-3 w-24" />
            </div>
            <div className="skeleton h-4 w-12" />
          </li>
        ))}
      </ul>
    </div>
  );
}
