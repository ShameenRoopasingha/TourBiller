'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isWithinInterval, startOfDay, endOfDay,
  differenceInDays, addDays
} from 'date-fns';

interface Vehicle {
  vehicleNo: string;
  category: string;
}

interface Booking {
  id: string;
  vehicleNo: string;
  customerName: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  destination: string | null;
}

interface VehicleCalendarProps {
  vehicles: Vehicle[];
  bookings: Booking[];
}

export function VehicleCalendar({ vehicles, bookings }: VehicleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Function to calculate positioning for a booking block
  const getBookingStyles = (booking: Booking, monthStart: Date, daysCount: number) => {
    const bStart = startOfDay(new Date(booking.startDate));
    // If no end date, assume 1 day tour
    const bEnd = booking.endDate ? endOfDay(new Date(booking.endDate)) : endOfDay(bStart);
    
    // Check if it overlaps with current month
    if (bEnd < monthStart || bStart > endOfDay(addDays(monthStart, daysCount - 1))) {
      return null; // Not in this month
    }

    // Calculate left offset (percentage)
    let leftDays = differenceInDays(bStart, monthStart);
    let isStartCut = false;
    if (leftDays < 0) {
      leftDays = 0;
      isStartCut = true;
    }

    // Calculate width (percentage)
    const duration = differenceInDays(bEnd, bStart) + 1; // +1 to include end day
    let widthDays = duration;
    
    if (isStartCut) {
       // Reduce width by the days cut off at the start
       widthDays = duration + differenceInDays(bStart, monthStart);
    }
    
    // Cap width to end of month
    if (leftDays + widthDays > daysCount) {
       widthDays = daysCount - leftDays;
    }

    const leftPercentage = (leftDays / daysCount) * 100;
    const widthPercentage = (widthDays / daysCount) * 100;

    const bgColors = {
      'CONFIRMED': 'bg-blue-500 hover:bg-blue-600',
      'COMPLETED': 'bg-emerald-500 hover:bg-emerald-600',
      'CANCELLED': 'bg-gray-400 hover:bg-gray-500',
    };
    const colorClass = bgColors[booking.status as keyof typeof bgColors] || 'bg-purple-500';

    return {
      style: {
        left: `${leftPercentage}%`,
        width: `${widthPercentage}%`,
      },
      colorClass,
      isStartCut,
      isEndCut: leftDays + widthDays === daysCount && bEnd > endOfDay(addDays(monthStart, daysCount - 1))
    };
  };

  return (
    <Card className="w-full border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20 border-b">
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          {format(currentDate, 'MMMM yyyy')}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row: Days */}
          <div className="flex border-b bg-muted/10">
            <div className="w-48 flex-shrink-0 p-3 border-r font-semibold text-sm flex items-center bg-muted/20">
              Vehicle
            </div>
            <div className="flex-grow flex relative">
              {daysInMonth.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <div 
                    key={i} 
                    className={`flex-1 min-w-[30px] border-r text-center py-2 text-xs flex flex-col justify-center items-center
                      ${isToday ? 'bg-primary/10 text-primary font-bold' : ''}
                      ${isWeekend && !isToday ? 'bg-muted/30 text-muted-foreground' : ''}
                    `}
                  >
                    <span>{format(day, 'E')[0]}</span>
                    <span className="text-sm mt-0.5">{format(day, 'd')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Rows: Vehicles */}
          <div className="divide-y relative">
            {/* Current day indicator line */}
            {isWithinInterval(new Date(), { start: monthStart, end: monthEnd }) && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-primary/40 z-10 pointer-events-none"
                style={{ 
                  left: `calc(12rem + ${(differenceInDays(new Date(), monthStart) / daysInMonth.length) * 100}%)`,
                  transform: 'translateX(15px)' // approximate center of column
                }}
              />
            )}

            {vehicles.map(vehicle => {
              const vehicleBookings = bookings.filter(b => b.vehicleNo === vehicle.vehicleNo);

              return (
                <div key={vehicle.vehicleNo} className="flex hover:bg-muted/5 transition-colors">
                  {/* Left Column: Vehicle Info */}
                  <div className="w-48 flex-shrink-0 p-3 border-r flex flex-col justify-center bg-card z-20 relative">
                    <span className="font-bold text-sm">{vehicle.vehicleNo}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{vehicle.category}</span>
                  </div>

                  {/* Right Column: Timeline Grid */}
                  <div className="flex-grow relative h-16">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex">
                      {daysInMonth.map((day, i) => (
                        <div key={i} className={`flex-1 border-r ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/10' : ''}`} />
                      ))}
                    </div>

                    {/* Booking Blocks */}
                    {vehicleBookings.map(booking => {
                      const pos = getBookingStyles(booking, monthStart, daysInMonth.length);
                      if (!pos) return null;

                      return (
                        <div 
                          key={booking.id}
                          className="absolute top-2 bottom-2 z-10 px-1 py-1"
                          style={pos.style}
                        >
                          <div 
                            className={`h-full w-full rounded-md shadow-sm flex items-center px-2 text-white text-xs truncate cursor-help
                              ${pos.colorClass}
                              ${pos.isStartCut ? 'rounded-l-none border-l-2 border-l-black/20' : ''}
                              ${pos.isEndCut ? 'rounded-r-none border-r-2 border-r-black/20' : ''}
                            `}
                            title={`Booking for ${booking.customerName}\nStatus: ${booking.status}\nDestination: ${booking.destination || 'N/A'}\nStart: ${format(new Date(booking.startDate), 'MMM dd, yyyy')}\nEnd: ${booking.endDate ? format(new Date(booking.endDate), 'MMM dd, yyyy') : 'Same day'}`}
                          >
                            <span className="truncate font-medium">{booking.customerName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {vehicles.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No active vehicles found.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
