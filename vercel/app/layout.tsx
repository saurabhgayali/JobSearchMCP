import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Job Search MCP',
  description: 'AI-Powered Job Discovery Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
