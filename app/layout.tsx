import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { DEVELOPERS } from '@/lib/developers';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NestLiving — Shared Living & Roommate Discovery',
  description:
    'Explore verified shared rooms, match with like-minded roommates based on lifestyle habits, and secure your place without brokers.',
  authors: DEVELOPERS.map((developer) => ({ name: developer.name, url: developer.url })),
  creator: DEVELOPERS.map((developer) => developer.name).join(' & '),  
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-[#FAFAFA] font-body text-black antialiased">
        {children}
      </body>
    </html>
  );
}
