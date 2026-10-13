'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackupButton({ companyId }: { companyId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = () => {
    setIsLoading(true);
    // Clear button loading state after 2s once browser download triggers
    setTimeout(() => setIsLoading(false), 2000);
    window.location.href = `/api/company/backup-zip?companyId=${companyId}`;
  };

  return (
    <Button 
      onClick={handleBackup}
      disabled={isLoading}
      variant="outline"
      className="mt-4 flex items-center gap-2"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {isLoading ? "Preparing Backup..." : "Download Full CSV Backup (ZIP)"}
    </Button>
  );
}
