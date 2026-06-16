import '@/app/globals.css';
import { Bricolage_Grotesque, Instrument_Sans, Geist } from 'next/font/google';
import { AppProvider }   from '@/app/context/AppContext';
import ToastContainer    from '@/app/components/ToastContainer';
import LenisProvider     from '@/app/components/LenisProvider';
import { cn } from "@/app/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const bricolage = Bricolage_Grotesque({ 
  subsets: ['latin'], 
  display: 'swap',
  variable: '--font-bricolage'
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument'
});

export const metadata = {
  title: 'CalStory — Track What You Eat',
  description: 'The smarter way to track calories, macros and workouts. Log meals, crush goals, build your story.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(bricolage.variable, instrument.variable, "font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-instrument antialiased selection:bg-orange-500/30 selection:text-orange-950 bg-[#f7f6f3] text-[#1a1916]">
        <AppProvider>
          <ToastContainer>
            <LenisProvider>
              {children}
            </LenisProvider>
          </ToastContainer>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
