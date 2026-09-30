'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO, subDays } from 'date-fns';
import { Printer, BarChart3, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BillData = { id: string; billNumber: number | string; vehicleNo: string; customerName: string; totalAmount: number; createdAt: Date };
type ExpenseData = { id: string; vehicleNo: string; category: string; description: string | null; amount: number; date: Date };

interface ReportsDashboardProps {
  bills: BillData[];
  expenses: ExpenseData[];
}

export function ReportsDashboard({ bills, expenses }: ReportsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [viewMode, setViewMode] = useState<'dashboard' | 'spreadsheet'>('dashboard');

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
      existing.income += b.totalAmount;
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

  // Filter data for spreadsheet view based on timeframe
  const filteredBills = useMemo(() => {
    const now = new Date();
    return bills.filter(b => {
      const date = new Date(b.createdAt);
      if (timeframe === 'daily') return date >= startOfDay(now);
      if (timeframe === 'weekly') return date >= startOfWeek(now, { weekStartsOn: 1 });
      if (timeframe === 'monthly') return date >= startOfMonth(now);
      if (timeframe === 'yearly') return date >= startOfYear(now);
      return true;
    });
  }, [bills, timeframe]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const date = new Date(e.date);
      if (timeframe === 'daily') return date >= startOfDay(now);
      if (timeframe === 'weekly') return date >= startOfWeek(now, { weekStartsOn: 1 });
      if (timeframe === 'monthly') return date >= startOfMonth(now);
      if (timeframe === 'yearly') return date >= startOfYear(now);
      return true;
    });
  }, [expenses, timeframe]);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print-only title */}
      <div className="hidden print:block mb-6">
        <h2 className="text-2xl font-bold">Financial Report</h2>
        <p className="text-sm text-gray-500">Generated on {format(new Date(), 'MMM dd, yyyy')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {viewMode === 'spreadsheet' && (
            <div>
              <h2 className="text-lg font-semibold">Descriptive Spreadsheet View</h2>
              <p className="text-sm text-muted-foreground mb-2">Showing records for the current {timeframe.replace('ly', '')}.</p>
            </div>
          )}
          <Tabs defaultValue="monthly" value={timeframe} onValueChange={(v: any) => setTimeframe(v)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 sm:w-[400px]">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setViewMode('dashboard')} variant={viewMode === 'dashboard' ? 'default' : 'outline'} size="sm" className="flex-1 sm:flex-none">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button onClick={() => setViewMode('spreadsheet')} variant={viewMode === 'spreadsheet' ? 'default' : 'outline'} size="sm" className="flex-1 sm:flex-none">
            <TableProperties className="h-4 w-4 mr-2" />
            Spreadsheet
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="flex-none items-center gap-2">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 print:grid-cols-3 mb-8">
            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                <CardTitle className="text-sm font-medium print:text-black">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 print:text-green-800">
                  Rs. {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                <CardTitle className="text-sm font-medium print:text-black">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 print:text-red-800">
                  Rs. {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card className="print:shadow-none print:border-gray-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 print:pb-1">
                <CardTitle className="text-sm font-medium print:text-black">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600 print:text-blue-800' : 'text-red-600 print:text-red-800'}`}>
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

                  {/* Print Only Data Table for Analytical View */}
                  <div className="hidden print:block mt-6">
                    <table className="w-full text-sm border-collapse border border-gray-300 text-black">
                      <thead>
                        <tr className="bg-gray-100/50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                          <th className="border border-gray-300 px-4 py-3 text-left">Period ({timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})</th>
                          <th className="border border-gray-300 px-4 py-3 text-right">Income (Rs.)</th>
                          <th className="border border-gray-300 px-4 py-3 text-right">Expenses (Rs.)</th>
                          <th className="border border-gray-300 px-4 py-3 text-right">Net Profit (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregatedData.map((d, i) => {
                          const profit = d.income - d.expense;
                          return (
                            <tr key={i} className="border-b border-gray-200">
                              <td className="border border-gray-300 px-4 py-2 font-medium">{d.label}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right text-green-800">{d.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className="border border-gray-300 px-4 py-2 text-right text-red-800">{d.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              <td className={`border border-gray-300 px-4 py-2 text-right font-bold ${profit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                                {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100/50 font-bold" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <tr>
                          <td className="border border-gray-300 px-4 py-3 text-left">GRAND TOTAL</td>
                          <td className="border border-gray-300 px-4 py-3 text-right text-green-800">{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="border border-gray-300 px-4 py-3 text-right text-red-800">{totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`border border-gray-300 px-4 py-3 text-right ${netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                            {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Income Spreadsheet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Income Log (Bills)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg max-h-[600px] scrollbar-thin">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/90 backdrop-blur-sm border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Bill No</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No income recorded in this period</td></tr>
                    ) : filteredBills.map((b) => (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(b.createdAt), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 font-medium">{b.billNumber}</td>
                        <td className="px-4 py-3">{b.vehicleNo}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={b.customerName}>{b.customerName}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t font-semibold">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right">Total Income:</td>
                      <td className="px-4 py-3 text-right text-green-700">
                        {filteredBills.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Spreadsheet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Expense Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg max-h-[600px] scrollbar-thin">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/90 backdrop-blur-sm border-b sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No expenses recorded in this period</td></tr>
                    ) : filteredExpenses.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(e.date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-3 font-medium">{e.vehicleNo}</td>
                        <td className="px-4 py-3 text-xs">{e.category.replace('_', ' ')}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]" title={e.description || '-'}>{e.description || '-'}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50 border-t font-semibold">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right">Total Expenses:</td>
                      <td className="px-4 py-3 text-right text-red-700">
                        {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}



