import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getQuotationById } from '@/lib/quotation-actions';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    Printer,
    Pencil,
    Calendar,
    User,
    Car,
    MapPin,
    Clock,
    DollarSign,
    ArrowLeft,
    ShieldCheck,
    Wind,
    Users,
    Star
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';

export default async function ViewQuotationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getQuotationById(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const q = result.data;
    const fmt = formatCurrency;

    let vehicleContext = null;
    if (q.vehicleNo) {
        vehicleContext = await prisma.vehicle.findUnique({
            where: { vehicleNo: q.vehicleNo }
        });
    }

    const statusColors: Record<string, string> = {
        DRAFT: 'bg-muted text-muted-foreground',
        SENT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        ACCEPTED: 'bg-green-500/10 text-green-600 border-green-500/20',
        EXPIRED: 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    return (
        <main className="container py-8 max-w-5xl">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/quotations">
                            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-primary">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back to list
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Quotation Q-{String(q.quotationNumber).padStart(4, '0')}
                        </h1>
                        <Badge variant="outline" className={statusColors[q.status] || ''}>
                            {q.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                        Created on {new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link href={`/quotations/${q.id}/edit`}>
                        <Button variant="outline">
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                        </Button>
                    </Link>
                    <Link href={`/quotations/${q.id}/print`}>
                        <Button variant="outline">
                            <Printer className="h-4 w-4 mr-2" /> Print PDF
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Tour Section */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" /> Customer & Tour Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</label>
                                    <p className="font-medium text-lg">{q.customerName}</p>
                                    {q.customerEmail && <p className="text-sm text-muted-foreground">{q.customerEmail}</p>}
                                    {q.customerPhone && <p className="text-sm text-muted-foreground">{q.customerPhone}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Number of Persons</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span>{q.numberOfPersons} Person(s)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tour Schedule</label>
                                    <p className="font-medium text-lg">{q.tourSchedule.name}</p>
                                    <p className="text-sm text-muted-foreground">{q.tourSchedule.days} Days / {q.tourSchedule.days - 1} Nights</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{q.startDate ? new Date(q.startDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valid Until</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-full pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pickup Location</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{q.pickupLocation || 'Not specified'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drop Location</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span>{q.dropLocation || 'Not specified'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Itinerary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" /> Daily Itinerary
                            </CardTitle>
                            <CardDescription>Proposed schedule for the tour</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {q.tourSchedule.items.sort((a, b) => a.dayNumber - b.dayNumber).map((item) => (
                                <div key={item.id} className="relative pl-8 border-l pb-6 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-primary">Day {item.dayNumber}</h4>
                                            <span className="text-xs text-muted-foreground font-mono">{item.distanceKm} km</span>
                                        </div>
                                        <p className="font-semibold">{item.title}</p>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Notes & Exclusions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Exclusions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{q.excludedItems || 'None'}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{q.notes || 'No extra notes'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    {/* Price Summary */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-primary" /> Cost Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transport Cost</span>
                                    <span>{fmt(q.transportCost)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Accommodation</span>
                                    <span>{fmt(q.accommodationTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Meals</span>
                                    <span>{fmt(q.mealsTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Activities</span>
                                    <span>{fmt(q.activitiesTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Other Costs</span>
                                    <span>{fmt(q.otherCostsTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                    <span>Markup</span>
                                    <span className="text-green-600">+{fmt(q.markup)}</span>
                                </div>
                                {q.discount > 0 && (
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Discount</span>
                                        <span className="text-red-600">-{fmt(q.discount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-lg">Total Amount</span>
                                    <span className="font-bold text-2xl text-primary">{fmt(q.totalAmount)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-right italic">
                                    Quoted rates based on {q.tourSchedule.days} days
                                </p>
                            </div>

                            {q.advanceAmount > 0 && (
                                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 mt-4">
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span>Advance Required</span>
                                        <span className="text-primary">{fmt(q.advanceAmount)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vehicle Details */}
                    {q.vehicleNo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Car className="h-5 w-5 text-primary" /> Vehicle Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-muted rounded-lg border">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Assigned Vehicle</p>
                                    <p className="font-bold text-lg leading-none">{q.vehicleNo}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 p-2 rounded-md border bg-card">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">{vehicleContext?.seats || '?'} Seats</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 rounded-md border bg-card">
                                        <Wind className="h-4 w-4 text-cyan-500" />
                                        <span className="text-sm font-medium">{vehicleContext?.acType || 'No AC'}</span>
                                    </div>
                                    {vehicleContext?.features && (
                                        <div className="flex items-center gap-2 p-2 rounded-md border bg-card col-span-2">
                                            <Star className="h-4 w-4 text-amber-500 shrink-0" />
                                            <span className="text-sm font-medium truncate" title={vehicleContext.features}>{vehicleContext.features}</span>
                                        </div>
                                    )}
                                    {vehicleContext?.insuranceCoverage && (
                                        <div className="flex items-center gap-2 p-2 rounded-md border bg-card col-span-2">
                                            <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                                            <span className="text-sm font-medium truncate" title={vehicleContext.insuranceCoverage}>{vehicleContext.insuranceCoverage}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 pt-2 text-sm border-t">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Hire Rate</span>
                                        <span>{fmt(q.hireRatePerDay)}/day</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Daily Km</span>
                                        <span>{q.kmPerDay} km/day</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Excess Km</span>
                                        <span>{fmt(q.excessKmRate)}/km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Extra Hour</span>
                                        <span>{fmt(q.extraHourRate)}/hr</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* System Info */}
                    <Card className="border-dashed">
                        <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Reference ID</span>
                                <span className="font-mono uppercase">{q.id.split('-')[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Last Updated</span>
                                <span>{new Date(q.updatedAt).toLocaleString('en-GB')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
