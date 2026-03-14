
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
              VIRGIL
            </span>
            <span className="text-foreground invisible sm:visible"> </span>
            <span className="text-foreground">Precision Billing</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto font-medium">
            Smart travel management and intelligent invoicing infrastructure for modern fleets.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <Dashboard />
        </Suspense>
      </div>
    </main>
  );
}