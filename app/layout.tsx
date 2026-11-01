import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lélek & Nyelv',
  description: 'Mentálhigiénés támogatás és személyre szabott angolórák egy figyelmes, biztonságos térben.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Lélek & Nyelv',
    description: 'Mentálhigiénés támogatás és személyre szabott angolórák egy figyelmes, biztonságos térben.',
    locale: 'hu_HU',
    type: 'website',
  },
  twitter: { card: 'summary' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
