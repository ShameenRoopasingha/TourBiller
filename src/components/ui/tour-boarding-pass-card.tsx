import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar, User, Phone, MapPin, Users, Printer, Eye, ArrowRight } from 'lucide-react';
import { VehiclePlateBadge, type VehiclePlateStatus } from './vehicle-plate-badge';
import { Button } from './button';
import { Badge } from './badge';

export interface TourBoardingPassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  bookingId: string;
  customerName: string;
  destination: string;
  startDate: string;
  endDate?: string;
  passengerCount?: number;
  vehiclePlate?: {
    province?: string;
    number: string;
    status?: VehiclePlateStatus;
  };
  driverName?: string;
  driverPhone?: string;
  totalAmount?: string | number;
  currency?: string;
  status?: string;
  onView?: () => void;
  onPrint?: () => void;
}

export function TourBoardingPassCard({
  bookingId,
  customerName,
  destination,
  startDate,
  endDate,
  passengerCount = 1,
  vehiclePlate,
  driverName,
  driverPhone,
  totalAmount,
  currency = 'LKR',
  status = 'CONFIRMED',
  onView,
  onPrint,
  className,
  ...props
}: TourBoardingPassCardProps) {
  return (
    <div
      className={cn(
        'ticket-perforated overflow-hidden rounded-2xl border transition-all duration-300 hover:border-primary/40 backdrop-blur-md',
        className
      )}
      {...props}
    >
      {/* Top Header Strip: Flight / Tour Header */}
      <div className="bg-muted/60 dark:bg-zinc-900/60 border-b border-border/80 px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            VIGIL BOARDING PASS
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="font-mono text-xs font-bold tabular-nums text-foreground">
            {bookingId}
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/30">
          {status}
        </Badge>
      </div>

      {/* Main Ticket Body */}
      <div className="p-5 space-y-4">
        {/* Customer & Destination Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              PASSENGER / LEAD GUEST
            </span>
            <h3 className="font-display font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
              {customerName}
            </h3>
          </div>

          <div className="sm:text-right">
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              DESTINATION ROUTE
            </span>
            <div className="flex items-center sm:justify-end gap-1.5 font-bold text-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{destination}</span>
            </div>
          </div>
        </div>

        {/* Travel Timeline & Logistics Roster */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/60">
          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              DATE OF TOUR
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono tabular-nums">{startDate}</span>
            </div>
          </div>

          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              PASSENGERS
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono tabular-nums">{passengerCount} PAX</span>
            </div>
          </div>

          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              ASSIGNED FLEET
            </span>
            <div className="mt-1">
              {vehiclePlate ? (
                <VehiclePlateBadge
                  province={vehiclePlate.province}
                  number={vehiclePlate.number}
                  status={vehiclePlate.status || 'active'}
                  size="sm"
                />
              ) : (
                <span className="text-xs text-muted-foreground italic">Unassigned</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
              CHAUFFEUR DRIVER
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mt-1">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="truncate">{driverName || 'Pending'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Perforated Tear-off Divider Line */}
      <div className="relative py-1">
        <div className="border-b border-dashed border-border/80 w-full" />
      </div>

      {/* Tear-Off Ticket Stub / Financial Summary & Actions */}
      <div className="bg-muted/40 dark:bg-zinc-950/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[0.65rem] font-bold tracking-[0.14em] uppercase text-muted-foreground block">
            TOTAL FARE CHARGE
          </span>
          <div className="text-lg sm:text-xl font-mono font-black tabular-nums tracking-tight text-foreground">
            {currency}{' '}
            {typeof totalAmount === 'number'
              ? totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })
              : totalAmount || '0.00'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPrint && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="gap-1.5 text-xs btn-tactile-secondary"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Voucher
            </Button>
          )}

          {onView && (
            <Button
              type="button"
              size="sm"
              onClick={onView}
              className="gap-1.5 text-xs btn-tactile-primary"
            >
              <Eye className="w-3.5 h-3.5" />
              View Booking
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
