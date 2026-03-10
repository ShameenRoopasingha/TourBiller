'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
    placeholder?: string;
}

export function SearchInput({ placeholder = 'Search...' }: SearchInputProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const updateSearch = useCallback(
        (value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set('q', value);
            } else {
                params.delete('q');
            }
            router.replace(`${pathname}?${params.toString()}`);
        },
        [router, pathname, searchParams]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            updateSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, updateSearch]);

    return (
        <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
        </div>
    );
}
