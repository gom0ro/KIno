import Link from "next/link";
import { notFound } from "next/navigation";

export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-fg/5 bg-base-800">
      <div className="skeleton aspect-[2/3] rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-3/4 rounded-none" />
        <div className="skeleton h-3 w-1/2 rounded-none" />
      </div>
      <Link href="/catalog" className="hidden" aria-hidden />
    </div>
  );
}
