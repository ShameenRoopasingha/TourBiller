'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, parseISO } from 'date-fns';
import { 
  Printer, 
  BarChart3, 
  TableProperties, 
  Download, 
  Fuel, 
  Wrench, 
  Disc, 
  ShieldCheck, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/calculations';

type BillData = { 
  id: string; 
  billNumber: number | string; 
  vehicleNo: string; 
  customerName: string; 
  totalAmount: number; 
  createdAt: Date 
};

type ExpenseData = { 
  id: string; 
  vehicleNo: string; 
  category: string; 
  description: string | null; 
  amount: number; 
  date: Date 
};

interface BusinessProfileData {
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl?: string | null;
  currency?: string;
}

interface ReportsDashboardProps {
  bills: BillData[];
  expenses: ExpenseData[];
  businessProfile?: BusinessProfileData;
}

export interface PeriodSummary {
  key: string;
  label: string;
  income: number;
  fuel: number;
  service: number;
  tyres: number;
  insurance: number;
  driver: number;
  repairsOther: number;
  totalExpense: number;
  netProfit: number;
  marginPct: number;
  billCount: number;
  expenseCount: number;
}

/**
 * Classify raw expense records into operating cost buckets:
 * - fuel: Fuel, Diesel, Petrol
 * - service: Service, Oil change, Filters, Washing
 * - tyres: Tyre replacement / puncture / wear
 * - insurance: Insurance renewals, Revenue licenses
 * - driver: Driver daily fees, allowances, batta
 * - repairsOther: Repairs, Breakdowns, and other miscellaneous operating costs
 */
function classifyExpense(category: string, description?: string | null): 'fuel' | 'service' | 'tyres' | 'insurance' | 'driver' | 'repairsOther' {
  const cat = (category || '').toUpperCase().trim();
  const desc = (description || '').toLowerCase();

  if (cat === 'FUEL' || desc.includes('fuel') || desc.includes('petrol') || desc.includes('diesel')) {
    return 'fuel';
  }
  if (
    cat === 'SERVICE' || 
    cat === 'OIL_CHANGE' || 
    cat === 'FILTER_CHANGE' || 
    cat === 'BODY_WASH' ||
    desc.includes('service') ||
    desc.includes('oil change') ||
    desc.includes('filter') ||
    desc.includes('wash')
  ) {
    return 'service';
  }
  if (cat === 'TYRE' || cat === 'TIRE' || desc.includes('tyre') || desc.includes('tire')) {
    return 'tyres';
  }
  if (
    cat === 'INSURANCE' || 
    desc.includes('insurance') || 
    desc.includes('revenue license') ||
    desc.includes('license')
  ) {
    return 'insurance';
  }
  if (
    cat === 'DRIVER' || 
    desc.includes('driver') || 
    desc.includes('batta') || 
    desc.includes('allowance')
  ) {
    return 'driver';
  }
  return 'repairsOther';
}

export function ReportsDashboard({ bills, expenses, businessProfile }: ReportsDashboardProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [viewMode, setViewMode] = useState<'dashboard' | 'spreadsheet'>('spreadsheet');
  const [spreadsheetTab, setSpreadsheetTab] = useState<'summary' | 'income' | 'expenses'>('summary');

  const currency = businessProfile?.currency || 'LKR';
  const fmt = (val: number) => formatCurrency(val, currency);

  // Aggregate Data based on selected timeframe
  const aggregatedData = useMemo(() => {
    const map = new Map<string, PeriodSummary>();

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
      if (timeframe === 'weekly') return `Week of ${format(date, 'MMM dd, yyyy')}`;
      if (timeframe === 'monthly') return format(date, 'MMMM yyyy');
      if (timeframe === 'yearly') return format(date, 'yyyy');
      return key;
    };

    const getOrCreate = (key: string): PeriodSummary => {
      let item = map.get(key);
      if (!item) {
        item = {
          key,
          label: getLabel(key),
          income: 0,
          fuel: 0,
          service: 0,
          tyres: 0,
          insurance: 0,
          driver: 0,
          repairsOther: 0,
          totalExpense: 0,
          netProfit: 0,
          marginPct: 0,
          billCount: 0,
          expenseCount: 0,
        };
        map.set(key, item);
      }
      return item;
    };

    // Aggregate Income
    bills.forEach(b => {
      const key = getGroupKey(b.createdAt);
      const item = getOrCreate(key);
      item.income += b.totalAmount;
      item.billCount += 1;
    });

    // Aggregate Expenses into granular operating categories
    expenses.forEach(e => {
      const key = getGroupKey(e.date);
      const item = getOrCreate(key);
      const bucket = classifyExpense(e.category, e.description);

      if (bucket === 'fuel') item.fuel += e.amount;
      else if (bucket === 'service') item.service += e.amount;
      else if (bucket === 'tyres') item.tyres += e.amount;
      else if (bucket === 'insurance') item.insurance += e.amount;
      else if (bucket === 'driver') item.driver += e.amount;
      else item.repairsOther += e.amount;

      item.totalExpense += e.amount;
      item.expenseCount += 1;
    });

    // Calculate Net Profit and Margin for each period
    map.forEach(item => {
      item.netProfit = item.income - item.totalExpense;
      item.marginPct = item.income > 0 ? (item.netProfit / item.income) * 100 : 0;
    });

    // Sort by date key ascending
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(entry => entry[1]);

  }, [bills, expenses, timeframe]);

  // Grand Totals
  const totals = useMemo(() => {
    return aggregatedData.reduce(
      (acc, row) => ({
        income: acc.income + row.income,
        fuel: acc.fuel + row.fuel,
        service: acc.service + row.service,
        tyres: acc.tyres + row.tyres,
        insurance: acc.insurance + row.insurance,
        driver: acc.driver + row.driver,
        repairsOther: acc.repairsOther + row.repairsOther,
        totalExpense: acc.totalExpense + row.totalExpense,
        netProfit: acc.netProfit + row.netProfit,
        billCount: acc.billCount + row.billCount,
        expenseCount: acc.expenseCount + row.expenseCount,
      }),
      {
        income: 0,
        fuel: 0,
        service: 0,
        tyres: 0,
        insurance: 0,
        driver: 0,
        repairsOther: 0,
        totalExpense: 0,
        netProfit: 0,
        billCount: 0,
        expenseCount: 0,
      }
    );
  }, [aggregatedData]);

  const grandMarginPct = totals.income > 0 ? (totals.netProfit / totals.income) * 100 : 0;

  // Find max value for simple CSS bar chart scaling
  const maxVal = Math.max(...aggregatedData.map(d => Math.max(d.income, d.totalExpense)), 100);

  // Filter raw data for spreadsheet view based on timeframe
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

  // Export to CSV Function
  const exportToCsv = () => {
    const headers = [
      'Period',
      'Revenue (Income)',
      'Fuel Expense',
      'Service & Maintenance',
      'Tyres',
      'Insurance & Licenses',
      'Driver Charges',
      'Repairs & Other',
      'Total Expenses',
      'Net Profit',
      'Profit Margin %'
    ];

    const rows = aggregatedData.map(d => [
      `"${d.label.replace(/"/g, '""')}"`,
      d.income.toFixed(2),
      d.fuel.toFixed(2),
      d.service.toFixed(2),
      d.tyres.toFixed(2),
      d.insurance.toFixed(2),
      d.driver.toFixed(2),
      d.repairsOther.toFixed(2),
      d.totalExpense.toFixed(2),
      d.netProfit.toFixed(2),
      `${d.marginPct.toFixed(1)}%`
    ]);

    const summaryRow = [
      '"GRAND TOTAL"',
      totals.income.toFixed(2),
      totals.fuel.toFixed(2),
      totals.service.toFixed(2),
      totals.tyres.toFixed(2),
      totals.insurance.toFixed(2),
      totals.driver.toFixed(2),
      totals.repairsOther.toFixed(2),
      totals.totalExpense.toFixed(2),
      totals.netProfit.toFixed(2),
      `${grandMarginPct.toFixed(1)}%`
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.join(',')), summaryRow.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_performance_${timeframe}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const companyName = businessProfile?.companyName || 'VIGIL';
  const address = businessProfile?.address || '';
  const phone = businessProfile?.phone || '';
  const email = businessProfile?.email || '';

  return (
    <div className="space-y-6 print:space-y-4 print:mx-auto print:bg-white print:text-black">
      {/* Inject print styles for perfect A4 landscape or portrait printing */}
      <style jsx global>{`
        @media print {
            @page {
                size: A4 landscape;
                margin: 8mm;
            }
            body {
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }
      `}</style>

      {/* Print-only Beautiful Letterhead */}
      <div className="hidden print:block mb-6 pb-3 border-b-2 border-black">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {businessProfile?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={businessProfile.logoUrl} alt="Logo" className="h-14 w-14 object-cover rounded-full" />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">{companyName}</h1>
              <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">
                  {address && <>{address}<br /></>}
                  {phone && <>Tel: {phone}</>}
                  {email && <> | Email: {email}</>}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-blue-700 uppercase">
              Financial Operating Statement
            </h2>
            <p className="text-xs text-gray-700 mt-0.5">Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            <p className="text-xs font-medium mt-1 uppercase border px-2 py-0.5 inline-block rounded">
              Period View: {timeframe} ({currency})
            </p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 print:hidden">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <Tabs defaultValue="monthly" value={timeframe} onValueChange={(v: any) => setTimeframe(v)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 sm:w-[400px]">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button onClick={() => setViewMode('spreadsheet')} variant={viewMode === 'spreadsheet' ? 'default' : 'outline'} size="sm" className="flex-1 sm:flex-none">
            <TableProperties className="h-4 w-4 mr-2" />
            Spreadsheet
          </Button>
          <Button onClick={() => setViewMode('dashboard')} variant={viewMode === 'dashboard' ? 'default' : 'outline'} size="sm" className="flex-1 sm:flex-none">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytical
          </Button>
          <Button onClick={exportToCsv} variant="outline" size="sm" className="flex-none items-center gap-1.5" title="Export Spreadsheet (CSV)">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="flex-none items-center gap-1.5" title="Print Statement">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 mb-6">
        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground print:text-black">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-green-600 print:text-green-800">
              {fmt(totals.income)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totals.billCount} bill(s) recorded</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground print:text-black">Operating Expenses</CardTitle>
            <Wrench className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-red-600 print:text-red-800">
              {fmt(totals.totalExpense)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totals.expenseCount} expense record(s)</p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground print:text-black">Net Profit</CardTitle>
            {totals.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-xl font-bold ${totals.netProfit >= 0 ? 'text-blue-600 print:text-blue-800' : 'text-red-600 print:text-red-800'}`}>
              {fmt(totals.netProfit)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Margin: <span className="font-semibold">{grandMarginPct.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="print:shadow-none print:border-gray-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground print:text-black">Operating Cost Pillars</CardTitle>
            <Layers className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1"><Fuel className="h-3 w-3 text-blue-500" /> Fuel:</span>
              <span className="font-medium">{fmt(totals.fuel)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1"><Disc className="h-3 w-3 text-indigo-500" /> Tyres & Service:</span>
              <span className="font-medium">{fmt(totals.service + totals.tyres)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Financial Operating Spreadsheet Table (Rendered in both screen and print) */}
      <Card className="print:border-none print:shadow-none">
        <CardHeader className="py-4 print:px-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <CardTitle className="text-lg">Periodic Financial Performance Spreadsheet</CardTitle>
              <CardDescription>
                Detailed breakdown of income, operating expenses (Fuel, Service, Tyres, Insurance, Driver, Repairs), and net margin by {timeframe}.
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground font-mono print:hidden">
              Currency: <span className="font-bold text-foreground">{currency}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:px-0">
          {aggregatedData.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">No financial records found for this period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border print:border-gray-400 rounded-lg print:rounded-none max-h-[650px] print:max-h-none print:overflow-visible scrollbar-thin">
              <table className="w-full text-xs text-left relative print:text-black border-collapse">
                <thead className="text-[11px] uppercase bg-muted/90 print:bg-gray-100 text-muted-foreground print:text-black font-semibold border-b sticky top-0 z-10" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <tr>
                    <th className="px-3 py-2.5 print:border print:border-gray-300">Period</th>
                    <th className="px-3 py-2.5 print:border print:border-gray-300 text-right text-green-700 dark:text-green-400">Revenue</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-blue-700 dark:text-blue-400">Fuel</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-purple-700 dark:text-purple-400">Service</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-indigo-700 dark:text-indigo-400">Tyres</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-emerald-700 dark:text-emerald-400">Insurance</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-sky-700 dark:text-sky-400">Driver</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right text-orange-700 dark:text-orange-400">Repairs/Other</th>
                    <th className="px-3 py-2.5 print:border print:border-gray-300 text-right text-red-700 dark:text-red-400 font-bold">Total Expenses</th>
                    <th className="px-3 py-2.5 print:border print:border-gray-300 text-right font-bold">Net Profit</th>
                    <th className="px-2.5 py-2.5 print:border print:border-gray-300 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {aggregatedData.map((row, idx) => {
                    const isPositive = row.netProfit >= 0;
                    return (
                      <tr key={row.key} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/15'} hover:bg-muted/40 transition-colors print:border-b print:border-gray-200`}>
                        <td className="px-3 py-2 print:border print:border-gray-300 font-medium whitespace-nowrap">
                          {row.label}
                        </td>
                        <td className="px-3 py-2 print:border print:border-gray-300 text-right font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                          {fmt(row.income)}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {row.fuel > 0 ? fmt(row.fuel) : '-'}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {row.service > 0 ? fmt(row.service) : '-'}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {row.tyres > 0 ? fmt(row.tyres) : '-'}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {row.insurance > 0 ? fmt(row.insurance) : '-'}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {row.driver > 0 ? fmt(row.driver) : '-'}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-orange-600 dark:text-orange-400 whitespace-nowrap">
                          {row.repairsOther > 0 ? fmt(row.repairsOther) : '-'}
                        </td>
                        <td className="px-3 py-2 print:border print:border-gray-300 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          {fmt(row.totalExpense)}
                        </td>
                        <td className={`px-3 py-2 print:border print:border-gray-300 text-right font-bold whitespace-nowrap ${isPositive ? 'text-blue-600 print:text-blue-800' : 'text-red-600 print:text-red-800'}`}>
                          {fmt(row.netProfit)}
                        </td>
                        <td className="px-2.5 py-2 print:border print:border-gray-300 text-right text-muted-foreground whitespace-nowrap">
                          {row.marginPct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/80 print:bg-gray-100 font-bold border-t-2 border-border text-[11px]" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <tr>
                    <td className="px-3 py-3 print:border print:border-gray-300 text-left uppercase">GRAND TOTAL</td>
                    <td className="px-3 py-3 print:border print:border-gray-300 text-right text-green-700 dark:text-green-400 whitespace-nowrap">{fmt(totals.income)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-blue-700 dark:text-blue-400 whitespace-nowrap">{fmt(totals.fuel)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-purple-700 dark:text-purple-400 whitespace-nowrap">{fmt(totals.service)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-indigo-700 dark:text-indigo-400 whitespace-nowrap">{fmt(totals.tyres)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-emerald-700 dark:text-emerald-400 whitespace-nowrap">{fmt(totals.insurance)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-sky-700 dark:text-sky-400 whitespace-nowrap">{fmt(totals.driver)}</td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right text-orange-700 dark:text-orange-400 whitespace-nowrap">{fmt(totals.repairsOther)}</td>
                    <td className="px-3 py-3 print:border print:border-gray-300 text-right text-red-700 dark:text-red-400 whitespace-nowrap">{fmt(totals.totalExpense)}</td>
                    <td className={`px-3 py-3 print:border print:border-gray-300 text-right whitespace-nowrap ${totals.netProfit >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      {fmt(totals.netProfit)}
                    </td>
                    <td className="px-2.5 py-3 print:border print:border-gray-300 text-right whitespace-nowrap">
                      {grandMarginPct.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytical Visual Comparison Mode */}
      {viewMode === 'dashboard' && aggregatedData.length > 0 && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
            <CardDescription>Visual comparison across {timeframe} periods</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max h-64 items-end pt-6">
                {aggregatedData.map((data, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group">
                    <div className="flex gap-1 h-48 items-end">
                      {/* Income Bar */}
                      <div 
                        className="w-10 bg-green-500 rounded-t-sm hover:bg-green-600 transition-all relative"
                        style={{ height: `${(data.income / maxVal) * 100}%`, minHeight: data.income > 0 ? '4px' : '0' }}
                        title={`Income: ${fmt(data.income)}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1.5 py-0.5 rounded z-10 whitespace-nowrap">
                          {fmt(data.income)}
                        </span>
                      </div>
                      {/* Expense Bar */}
                      <div 
                        className="w-10 bg-red-500 rounded-t-sm hover:bg-red-600 transition-all relative"
                        style={{ height: `${(data.totalExpense / maxVal) * 100}%`, minHeight: data.totalExpense > 0 ? '4px' : '0' }}
                        title={`Expense: ${fmt(data.totalExpense)}`}
                      >
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-1.5 py-0.5 rounded z-10 whitespace-nowrap">
                          {fmt(data.totalExpense)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground max-w-[90px] text-center truncate px-0.5">
                      {data.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-4 justify-center text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-500 rounded-xs"></div> Total Revenue</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded-xs"></div> Operating Expenses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spreadsheet Detailed Logs (Income Log & Expense Log) */}
      {viewMode === 'spreadsheet' && (
        <div className="space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex gap-2">
              <Button 
                variant={spreadsheetTab === 'summary' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setSpreadsheetTab('summary')}
                className="text-xs"
              >
                Summary Info
              </Button>
              <Button 
                variant={spreadsheetTab === 'income' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setSpreadsheetTab('income')}
                className="text-xs"
              >
                Income Log (Bills: {filteredBills.length})
              </Button>
              <Button 
                variant={spreadsheetTab === 'expenses' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setSpreadsheetTab('expenses')}
                className="text-xs"
              >
                Expense Log ({filteredExpenses.length})
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              Period records: current {timeframe === 'daily' ? 'day' : timeframe.replace('ly', '')}
            </span>
          </div>

          {spreadsheetTab === 'income' && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold text-green-600 flex items-center justify-between">
                  <span>Customer Income Invoices</span>
                  <span>Total: {fmt(filteredBills.reduce((s, b) => s + b.totalAmount, 0))}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto border rounded-md max-h-[450px] scrollbar-thin">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="text-[11px] uppercase bg-muted/80 text-muted-foreground border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Bill No</th>
                        <th className="px-3 py-2">Vehicle</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredBills.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">No income recorded for this period</td></tr>
                      ) : filteredBills.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap">{format(new Date(b.createdAt), 'MMM dd, yyyy')}</td>
                          <td className="px-3 py-2 font-medium">{b.billNumber}</td>
                          <td className="px-3 py-2">{b.vehicleNo}</td>
                          <td className="px-3 py-2 truncate max-w-[160px]" title={b.customerName}>{b.customerName}</td>
                          <td className="px-3 py-2 text-right font-bold text-green-600">{fmt(b.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {spreadsheetTab === 'expenses' && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold text-red-600 flex items-center justify-between">
                  <span>Operating Expenses Log</span>
                  <span>Total: {fmt(filteredExpenses.reduce((s, e) => s + e.amount, 0))}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto border rounded-md max-h-[450px] scrollbar-thin">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="text-[11px] uppercase bg-muted/80 text-muted-foreground border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Vehicle</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Classification</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredExpenses.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">No expenses recorded for this period</td></tr>
                      ) : filteredExpenses.map((e) => {
                        const classification = classifyExpense(e.category, e.description);
                        return (
                          <tr key={e.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2 whitespace-nowrap">{format(new Date(e.date), 'MMM dd, yyyy')}</td>
                            <td className="px-3 py-2 font-medium">{e.vehicleNo}</td>
                            <td className="px-3 py-2 font-mono text-[10px] uppercase">{e.category.replace('_', ' ')}</td>
                            <td className="px-3 py-2">
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-muted">
                                {classification}
                              </span>
                            </td>
                            <td className="px-3 py-2 truncate max-w-[200px]" title={e.description || '-'}>{e.description || '-'}</td>
                            <td className="px-3 py-2 text-right font-bold text-red-600">{fmt(e.amount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
