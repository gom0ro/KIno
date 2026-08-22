interface Props {
  rating: number;
  className?: string;
}

export default function RatingBadge({ rating, className = "" }: Props) {
  const color =
    rating >= 7.5
      ? "bg-emerald-500/90"
      : rating >= 6.5
        ? "bg-amber-500/90"
        : "bg-zinc-500/90";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-white ${color} ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}
