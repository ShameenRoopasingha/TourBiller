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
    const billsRaw = await prisma.bill.findMany({
        where: { companyId },
        select: { id: true, totalAmountLKR: true, createdAt: true, billNumber: true, vehicleNo: true, customerName: true },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch Expenses
    const expensesRaw = await prisma.vehicleExpense.findMany({
        where: { companyId },
        select: { id: true, amount: true, date: true, vehicleNo: true, category: true, description: true },
        orderBy: { date: 'desc' }
    });

    // Sanitize dates for passing to Client Component
    const bills = billsRaw.map(b => ({
      id: b.id,
      billNumber: b.billNumber,
      vehicleNo: b.vehicleNo,
      customerName: b.customerName,
      totalAmountLKR: b.totalAmountLKR,
      createdAt: b.createdAt
    }));
    
    const expenses = expensesRaw.map(e => ({
      id: e.id,
      vehicleNo: e.vehicleNo,
      category: e.category,
      description: e.description,
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
