import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Revenue OS',
  description: 'Operating system for revenue control and forecasting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
