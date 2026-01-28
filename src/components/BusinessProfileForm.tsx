'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { updateBusinessProfile } from '@/lib/actions';
import { BusinessProfileSchema, type BusinessProfileFormData, type BusinessProfile } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
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
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<BusinessProfileFormData>({
        resolver: zodResolver(BusinessProfileSchema),
        defaultValues: {
            companyName: initialData?.companyName || 'My Transport Company',
            address: initialData?.address || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',
            website: initialData?.website || '',
            usdRate: initialData?.usdRate || 300,
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
        formData.append('usdRate', data.usdRate.toString());

        const result = await updateBusinessProfile(formData);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setError(result.error || 'Failed to update profile');
        }

        setIsSubmitting(false);
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
