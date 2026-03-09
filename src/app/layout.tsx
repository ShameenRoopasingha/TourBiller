import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { auth } from '@/lib/auth';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vehicle Hire Billing System',
  description: 'Professional vehicle hire billing and invoice generation system',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {session ? (
            <div className="flex min-h-screen bg-background relative selection:bg-primary/20">
              {/* Aurora Background Elements */}
              <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
              </div>

              <div className="print:hidden z-40">
                <Sidebar userRole={(session.user as any)?.role} userName={session.user?.name || 'User'} />
              </div>
              <main className="flex-1 ml-64 p-8 bg-background/40 backdrop-blur-[2px] z-10 print:ml-0 print:p-0 print:bg-white overflow-hidden">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}