import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold">404</h1>
                    <h2 className="text-xl font-semibold">Page Not Found</h2>
                    <p className="text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/">
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    );
}
