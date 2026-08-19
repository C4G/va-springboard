import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SessionStuff } from './sessionStuff';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import localFont from 'next/font/local';
import Script from 'next/script';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Home | VA Springboard',
  description:
    'A starter template for the computing 4 good projects leveraging Next.js and Prisma.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <SessionProvider>
            <SessionStuff /> {/* clearing state on logout */}
            <Header />
            <div className='mt-16 min-h-[calc(100dvh-8.4rem)]'>{children}</div>
            <Footer />
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
        <Script
          src='https://analytics.c4g.dev/script.js'
          data-website-id='f19f1aa1-3f03-4246-b551-e7ce38458456'
        />
      </body>
    </html>
  );
}
