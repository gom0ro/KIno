import SkeletonCard from "@/components/SkeletonCard";

export default function CatalogLoading() {
  return (
    <div>
      <div className="skeleton mb-2 h-9 w-64" />
      <div className="skeleton mb-6 h-4 w-40" />
      <div className="skeleton mb-6 h-[52px]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
