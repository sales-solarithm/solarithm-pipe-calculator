import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solarithm Pipe Calculator - Structure & Pipe Engineering Console',
  description: 'Executive project, structure, and pipe requirement engineering console with high-density calculation and PDF generation.',
  openGraph: {
    title: 'Solarithm Pipe Calculator - Structure & Pipe Engineering Console',
    description: 'Executive project, structure, and pipe requirement engineering console with high-density calculation and PDF generation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solarithm Pipe Calculator - Structure & Pipe Engineering Console',
    description: 'Executive project, structure, and pipe requirement engineering console with high-density calculation and PDF generation.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0D1117] text-[#F1F5F9] antialiased font-sans selection:bg-[#1D72FE]/30 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
