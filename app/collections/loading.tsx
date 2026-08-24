import SkeletonCard from "@/components/SkeletonCard";

export default function CollectionsLoading() {
  return (
    <div aria-hidden>
      <div className="skeleton mb-6 h-9 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
