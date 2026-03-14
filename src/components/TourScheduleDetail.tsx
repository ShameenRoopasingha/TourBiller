import { Calendar, MapPin, Navigation, Info, Car, Clock, History } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Edit } from 'lucide-react';

interface TourScheduleDetailProps {
    schedule: {
        id: string;
        name: string;
        description: string | null;
        days: number;
        basePricePerPerson: number;
        vehicleCategory: string;
        excessKmRate: number | null;
        extraHourRate: number | null;
        updatedAt: Date;
        items: {
            dayNumber: number;
            title: string;
            description: string | null;
            distanceKm: number;
            accommodation: number;
            meals: number;
            activities: number;
            otherCosts: number;
        }[];
    };
}

export function TourScheduleDetail({ schedule }: TourScheduleDetailProps) {
    const totalDistance = schedule.items.reduce((sum, item) => sum + item.distanceKm, 0);
    const totalItineraryCost = schedule.items.reduce(
        (sum, item) => sum + item.accommodation + item.meals + item.activities + item.otherCosts,
        0
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{schedule.name}</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Last updated on {new Date(schedule.updatedAt).toLocaleDateString('en-GB')}
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" asChild className="flex-1 md:flex-none">
                        <Link href="/tour-schedules">Back to List</Link>
                    </Button>
                    <Button asChild className="flex-1 md:flex-none">
                        <Link href={`/tour-schedules/${schedule.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Schedule
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{schedule.days} Days</div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <Navigation className="h-3 w-3" /> Total Distance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDistance} km</div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                            <Car className="h-3 w-3" /> Vehicle
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{schedule.vehicleCategory.toLowerCase().replace('_', ' ')}</div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold uppercase text-primary/70 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full border border-primary/30 text-primary text-[10px] font-bold">Base Price</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(schedule.basePricePerPerson)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Itinerary Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Itinerary Details
                            </CardTitle>
                            <CardDescription>Day-by-day plan and activities</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {schedule.items.map((item) => (
                                    <div key={item.dayNumber} className="p-6 transition-colors hover:bg-muted/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                                    {item.dayNumber}
                                                </span>
                                                <h3 className="text-lg font-bold">{item.title}</h3>
                                            </div>
                                            <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-mono">{item.distanceKm} km</span>
                                        </div>
                                        {item.description && (
                                            <p className="text-muted-foreground text-sm pl-11 mb-4 leading-relaxed italic">
                                                &quot;{item.description}&quot;
                                            </p>
                                        )}
                                        
                                        <div className="pl-11 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground mb-1 uppercase tracking-tight">Accommodation</span>
                                                <span className="font-semibold">{formatCurrency(item.accommodation)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground mb-1 uppercase tracking-tight">Meals</span>
                                                <span className="font-semibold">{formatCurrency(item.meals)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground mb-1 uppercase tracking-tight">Activities</span>
                                                <span className="font-semibold">{formatCurrency(item.activities)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground mb-1 uppercase tracking-tight">Other</span>
                                                <span className="font-semibold">{formatCurrency(item.otherCosts)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Pricing Rules
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Extra Hour
                                </span>
                                <span className="font-bold">{formatCurrency(schedule.extraHourRate || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-dashed">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Navigation className="h-4 w-4" /> Excess KM
                                </span>
                                <span className="font-bold">{formatCurrency(schedule.excessKmRate || 0)}/km</span>
                            </div>
                            <div className="pt-2">
                                <div className="text-sm text-muted-foreground mb-1 italic leading-tight">
                                    * These rates are automatically applied when generating bills linked to this schedule.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Card */}
                    <Card className="bg-primary text-primary-foreground overflow-hidden">
                        <div className="p-6 relative">
                            <MapPin className="absolute -right-4 -bottom-4 h-24 w-24 opacity-10 rotate-12" />
                            <h3 className="text-lg font-bold mb-4">Cost Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-primary-foreground/80">
                                    <span>Total Itinerary Cost</span>
                                    <span>{formatCurrency(totalItineraryCost)}</span>
                                </div>
                                <div className="flex justify-between text-primary-foreground/80">
                                    <span>Base Personnel Rate</span>
                                    <span>{formatCurrency(schedule.basePricePerPerson)}</span>
                                </div>
                                <Separator className="bg-primary-foreground/20" />
                                <div className="flex justify-between text-xl font-bold">
                                    <span>Estimated Total</span>
                                    <span>{formatCurrency(totalItineraryCost + (schedule.basePricePerPerson || 0))}</span>
                                </div>
                                <p className="text-[10px] text-primary-foreground/60 leading-tight mt-2 italic">
                                    Note: This is a system estimate. Final quote may vary based on vehicle availability and seasonal taxes.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {schedule.description && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground">General Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {schedule.description}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
