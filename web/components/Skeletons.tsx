// Pulsing placeholders shaped like the real UI. Each carries an sr-only label for screen readers.
const bar = "rounded bg-accent-soft";

function Busy({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div aria-busy="true" className={`animate-pulse ${className}`}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Course card grid (home). */
export function CourseCardsSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-accent-soft" />
            <div className="flex-1 space-y-2">
              <div className={`h-4 w-3/4 ${bar}`} />
              <div className={`h-3 w-1/2 ${bar}`} />
            </div>
          </div>
          <div className={`h-3 w-full ${bar}`} />
          <div className={`h-3 w-5/6 ${bar}`} />
          <div className={`mt-2 h-1.5 w-full ${bar}`} />
          <div className={`h-9 w-24 ${bar}`} />
        </div>
      ))}
    </Busy>
  );
}

/** Lecture cards with lesson rows (course library). */
export function LectureCardsSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <div className={`h-4 w-2/3 ${bar}`} />
          <div className={`h-3 w-1/2 ${bar}`} />
          <div className={`h-1.5 w-full ${bar}`} />
          {[0, 1, 2].map((r) => (
            <div key={r} className="flex items-center gap-3">
              <div className={`size-4 ${bar}`} />
              <div className={`h-3 flex-1 ${bar}`} />
              <div className={`h-3 w-10 ${bar}`} />
            </div>
          ))}
        </div>
      ))}
    </Busy>
  );
}

/** Breadcrumb + title + intro (course header). */
export function HeaderSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="mb-6 space-y-3">
      <div className={`h-3 w-40 ${bar}`} />
      <div className={`h-9 w-72 max-w-full ${bar}`} />
      <div className={`h-3 w-full max-w-2xl ${bar}`} />
      <div className={`h-3 w-2/3 max-w-xl ${bar}`} />
    </Busy>
  );
}

/** Video + transcript + side panel (lesson player). */
export function PlayerSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 py-5 xl:grid-cols-[280px_minmax(0,1fr)_400px]">
      <div className="order-3 hidden space-y-2 rounded-xl border border-border bg-surface p-3 xl:order-1 xl:block">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-8 ${bar}`} />
        ))}
      </div>
      <div className="order-1 space-y-3 xl:order-2">
        <div className={`h-3 w-56 ${bar}`} />
        <div className={`h-7 w-2/3 ${bar}`} />
        <div className="aspect-video w-full rounded-xl border border-border bg-accent-soft" />
        <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-3 ${bar}`} style={{ width: `${90 - i * 12}%` }} />
          ))}
        </div>
      </div>
      <div className="order-2 space-y-3 rounded-xl border border-border bg-surface p-4 xl:order-3">
        <div className={`h-8 ${bar}`} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-3 ${bar}`} style={{ width: `${95 - i * 10}%` }} />
        ))}
      </div>
    </Busy>
  );
}

/** Title + stat tiles + concept list (progress dashboard). */
export function DashboardSkeleton({ label }: { label: string }) {
  return (
    <Busy label={label} className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:py-12">
      <div className={`h-9 w-64 ${bar}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <div className={`h-3 w-24 ${bar}`} />
            <div className={`h-7 w-16 ${bar}`} />
          </div>
        ))}
      </div>
      <div className="h-20 rounded-xl border-2 border-border bg-surface" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border bg-surface p-3">
          <div className={`h-3 w-1/2 ${bar}`} />
          <div className="flex gap-2">
            <div className={`h-5 w-24 rounded-full bg-accent-soft`} />
            <div className={`h-5 w-20 rounded-full bg-accent-soft`} />
          </div>
        </div>
      ))}
    </Busy>
  );
}
