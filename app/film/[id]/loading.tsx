export default function FilmLoading() {
  return (
    <div className="animate-fade-in space-y-10" aria-hidden>
      <div className="skeleton h-5 w-40" />
      <div className="skeleton h-10 w-80 max-w-full" />
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="skeleton aspect-[2/3] w-[220px] shrink-0" />
        <div className="flex-1 space-y-4 pt-2">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="mt-8 flex gap-2">
            <div className="skeleton h-7 w-20 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-full" />
            <div className="skeleton h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
