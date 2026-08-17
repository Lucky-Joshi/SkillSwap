import { Skeleton, CardSkeleton } from './Skeleton';

export default function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="glass overflow-hidden rounded-2xl">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-white dark:border-slate-900" />
            <div className="mb-1 flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
