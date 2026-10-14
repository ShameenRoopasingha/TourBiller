'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { BusinessProfileFormSchema, type BusinessProfileFormInput, type BusinessProfile } from '@/lib/validations';

// For backward compatibility
export type BusinessProfileFormData = BusinessProfileFormInput;
import { useEnterNavigation } from '@/hooks/useEnterNavigation';
import { SUPPORTED_COUNTRIES } from '@/components/FirstTimeCurrencyModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BusinessProfileFormProps {
    initialData?: BusinessProfile;
}

export function BusinessProfileForm({ initialData }: BusinessProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncingRate, setIsSyncingRate] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleEnterKey = useEnterNavigation();

    const form = useForm<BusinessProfileFormInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(BusinessProfileFormSchema) as any,
        defaultValues: {
            companyName: initialData?.companyName || 'My Transport Company',
            address: initialData?.address || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            website: initialData?.website || '',
            logoUrl: initialData?.logoUrl || '',
            usdRate: initialData?.usdRate || 300,
            currency: initialData?.currency || 'LKR',
            currencyConfigured: initialData?.currencyConfigured ?? true,
            countryCode: initialData?.countryCode || 'lk',
            countryName: initialData?.countryName || 'Sri Lanka',
            bankName: initialData?.bankName || '',
            bankBranch: initialData?.bankBranch || '',
            bankAccountNo: initialData?.bankAccountNo || '',
            bankAccountName: initialData?.bankAccountName || '',
        },
    });

    const onSubmit = async (data: BusinessProfileFormData) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append('companyName', data.companyName);
        if (data.address) formData.append('address', data.address);
        if (data.phone) formData.append('phone', data.phone);
        if (data.email) formData.append('email', data.email);
        if (data.website) formData.append('website', data.website);
        if (data.logoUrl) formData.append('logoUrl', data.logoUrl);
        formData.append('usdRate', data.usdRate.toString());
        formData.append('currency', data.currency || 'LKR');
        formData.append('currencyConfigured', 'true');
        formData.append('countryCode', data.countryCode || 'lk');
        formData.append('countryName', data.countryName || 'Sri Lanka');
        if (data.bankName) formData.append('bankName', data.bankName);
        if (data.bankBranch) formData.append('bankBranch', data.bankBranch);
        if (data.bankAccountNo) formData.append('bankAccountNo', data.bankAccountNo);
        if (data.bankAccountName) formData.append('bankAccountName', data.bankAccountName);

        try {
            const response = await fetch('/api/business-profile', { method: 'PUT', body: formData });
            const result = await response.json();

            if (response.ok && result.success) {
                notify.success('Business profile updated successfully');
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const message = result.error || 'Failed to update profile';
                notify.error(message);
                setError(message);
            }
        } catch (submitError) {
            console.error('Error updating business profile:', submitError);
            const message = 'Failed to update profile. Please try again.';
            notify.error(message);
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSyncLiveRate = async () => {
        setIsSyncingRate(true);
        try {
            const res = await fetch('/api/exchange-rate?from=USD&to=LKR');
            const data = await res.json();
            if (data.success && data.rate) {
                const roundedRate = Math.round(data.rate * 10) / 10;
                form.setValue('usdRate', roundedRate, { shouldDirty: true });
                notify.success(`Synced live exchange rate: 1 USD = Rs. ${roundedRate}`);
            } else {
                notify.error('Failed to fetch live exchange rate');
            }
        } catch (e) {
            console.error('Error syncing live rate:', e);
            notify.error('Network error fetching exchange rate');
        } finally {
            setIsSyncingRate(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>
                    These details will appear on your invoices.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {success && (
                    <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>Business profile updated successfully.</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" onKeyDown={handleEnterKey}>
                        <FormField
                            control={form.control}
                            name="companyName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Acme Transport" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="(555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="contact@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder="www.example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>Company Logo</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-4">
                                            {value && (
                                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={value}
                                                        alt="Logo Preview"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <Input
                                                {...fieldProps}
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            onChange(reader.result as string);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-xs text-muted-foreground">
                                        Upload a logo image (JPG, PNG). It will be cropped to a circle.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Currency & Regional Settings Section */}
                        <div className="border-t pt-4 mt-2">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Regional Map & Currency Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="countryCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Operating Country & Map Anchor</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    value={field.value || 'lk'}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        field.onChange(val);
                                                        const match = SUPPORTED_COUNTRIES.find((c) => c.code === val);
                                                        if (match) {
                                                            form.setValue('countryName', match.name);
                                                        }
                                                    }}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    {SUPPORTED_COUNTRIES.map((c) => (
                                                        <option key={c.code} value={c.code} className="bg-background text-foreground">
                                                            {c.flag} {c.name} ({c.code.toUpperCase()})
                                                        </option>
                                                    ))}
                                                </select>
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground">
                                                Prioritizes local route mapping & addresses.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Primary Operational Currency</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                >
                                                    <option value="LKR" className="bg-background text-foreground">LKR (Rs.) - Sri Lankan Rupee</option>
                                                    <option value="USD" className="bg-background text-foreground">USD ($) - US Dollar</option>
                                                    <option value="EUR" className="bg-background text-foreground">EUR (€) - Euro</option>
                                                    <option value="GBP" className="bg-background text-foreground">GBP (£) - British Pound</option>
                                                    <option value="AED" className="bg-background text-foreground">AED (AED) - UAE Dirham</option>
                                                    <option value="AUD" className="bg-background text-foreground">AUD (A$) - Australian Dollar</option>
                                                    <option value="CAD" className="bg-background text-foreground">CAD (C$) - Canadian Dollar</option>
                                                    <option value="SGD" className="bg-background text-foreground">SGD (S$) - Singapore Dollar</option>
                                                    <option value="INR" className="bg-background text-foreground">INR (₹) - Indian Rupee</option>
                                                </select>
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground">
                                                Base operational currency for vehicles and bills.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="usdRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>USD Conversion Rate (1 USD in LKR)</FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isSyncingRate}
                                                    onClick={handleSyncLiveRate}
                                                    className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${isSyncingRate ? 'animate-spin' : ''}`} />
                                                    Sync Live Rate
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input type="number" step="0.1" min="1" placeholder="300" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground">
                                                Used to calculate foreign tourist estimates in Quotations and Invoices.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Bank Details Section */}
                        <div className="border-t pt-4 mt-2">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Bank Details (for Quotations)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. BOC" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankBranch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Branch</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Delgoda" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccountNo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 80228624" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankAccountName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Holder Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. A.P. W. Jithsara" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
