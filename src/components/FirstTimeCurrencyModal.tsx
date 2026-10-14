'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Coins, 
    Check, 
    ArrowRight, 
    Loader2, 
    Globe2, 
    Sparkles,
    RefreshCw,
    MapPin
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { notify } from '@/lib/notifications';

interface FirstTimeCurrencyModalProps {
    isOpenInitially: boolean;
    currentCurrency?: string;
    currentUsdRate?: number;
    companyName?: string;
    currentCountryCode?: string;
    currentCountryName?: string;
}

export interface CountryOption {
    code: string;
    name: string;
    flag: string;
    defaultCurrency: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
    { code: 'lk', name: 'Sri Lanka', flag: '🇱🇰', defaultCurrency: 'LKR' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', defaultCurrency: 'GBP' },
    { code: 'ae', name: 'United Arab Emirates', flag: '🇦🇪', defaultCurrency: 'AED' },
    { code: 'us', name: 'United States', flag: '🇺🇸', defaultCurrency: 'USD' },
    { code: 'au', name: 'Australia', flag: '🇦🇺', defaultCurrency: 'AUD' },
    { code: 'in', name: 'India', flag: '🇮🇳', defaultCurrency: 'INR' },
    { code: 'ca', name: 'Canada', flag: '🇨🇦', defaultCurrency: 'CAD' },
    { code: 'sg', name: 'Singapore', flag: '🇸🇬', defaultCurrency: 'SGD' },
    { code: 'th', name: 'Thailand', flag: '🇹🇭', defaultCurrency: 'THB' },
    { code: 'my', name: 'Malaysia', flag: '🇲🇾', defaultCurrency: 'MYR' },
    { code: 'nz', name: 'New Zealand', flag: '🇳🇿', defaultCurrency: 'NZD' },
    { code: 'de', name: 'Germany', flag: '🇩🇪', defaultCurrency: 'EUR' },
    { code: 'fr', name: 'France', flag: '🇫🇷', defaultCurrency: 'EUR' },
    { code: 'global', name: 'Global / Other Country', flag: '🌐', defaultCurrency: 'USD' },
];

const SUPPORTED_CURRENCIES = [
    { code: 'LKR', symbol: 'Rs.', label: 'Sri Lankan Rupee', region: 'Sri Lanka (Domestic Hire)' },
    { code: 'USD', symbol: '$', label: 'US Dollar', region: 'Global / International Standard' },
    { code: 'EUR', symbol: '€', label: 'Euro', region: 'European Union' },
    { code: 'GBP', symbol: '£', label: 'British Pound', region: 'United Kingdom' },
    { code: 'AED', symbol: 'AED', label: 'UAE Dirham', region: 'United Arab Emirates' },
    { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', region: 'Australia' },
    { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', region: 'Canada' },
    { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', region: 'Singapore' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee', region: 'India' },
    { code: 'THB', symbol: '฿', label: 'Thai Baht', region: 'Thailand' },
];

export function FirstTimeCurrencyModal({
    isOpenInitially,
    currentCurrency = 'LKR',
    currentUsdRate = 300,
    companyName = 'Vigil',
    currentCountryCode = 'lk',
    currentCountryName = 'Sri Lanka',
}: FirstTimeCurrencyModalProps) {
    const [open, setOpen] = useState(isOpenInitially);
    const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
    const [selectedCountryCode, setSelectedCountryCode] = useState(currentCountryCode || 'lk');
    const [selectedCountryName, setSelectedCountryName] = useState(currentCountryName || 'Sri Lanka');
    const [usdRate, setUsdRate] = useState<number | string>(currentUsdRate || 300);
    const [loading, setLoading] = useState(false);
    const [syncingRate, setSyncingRate] = useState(false);
    const router = useRouter();

    const handleCountryChange = (countryCode: string) => {
        setSelectedCountryCode(countryCode);
        const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
        if (country) {
            setSelectedCountryName(country.name);
            setSelectedCurrency(country.defaultCurrency);
        }
    };

    const handleCurrencySelect = (code: string) => {
        setSelectedCurrency(code);
        const matchedCountry = SUPPORTED_COUNTRIES.find((c) => c.defaultCurrency === code);
        if (matchedCountry && selectedCountryCode === 'lk' && code !== 'LKR') {
            setSelectedCountryCode(matchedCountry.code);
            setSelectedCountryName(matchedCountry.name);
        } else if (code === 'LKR') {
            setSelectedCountryCode('lk');
            setSelectedCountryName('Sri Lanka');
        }
    };

    const handleSyncLiveRate = async () => {
        setSyncingRate(true);
        try {
            const res = await fetch('/api/exchange-rate?from=USD&to=LKR');
            const data = await res.json();
            if (data.success && data.rate) {
                const roundedRate = Math.round(data.rate * 10) / 10;
                setUsdRate(roundedRate);
                notify.success(`Synced live exchange rate: 1 USD = Rs. ${roundedRate}`);
            } else {
                notify.error('Failed to fetch live exchange rate');
            }
        } catch (e) {
            console.error('Error syncing live rate:', e);
            notify.error('Network error fetching exchange rate');
        } finally {
            setSyncingRate(false);
        }
    };

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/business-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currency: selectedCurrency,
                    usdRate: typeof usdRate === 'number' ? usdRate : parseFloat(usdRate) || 300,
                    countryCode: selectedCountryCode,
                    countryName: selectedCountryName,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                notify.success(`Configured for ${selectedCountryName} (${selectedCurrency})`);
                setOpen(false);
                router.refresh();
            } else {
                notify.error(data.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving initial configuration:', error);
            notify.error('Failed to save configuration. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent 
                showCloseButton={true}
                className="sm:max-w-[540px] max-h-[92vh] flex flex-col p-0 overflow-hidden border-border/80 shadow-2xl"
            >
                {/* Header Banner - Fixed at top */}
                <div className="shrink-0 bg-gradient-to-r from-primary/15 via-blue-500/10 to-primary/5 p-4 sm:p-5 border-b border-border/60">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Initial Fleet & Regional Setup
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                            <Globe2 className="w-5 h-5 text-primary shrink-0" />
                            Select Your Country & Operating Currency
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                            Welcome to <strong>{companyName}</strong>! Select your operating country and billing currency. This sets your default rates and optimizes live map route routing for your country.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Form Wrapper with Scrollable Content and Sticky Footer */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
                        {/* Operating Country Selection */}
                        <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    Operating Country / Region
                                </span>
                                <span className="text-[11px] font-normal text-primary font-mono uppercase">
                                    Map Code: {selectedCountryCode}
                                </span>
                            </Label>
                            <select
                                value={selectedCountryCode}
                                onChange={(e) => handleCountryChange(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
                            >
                                {SUPPORTED_COUNTRIES.map((country) => (
                                    <option key={country.code} value={country.code}>
                                        {country.flag} {country.name} ({country.code.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-muted-foreground">
                                Live route search and waypoint geocoding will prioritize <strong>{selectedCountryName}</strong> while supporting global locations.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                <span>Operational Currency</span>
                                <span className="text-[11px] font-normal lowercase text-muted-foreground">Select one</span>
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {SUPPORTED_CURRENCIES.map((curr) => {
                                    const isSelected = selectedCurrency === curr.code;
                                    return (
                                        <button
                                            key={curr.code}
                                            type="button"
                                            onClick={() => handleCurrencySelect(curr.code)}
                                            className={`flex items-start justify-between p-2.5 rounded-lg border text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                                                    : 'border-border/80 hover:border-primary/40 hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-sm text-foreground">{curr.code}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">({curr.symbol})</span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                                    {curr.region}
                                                </p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                isSelected ? 'bg-primary text-primary-foreground' : 'border border-border'
                                            }`}>
                                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Secondary USD Exchange Rate Setting if Local LKR is chosen */}
                        {selectedCurrency === 'LKR' && (
                            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                        <Globe2 className="w-4 h-4 text-primary shrink-0" />
                                        <span>Foreign Tourist Quotation Conversion</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={syncingRate}
                                        onClick={handleSyncLiveRate}
                                        className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/20 shrink-0"
                                    >
                                        <RefreshCw className={`w-3 h-3 ${syncingRate ? 'animate-spin' : ''}`} />
                                        Sync Live Rate
                                    </Button>
                                </div>
                                <p className="text-muted-foreground text-[11px]">
                                    When generating quotations for international tourists, the system automatically displays USD equivalents using this rate.
                                </p>
                                <div className="flex items-center gap-2 pt-0.5">
                                    <Label htmlFor="usdRateInput" className="text-xs text-muted-foreground shrink-0">
                                        1 USD = Rs.
                                    </Label>
                                    <Input
                                        id="usdRateInput"
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        value={usdRate}
                                        onChange={(e) => setUsdRate(e.target.value)}
                                        className="h-8 text-xs font-semibold w-28"
                                        placeholder="300.0"
                                    />
                                </div>
                            </div>
                        )}

                        {selectedCurrency !== 'LKR' && (
                            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                                All vehicle rates, packages, and client bills will be calculated directly in <strong>{selectedCurrency}</strong>.
                            </div>
                        )}
                    </div>

                    {/* Fixed Footer - Always Visible and Clickable */}
                    <div className="shrink-0 p-4 sm:p-5 pt-3 bg-muted/20 border-t border-border/60">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full font-semibold shadow-md gap-2"
                            size="default"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving Configuration...
                                </>
                            ) : (
                                <>
                                    Save & Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                        <p className="text-[11px] text-center text-muted-foreground mt-1.5">
                            This sets your company default. You only need to set this once.
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
