import "@/app/globals.css";
import { Bricolage_Grotesque, Instrument_Sans, Geist } from "next/font/google";
import { AppProvider } from "@/app/context/AppContext";
import ToastContainer from "@/app/components/ToastContainer";
import LenisProvider from "@/app/components/LenisProvider";
import { cn } from "@/app/lib/utils";
import { Toaster } from "@/app/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument",
});

export const metadata = {
  title: "CalStory — Track What You Eat",
  description:
    "The smarter way to track calories, macros and workouts. Log meals, crush goals, build your story.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        bricolage.variable,
        instrument.variable,
        "font-sans",
        geist.variable,
      )}>
      <head>
        {/* Inline blocking script: restore theme before first paint to avoid FOUC.
            Reads "ft_theme" (JSON, written by prefsStore) or falls back to
            "theme" (raw string) or OS preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var raw=localStorage.getItem('ft_theme');
  var t=raw?JSON.parse(raw):localStorage.getItem('theme');
  var dark=t==='dark'||((!t||t==='"system"'||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(dark)document.documentElement.classList.add('dark');
}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-instrument antialiased selection:bg-primary/30 selection:text-orange-950 bg-background text-foreground">
        <AppProvider>
          <ToastContainer>
            <LenisProvider>{children}</LenisProvider>
          </ToastContainer>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
