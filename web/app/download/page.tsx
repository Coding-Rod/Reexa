import { Apple, Download, Monitor, Smartphone } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { getT } from "@/lib/lang";


const WIN = process.env.NEXT_PUBLIC_DESKTOP_URL_WIN;
const LINUX = process.env.NEXT_PUBLIC_DESKTOP_URL_LINUX;

export const generateMetadata = async () => ({ title: (await getT()).download.title });

function DownloadButton({ href, label, hint, soon }: { href?: string; label: string; hint: string; soon: string }) {
  const body = (
    <>
      <span className="flex items-center gap-2 font-medium">
        <Download className="h-4 w-4" aria-hidden /> {label}
      </span>
      <span className="text-xs opacity-80">{href ? hint : soon}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex flex-col items-start gap-1 rounded-lg bg-accent px-4 py-3 text-accent-fg hover:opacity-90">
      {body}
    </a>
  ) : (
    <span aria-disabled="true" className="flex cursor-not-allowed flex-col items-start gap-1 rounded-lg border border-border px-4 py-3 text-muted">
      {body}
    </span>
  );
}

export default async function DownloadPage() {
  const S: Dict["download"] = (await getT()).download;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{S.title}</h1>
      <p className="mt-2 text-muted">{S.intro}</p>

      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Monitor className="h-5 w-5 text-accent" aria-hidden /> {S.desktop}
        </h2>
        <p className="mt-1 text-sm text-muted">{S.desktopNote}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <DownloadButton href={WIN} label={S.windows} hint={S.windowsHint} soon={S.soon} />
          <DownloadButton href={LINUX} label={S.linux} hint={S.linuxHint} soon={S.soon} />
          <span aria-disabled="true" className="flex flex-col items-start gap-1 rounded-lg border border-border px-4 py-3 text-muted">
            <span className="flex items-center gap-2 font-medium">
              <Apple className="h-4 w-4" aria-hidden /> {S.mac}
            </span>
            <span className="text-xs">{S.soon}</span>
          </span>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Smartphone className="h-5 w-5 text-accent" aria-hidden /> {S.mobile}
        </h2>
        <p className="mt-1 text-sm text-muted">{S.mobileNote}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>{S.ios}</li>
          <li>{S.android}</li>
        </ul>
        <p className="mt-3 text-sm text-muted">{S.native}</p>
      </section>
    </main>
  );
}
