import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col justify-center items-center p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          Vehicle Hire Billing System
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Streamline your transport business with professional invoice generation, automated calculations, and fleet management.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8">
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
            <h3 className="font-bold text-lg mb-2">Automated Billing</h3>
            <p className="text-muted-foreground">Calculate charges instantly based on distance, waiting time, and vehicle category.</p>
          </div>
          <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
            <h3 className="font-bold text-lg mb-2">Fleet Management</h3>
            <p className="text-muted-foreground">Keep track of your vehicle fleet and customer database in one centralized system.</p>
          </div>
          <div className="p-6 bg-card rounded-xl shadow-sm border border-border">
            <h3 className="font-bold text-lg mb-2">Professional Invoices</h3>
            <p className="text-muted-foreground">Generate and print clean, professional-grade invoices for your clients.</p>
          </div>
        </div>
      </div>
    </main>
  );
}