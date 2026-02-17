
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Vehicle Hire Billing System
          </h1>
          <p className="text-lg text-muted-foreground">
            Create professional vehicle hire invoices with automatic calculations
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