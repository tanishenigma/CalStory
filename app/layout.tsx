import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Geist } from "next/font/google";
import { AppProvider } from "@/app/context/AppContext";
import ToastContainer from "@/app/components/ToastContainer";
import { cn } from "@/app/lib/utils";
import { Toaster } from "@/app/components/ui/sonner";
import { DynamicBackground } from "@/app/components/DynamicBackground";
import { RouteThemeController } from "@/app/components/RouteThemeController";
import { SiteJsonLd } from "@/app/components/seo/SiteJsonLd";

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

const SITE_NAME = "CalStory";
const SITE_DESCRIPTION =
  "CalStory is a free calorie, macro, and workout tracker with an AI food logger — built for lifters who care about real progress.";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://calstory.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Free Calorie Tracker`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  verification: {
    google: "googleb18fe1957a712708",
  },
  keywords: [
    "calorie tracker",
    "macro tracker",
    "food logger",
    "AI food log",
    "workout tracker",
    "TDEE calculator",
    "macro calculator",
    "lifting tracker",
    "strength training log",
    "calorie counting app",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
  // Prevent iOS Safari from auto-linking phone numbers / addresses
  // in body text, which can visually corrupt numeric data (calorie
  // counts, weights, etc.).
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free Calorie & Macro Tracker for Lifters`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Track what you eat. Build your story.`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Free Calorie & Macro Tracker for Lifters`,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
    creator: "@calstoryapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        bricolage.variable,
        instrument.variable,
        "font-sans",
        geist.variable,
      )}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
  var raw=localStorage.getItem('ft_theme');
  var t=raw?JSON.parse(raw):localStorage.getItem('theme');
  // Default is dark. Light is only honored when the user picked it
  // explicitly; "system" still follows the OS preference.
  var dark=t==='dark'||!t||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(dark)document.documentElement.classList.add('dark');
  // Forced-dark public pages (landing + auth) — add the matching
  // class before paint so the user never sees a light flash.
  var p=window.location.pathname;
  if(p==='/'||p==='/index'||p===''||p==='/auth')document.documentElement.classList.add('forced-dark');
}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-instrument antialiased selection:bg-primary/30 selection:text-primary-foreground bg-background text-foreground">
        {/* Site-wide Organization + WebSite JSON-LD. `SearchAction`
         * inside WebSite powers Google's sitelinks search box.
         * Server-rendered, no client JS shipped. */}
        <SiteJsonLd />
        <DynamicBackground />
        <AppProvider>
          <RouteThemeController />
          <ToastContainer>{children}</ToastContainer>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
