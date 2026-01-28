import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vehicle Hire Billing System',
  description: 'Professional vehicle hire billing and invoice generation system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <div className="flex min-h-screen bg-background">
          <div className="print:hidden">
            <Sidebar />
          </div>
          <main className="flex-1 ml-64 p-8 bg-muted/20 print:ml-0 print:p-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}