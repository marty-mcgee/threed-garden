import { Skeleton } from '@/components/ui/skeleton';

export function MultimediaPlayerSkeleton() {
  return <section role="status" aria-label="Loading Album" aria-busy="true" className="mb-6 rounded-lg border p-4 pb-[36px]">
    <span className="sr-only">Loading Album and Tracks…</span>
    <div aria-hidden="true" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="aspect-square w-full max-w-72 lg:max-w-[26rem] motion-reduce:animate-none" />
        <Skeleton className="h-5 w-2/3 motion-reduce:animate-none" />
        <Skeleton className="h-4 w-1/3 motion-reduce:animate-none" />
        <Skeleton className="size-12 rounded-full motion-reduce:animate-none" />
        <Skeleton className="h-3 w-full motion-reduce:animate-none" />
        <Skeleton className="h-3 w-28 motion-reduce:animate-none" />
      </div>
      <div className="min-w-0 space-y-4">
        <Skeleton className="h-[100px] w-full motion-reduce:animate-none" />
        <Skeleton className="h-9 w-full motion-reduce:animate-none" />
        <div className="h-96 space-y-3 overflow-hidden lg:h-[28rem]">
          {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-10 w-full motion-reduce:animate-none" />)}
        </div>
      </div>
    </div>
  </section>;
}

export function MultimediaPageSkeleton() {
  return <div className="min-h-screen bg-background px-4 py-4 text-foreground">
    <header className="mb-4 flex min-h-9 items-center gap-2 border-b pb-2"><h1 className="text-sm font-semibold">Multimedia</h1></header>
    <MultimediaPlayerSkeleton />
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-3 rounded-lg border p-3">
        <Skeleton className="aspect-square w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-3/4 motion-reduce:animate-none" />
        <Skeleton className="h-3 w-1/2 motion-reduce:animate-none" />
      </div>)}
    </div>
  </div>;
}
