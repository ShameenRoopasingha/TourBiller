'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, subDays } from 'date-fns';

type BillData = { totalAmountLKR: number; createdAt: Date };
type ExpenseData = { amount: number; date: Date };

interface ReportsDashboardProps {
  bills: BillData[];
  expenses: ExpenseData[];
}

export function ReportsDashboard({ bills, expenses }: ReportsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Aggregate Data based on selected timeframe
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; label: string }>();

    // Helper to get group key
    const getGroupKey = (d: Date) => {
      const date = new Date(d);
      if (timeframe === 'daily') return format(date, 'yyyy-MM-dd');
      if (timeframe === 'weekly') return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (timeframe === 'monthly') return format(startOfMonth(date), 'yyyy-MM');
      if (timeframe === 'yearly') return format(startOfYear(date), 'yyyy');
      return format(date, 'yyyy-MM-dd');
    };

    // Helper to get nice label
    const getLabel = (key: string) => {
      const date = parseISO(key.length === 4 ? `${key}-01-01` : key.length === 7 ? `${key}-01` : key);
      if (timeframe === 'daily') return format(date, 'MMM dd, yyyy');
      if (timeframe === 'weekly') return `Week of ${format(date, 'MMM dd')}`;
      if (timeframe === 'monthly') return format(date, 'MMMM yyyy');
      if (timeframe === 'yearly') return format(date, 'yyyy');
      return key;
    };

    // Aggregate Income
    bills.forEach(b => {
      const key = getGroupKey(b.createdAt);
      const existing = map.get(key) || { income: 0, expense: 0, label: getLabel(key) };
      existing.income += b.totalAmountLKR;
      map.set(key, existing);
    });

    // Aggregate Expenses
    expenses.forEach(e => {
      const key = getGroupKey(e.date);
      const existing = map.get(key) || { income: 0, expense: 0, label: getLabel(key) };
      existing.expense += e.amount;
      map.set(key, existing);
    });

    // Sort by date key ascending
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);

  }, [bills, expenses, timeframe]);

  // Calculate Totals for the view
  const totalIncome = aggregatedData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = aggregatedData.reduce((sum, item) => sum + item.expense, 0);
  const netProfit = totalIncome - totalExpense;

  // Find max value for simple CSS bar chart scaling
  const maxVal = Math.max(...aggregatedData.map(d => Math.max(d.income, d.expense)), 100);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="monthly" value={timeframe} onValueChange={(v: any) => setTimeframe(v)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rs. {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rs. {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Rs. {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {aggregatedData.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/10">
            <p className="text-muted-foreground">No financial data found for this view.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses Chart</CardTitle>
                <CardDescription>Visual breakdown by {timeframe}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto pb-4">
                  <div className="flex gap-4 min-w-max h-64 items-end pt-6">
                    {aggregatedData.map((data, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 group">
                        <div className="flex gap-1 h-48 items-end">
                          {/* Income Bar */}
                          <div 
                            className="w-12 bg-green-500 rounded-t-md hover:bg-green-600 transition-all relative"
                            style={{ height: `${(data.income / maxVal) * 100}%`, minHeight: data.income > 0 ? '4px' : '0' }}
                            title={`Income: Rs. ${data.income.toLocaleString()}`}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1 py-0.5 rounded z-10 whitespace-nowrap">
                              Rs. {data.income.toLocaleString()}
                            </span>
                          </div>
                          {/* Expense Bar */}
                          <div 
                            className="w-12 bg-red-500 rounded-t-md hover:bg-red-600 transition-all relative"
                            style={{ height: `${(data.expense / maxVal) * 100}%`, minHeight: data.expense > 0 ? '4px' : '0' }}
                            title={`Expense: Rs. ${data.expense.toLocaleString()}`}
                          >
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1 py-0.5 rounded z-10 whitespace-nowrap">
                              Rs. {data.expense.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground max-w-[100px] text-center truncate px-1">
                          {data.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-4 justify-center text-sm">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Income</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Expenses</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Report Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-3">Period ({timeframe})</th>
                        <th className="px-4 py-3 text-right">Income (Rs.)</th>
                        <th className="px-4 py-3 text-right">Expense (Rs.)</th>
                        <th className="px-4 py-3 text-right">Profit (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedData.map((data, i) => {
                        const profit = data.income - data.expense;
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{data.label}</td>
                            <td className="px-4 py-3 text-right text-green-600">{data.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-4 py-3 text-right text-red-600">{data.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className={`px-4 py-3 text-right font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}
