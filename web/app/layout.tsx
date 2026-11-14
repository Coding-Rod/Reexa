import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import AppHeader from "@/components/AppHeader";
import AuthGate from "@/components/AuthGate";
import TutorFab from "@/components/TutorFab";
import { LangProvider } from "@/components/Lang";
import { dicts } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return { title: { default: "Reexa", template: "%s · Reexa" }, description: dicts[await getLang()].meta.description };
}

// Apply the saved theme before first paint (no flash). Stored by lib/store.ts saveTheme().
const themeScript = `try{var t=JSON.parse(localStorage.getItem("tutor:theme"));if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <LangProvider lang={lang}>
          <Suspense fallback={<div className="h-[var(--header-h)] border-b border-border bg-surface" />}>
            <AppHeader />
          </Suspense>
          <AuthGate>
            {children}
            <TutorFab />
          </AuthGate>
          <Toaster
            position="bottom-center"
            closeButton
            style={{ "--normal-bg": "var(--surface)", "--normal-text": "var(--foreground)", "--normal-border": "var(--border)" } as React.CSSProperties}
          />
        </LangProvider>
      </body>
    </html>
  );
}
