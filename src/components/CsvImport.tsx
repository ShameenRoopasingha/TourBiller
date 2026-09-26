'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CsvImport({ companyId }: { companyId: string }) {
  const [entityType, setEntityType] = useState<string>('customers');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);
    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/company/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId,
              entityType,
              data: results.data
            })
          });

          const resData = await response.json();

          if (response.ok) {
            setMessage({ type: 'success', text: `සාර්ථකයි! අලුතෙන් records ${resData.importedCount} ක් import කළා.` });
          } else {
            setMessage({ type: 'error', text: resData.error || 'Import කිරීම අසාර්ථකයි.' });
          }
        } catch (err) {
          setMessage({ type: 'error', text: 'Server එකට connect වෙන්න බැරි වුණා.' });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        setMessage({ type: 'error', text: 'CSV file එක read කරන්න බැරි වුණා.' });
        setIsUploading(false);
      }
    });
  };

  const downloadTemplate = () => {
    let csvContent = "";
    if (entityType === 'customers') {
      csvContent = "Name,Mobile,Email,Address\nKamal Perera,0771234567,kamal@email.com,Colombo";
    } else {
      csvContent = "Vehicle No,Model,Category,Rate Per Day,Km Per Day\nWP-CAA-1234,Toyota Aqua,CAR,10000,100";
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}_template.csv`;
    a.click();
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
      <h3 className="font-medium text-lg">CSV Bulk Import (අලුතෙන් Data ඇතුලත් කිරීම)</h3>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-48">
          <select 
            value={entityType} 
            onChange={(e) => setEntityType(e.target.value)}
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="customers" className="bg-background text-foreground">Customers</option>
            <option value="vehicles" className="bg-background text-foreground">Vehicles</option>
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <input 
          type="file" 
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? 'Importing...' : 'Upload CSV File'}
        </Button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
