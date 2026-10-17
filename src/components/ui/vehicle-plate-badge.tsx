import * as React from 'react';
import { cn } from '@/lib/utils';

export type VehiclePlateStatus = 'active' | 'on-tour' | 'maintenance' | 'scheduled';

export interface VehiclePlateBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  province?: string;
  number: string;
  status?: VehiclePlateStatus;
  size?: 'sm' | 'default' | 'lg';
}

const statusConfig: Record<
  VehiclePlateStatus,
  {
    ledGradient: string;
    shadow: string;
    ring: string;
    label: string;
  }
> = {
  active: {
    ledGradient: 'radial-gradient(circle at 35% 35%, #A7F3D0 0%, #10B981 50%, #047857 100%)',
    shadow: '0 0 10px rgba(16, 185, 129, 0.65), 0 0 2px rgba(16, 185, 129, 0.9)',
    ring: 'border-emerald-300/60 dark:border-emerald-700/60',
    label: 'Active',
  },
  'on-tour': {
    ledGradient: 'radial-gradient(circle at 35% 35%, #FDE68A 0%, #F59E0B 50%, #B45309 100%)',
    shadow: '0 0 10px rgba(245, 158, 11, 0.65), 0 0 2px rgba(245, 158, 11, 0.9)',
    ring: 'border-amber-300/60 dark:border-amber-700/60',
    label: 'On Tour',
  },
  maintenance: {
    ledGradient: 'radial-gradient(circle at 35% 35%, #FECDD3 0%, #F43F5E 50%, #BE123C 100%)',
    shadow: '0 0 10px rgba(244, 63, 94, 0.65), 0 0 2px rgba(244, 63, 94, 0.9)',
    ring: 'border-rose-300/60 dark:border-rose-700/60',
    label: 'Maintenance',
  },
  scheduled: {
    ledGradient: 'radial-gradient(circle at 35% 35%, #C7D2FE 0%, #6366F1 50%, #4338CA 100%)',
    shadow: '0 0 10px rgba(99, 102, 241, 0.65), 0 0 2px rgba(99, 102, 241, 0.9)',
    ring: 'border-indigo-300/60 dark:border-indigo-700/60',
    label: 'Scheduled',
  },
};

export function VehiclePlateBadge({
  province = 'WP',
  number,
  status,
  size = 'default',
  className,
  ...props
}: VehiclePlateBadgeProps) {
  const cfg = status ? statusConfig[status] : undefined;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 rounded-md',
    default: 'text-xs px-2.5 py-1 gap-2 rounded-lg',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 rounded-lg',
  }[size];

  const ledSize = {
    sm: 'w-2 h-2',
    default: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  return (
    <div
      className={cn(
        'badge-license-plate text-telemetry inline-flex items-center select-none font-bold text-foreground transition-all duration-200',
        sizeStyles,
        className
      )}
      title={cfg ? `Vehicle: ${province ? `${province} ` : ''}${number} (${cfg.label})` : undefined}
      {...props}
    >
      {/* 3D Domed Hardware Status LED Beacon */}
      {cfg && (
        <span
          className={cn(
            'relative inline-block rounded-full border shrink-0',
            cfg.ring,
            ledSize
          )}
          style={{
            background: cfg.ledGradient,
            boxShadow: cfg.shadow,
          }}
          aria-label={cfg.label}
        >
          {status === 'active' && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-emerald-400" />
          )}
        </span>
      )}

      {/* Sri Lanka Province Code Badge (Embossed) */}
      {province && (
        <span className="text-[0.72em] font-extrabold tracking-wider text-muted-foreground/80 border-r border-border/80 pr-1.5 leading-none uppercase">
          {province}
        </span>
      )}

      {/* License Registration Monospace Digits */}
      <span className="tracking-wider uppercase font-mono leading-none drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]">
        {number}
      </span>
    </div>
  );
}
