export default function UserLoading() {
  return (
    <div className="animate-fade-in space-y-8" aria-hidden>
      <div className="flex flex-wrap items-center gap-5">
        <div className="skeleton h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="skeleton h-[76px]" />
        ))}
      </div>
      <div className="skeleton h-24 w-full" />
    </div>
  );
}
