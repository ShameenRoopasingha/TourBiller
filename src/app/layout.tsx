import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Image from 'next/image'
import { Sidebar } from '@/components/Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SessionProvider } from '@/components/SessionProvider';
import { auth } from '@/lib/auth';
import { PageTransition } from '@/components/PageTransition';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VIRGIL | Smart Travel Management System',
  description: 'The professional solution for vehicle hire billing and travel management. Automate invoices, manage bookings, and streamline your operations with VIRGIL.',
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
            <SessionProvider>
              <SidebarProvider>
                <div className="flex min-h-screen bg-background relative selection:bg-primary/20 w-full">
                  {/* Aurora Background Elements */}
                  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
                    <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
                  </div>

                  <div className="print:hidden z-40">
                    <Sidebar userRole={(session.user as { role?: string })?.role} userName={session.user?.name || 'User'} />
                  </div>

                  <SidebarInset className="flex w-full flex-col bg-transparent">
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 print:hidden backdrop-blur-md bg-background/80 md:hidden z-50 sticky top-0">
                      <div className="flex items-center gap-2">
                          <Image src="/virgil-logo.png" alt="VIRGIL" width={32} height={32} className="h-8 w-auto drop-shadow-sm" priority />
                          <div className="flex flex-col justify-center">
                              <span className="font-bold text-lg tracking-tight leading-none bg-gradient-to-r from-blue-900 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent pb-0.5">VIRGIL</span>
                              <span className="text-[0.5rem] font-medium tracking-wide text-muted-foreground uppercase leading-none">Smart Travel Management.</span>
                          </div>
                      </div>
                      <SidebarTrigger className="-mr-2" />
                    </header>
                    <main className="flex-1 p-2 sm:p-4 md:p-8 bg-background/40 backdrop-blur-[2px] z-10 print:p-0 print:bg-white overflow-hidden">
                      <PageTransition>{children}</PageTransition>
                    </main>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            </SessionProvider>
          ) : (
            children
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}