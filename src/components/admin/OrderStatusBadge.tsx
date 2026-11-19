'use client';

import React from 'react';
import { OrderStatus } from '@/types';
import { STATUS_CONFIG, STATUS_LABELS_FR } from '@/lib/utils/orderStateMachine';
import { Clock, CheckCircle, Truck, PackageCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  pulsePending?: boolean;
  className?: string;
}

export function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
  pulsePending = true,
  className,
}: OrderStatusBadgeProps) {
  const { t } = useLanguage();
  const config = STATUS_CONFIG[status] || {
    label: STATUS_LABELS_FR[status] || status,
    badgeClass: 'bg-obsidian-100 text-obsidian-700 border-obsidian-200',
    dotClass: 'bg-obsidian-400',
    iconName: 'Clock',
  };

  const localizedLabel = t(`status.${status}`, config.label);

  const getIcon = () => {
    const iconClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
    switch (status) {
      case 'pending':
        return <Clock className={iconClass} />;
      case 'confirmed':
        return <CheckCircle className={iconClass} />;
      case 'shipped':
        return <Truck className={iconClass} />;
      case 'delivered':
        return <PackageCheck className={iconClass} />;
      case 'cancelled':
        return <XCircle className={iconClass} />;
      default:
        return null;
    }
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-3 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-all select-none',
        config.badgeClass,
        sizeStyles[size],
        className
      )}
    >
      {/* Pulsing indicator for pending orders */}
      {status === 'pending' && pulsePending ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass)} />
      )}

      {showIcon && getIcon()}

      <span>{localizedLabel}</span>
    </span>
  );
}
