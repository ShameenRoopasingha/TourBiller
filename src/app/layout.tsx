import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/Sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { SessionProvider } from '@/components/SessionProvider'
import { auth } from '@/lib/auth'
import { PageTransition } from '@/components/PageTransition'
import { NotificationBell } from '@/components/NotificationBell'
import { RefreshButton } from '@/components/RefreshButton'
import { ToastProvider } from '@/components/ToastProvider'
import { ArcSpinnerNavbar } from '@/components/ArcSpinnerNavbar'
import { SignOutButton } from '@/components/SignOutButton'
import { AmbientAtmosphere } from '@/components/layout/ambient-atmosphere'
import { ThemeSwitcher } from '@/components/layout/theme-switcher'
import ChatAssistant from '@/components/ChatAssistant'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'Vigil Tour Management Platform',
  description: 'The professional solution for vehicle hire billing and travel management. Automate invoices, manage bookings, and streamline your operations with VIGIL.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#07070a' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} ${montserrat.variable} ${inter.className} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <AmbientAtmosphere />
          {session ? (
            <SessionProvider>
              <SidebarProvider defaultOpen={defaultOpen}>
                <div className="flex min-h-screen bg-background relative selection:bg-primary/20 selection:text-primary w-full">
                  <div className="print:hidden z-40 shrink-0">
                    <Sidebar userRole={(session.user as { role?: string })?.role} userName={session.user?.name || 'User'} />
                  </div>

                  <SidebarInset className="flex flex-1 min-w-0 flex-col bg-transparent relative">
                    {/* Global Topbar */}
                    <header className="flex h-auto md:h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 md:px-6 print:hidden backdrop-blur-md bg-background/80 z-30 sticky top-0 pt-notch-safe pb-2.5 md:pt-0 md:pb-0">
                      <div className="flex items-center gap-2">
                        {/* Mobile Only Logo */}
                        <div className="md:hidden flex items-center gap-2">
                          <Image src="/logo-icon.png" alt="VIGIL" width={28} height={28} className="h-7 w-auto drop-shadow-sm object-contain" priority />
                          <div className="flex flex-col justify-center">
                            <span className={`font-black text-xl tracking-tight leading-none text-foreground pb-0.5 ${montserrat.className}`}>VIGIL</span>
                          </div>
                        </div>
                        {/* Desktop trigger for collapsing sidebar */}
                        <div className="hidden md:block">
                          <SidebarTrigger className="-ml-1 hover:bg-muted/80 text-muted-foreground hover:text-foreground" />
                        </div>
                      </div>
                      
                      {/* Top Right Actions */}
                      <div className="flex items-center gap-2">
                         <RefreshButton />
                         <NotificationBell />
                         <ArcSpinnerNavbar />
                         <ThemeSwitcher />
                         <div className="hidden md:flex items-center pl-1 border-l border-border/60 ml-0.5">
                            <SignOutButton />
                         </div>
                      </div>
                    </header>

                    <main className="flex-1 min-w-0 w-full p-2 sm:p-4 md:p-8 bg-background/40 backdrop-blur-[2px] z-10 print:p-0 print:bg-white">
                      <PageTransition>{children}</PageTransition>
                    </main>
                  </SidebarInset>
                  
                  {/* AI Assistant Chat UI */}
                  <div className="print:hidden">
                    <ChatAssistant />
                  </div>
                </div>
              </SidebarProvider>
            </SessionProvider>
          ) : (
            <div className="relative z-10 min-h-screen">
              {children}
            </div>
          )}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  )
}
