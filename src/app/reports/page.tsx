import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReportsDashboard } from './ReportsDashboard';

export const metadata = {
  title: 'Reports | TourBiller',
  description: 'Financial reports for your business',
};

export default async function ReportsPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        redirect('/login');
    }

    const companyId = user.companyId;

    // Fetch Income (Bills)
    // We only select the fields needed to minimize data transfer
    const billsRaw = await prisma.bill.findMany({
        where: { companyId },
        select: { totalAmountLKR: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
    });

    // Fetch Expenses
    const expensesRaw = await prisma.vehicleExpense.findMany({
        where: { companyId },
        select: { amount: true, date: true },
        orderBy: { date: 'asc' }
    });

    // Sanitize dates for passing to Client Component (Client components need plain serializable objects in some setups, though Date works usually in Next 13+)
    const bills = billsRaw.map(b => ({
      totalAmountLKR: b.totalAmountLKR,
      createdAt: b.createdAt
    }));
    
    const expenses = expensesRaw.map(e => ({
      amount: e.amount,
      date: e.date
    }));

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 print:py-0 print:px-0">
            <div className="mb-8 print:hidden">
                <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                <p className="text-muted-foreground mt-2">Analyze your income and expenses with daily, weekly, monthly, and yearly breakdowns.</p>
            </div>
            
            <ReportsDashboard bills={bills} expenses={expenses} />
        </div>
    );
}
