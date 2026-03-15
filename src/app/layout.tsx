import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChannelFlow - Channel Manager',
  description: 'Manage your vacation rental channels with ChannelFlow',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
