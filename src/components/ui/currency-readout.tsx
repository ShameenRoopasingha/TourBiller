import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyReadoutProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string;
  currency?: string;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'hero';
  showDecimals?: boolean;
}

export function CurrencyReadout({
  amount,
  currency = 'Rs.',
  size = 'default',
  showDecimals = true,
  className,
  ...props
}: CurrencyReadoutProps) {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) || 0 : amount;

  const isNegative = numericAmount < 0;
  const absAmount = Math.abs(numericAmount);
  const integerPart = Math.floor(absAmount);
  const centsPart = Math.round((absAmount - integerPart) * 100);

  const formattedInteger = integerPart.toLocaleString('en-LK');
  const formattedCents = String(centsPart).padStart(2, '0');

  const sizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    default: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
    hero: 'text-3xl sm:text-4xl',
  }[size];

  const isMetallic = size === 'lg' || size === 'hero';

  return (
    <span
      className={cn(
        'text-telemetry inline-flex items-baseline select-none leading-none tracking-tight',
        sizeStyles,
        className
      )}
      {...props}
    >
      {isNegative && <span className="text-destructive mr-0.5 font-bold">-</span>}

      {/* Currency Symbol Prefix (0.7em, uppercase, muted) */}
      <span className="text-[0.7em] font-bold text-muted-foreground mr-1 uppercase tracking-wider select-none">
        {currency}
      </span>

      {/* Whole Integer Portion (Bold or Anodized Metallic) */}
      <span
        className={cn(
          'font-extrabold tabular-nums tracking-tight',
          isMetallic ? 'text-kpi-metallic' : 'text-foreground'
        )}
      >
        {formattedInteger}
      </span>

      {/* Decimal Cents Portion (.00 muted, faster scanning) */}
      {showDecimals && (
        <span className="text-[0.75em] font-medium text-muted-foreground/80 tabular-nums">
          .{formattedCents}
        </span>
      )}
    </span>
  );
}
