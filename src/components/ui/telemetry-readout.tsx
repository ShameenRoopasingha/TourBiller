import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TelemetryReadoutProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ElementType;
  trend?: {
    value: string;
    positive?: boolean;
  };
  variant?: 'default' | 'compact' | 'hero';
}

export function TelemetryReadout({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  ...props
}: TelemetryReadoutProps) {
  return (
    <div
      className={cn(
        'surface-recessed rounded-xl p-3 flex flex-col justify-between transition-all duration-200',
        variant === 'compact' && 'p-2',
        variant === 'hero' && 'p-4 sm:p-5',
        className
      )}
      {...props}
    >
      {/* Header: Micro Instrument Label + Optional Icon */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-instrument-label select-none truncate">
          {label}
        </span>
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
        )}
      </div>

      {/* Main Telemetry Value: Inset Machined LCD Digital Font */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span
          className={cn(
            'text-telemetry font-extrabold leading-none drop-shadow-xs',
            variant === 'compact' && 'text-lg text-foreground',
            variant === 'default' && 'text-xl sm:text-2xl text-foreground',
            variant === 'hero' && 'text-3xl sm:text-4xl text-kpi-metallic'
          )}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-muted-foreground uppercase font-mono tracking-wide">
            {unit}
          </span>
        )}
      </div>

      {/* Optional Trend Indicator */}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              'text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md leading-none',
              trend.positive
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
            )}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
