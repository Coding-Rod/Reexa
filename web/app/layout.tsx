import type { Metadata } from "next";
import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Reexa", template: "%s · Reexa" },
  description: "Your course slides as a personal playlist of narrated, captioned lessons with notes and checks.",
};

// Apply the saved theme before first paint (no flash). Stored by lib/store.ts saveTheme().
const themeScript = `try{var t=JSON.parse(localStorage.getItem("tutor:theme"));if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={<div className="h-[var(--header-h)] border-b border-border bg-surface" />}>
          <AppHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
