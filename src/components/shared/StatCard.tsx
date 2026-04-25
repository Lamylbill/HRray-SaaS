import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: 'orange' | 'blue' | 'green' | 'red';
  loading?: boolean;
}

const ACCENT = {
  orange: {
    bar:    'bg-gradient-to-r from-orange-500 to-orange-400',
    icon:   'bg-orange-50 text-orange-500',
    glow:   'hover:shadow-orange-100/80',
    value:  'text-orange-600',
  },
  blue: {
    bar:    'bg-gradient-to-r from-blue-600 to-blue-500',
    icon:   'bg-blue-50 text-blue-600',
    glow:   'hover:shadow-blue-100/80',
    value:  'text-blue-600',
  },
  green: {
    bar:    'bg-gradient-to-r from-emerald-500 to-emerald-400',
    icon:   'bg-emerald-50 text-emerald-600',
    glow:   'hover:shadow-emerald-100/80',
    value:  'text-emerald-600',
  },
  red: {
    bar:    'bg-gradient-to-r from-red-500 to-rose-400',
    icon:   'bg-red-50 text-red-500',
    glow:   'hover:shadow-red-100/80',
    value:  'text-red-500',
  },
};

export default function StatCard({ label, value, icon: Icon, trend, accent = 'blue', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="relative bg-white rounded-2xl border border-gray-100 p-5 overflow-hidden animate-pulse">
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gray-100 rounded-t-2xl" />
        <div className="h-3.5 w-28 bg-gray-100 rounded mb-5" />
        <div className="h-8 w-14 bg-gray-100 rounded" />
      </div>
    );
  }

  const styles = ACCENT[accent];

  return (
    <div className={cn(
      'relative bg-white rounded-2xl border border-gray-100/80 p-5 overflow-hidden',
      'hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-default',
      styles.glow
    )}>
      {/* Top accent bar */}
      <div className={cn('absolute top-0 inset-x-0 h-0.5 rounded-t-2xl', styles.bar)} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium leading-tight">{label}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-2', styles.icon)}>
          <Icon size={19} strokeWidth={2} />
        </div>
      </div>

      <p className={cn('text-3xl font-bold tracking-tight', styles.value)}>{value}</p>

      {trend && (
        <p className={cn('text-xs mt-2 font-medium', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}
