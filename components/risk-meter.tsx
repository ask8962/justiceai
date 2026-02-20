'use client';

import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskMeterProps {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  size?: 'sm' | 'md' | 'lg';
}

export function RiskMeter({ riskLevel, size = 'md' }: RiskMeterProps) {
  const getColors = () => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-700',
          icon: 'text-green-600',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-700',
          icon: 'text-yellow-600',
        };
      case 'HIGH':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-700',
          icon: 'text-red-600',
        };
      default:
        // Fallback for unknown/undefined risk levels
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          badge: 'bg-slate-100 text-slate-700',
          icon: 'text-slate-500',
        };
    }
  };

  const getIcon = () => {
    switch (riskLevel) {
      case 'LOW':
        return <CheckCircle className={`${getIconSize()}`} />;
      case 'MEDIUM':
        return <AlertTriangle className={`${getIconSize()}`} />;
      case 'HIGH':
        return <AlertCircle className={`${getIconSize()}`} />;
      default:
        return <AlertCircle className={`${getIconSize()}`} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-5 h-5';
      case 'lg':
        return 'w-6 h-6';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-4 py-3 text-base';
    }
  };

  const colors = getColors();

  return (
    <div
      className={`flex items-center gap-2 ${getPadding()} rounded-lg border ${colors.bg} ${colors.border}`}
    >
      <div className={colors.icon}>{getIcon()}</div>
      <span className={`font-medium ${colors.badge.replace('bg-', 'text-').replace(' text-', '')}`}>
        {riskLevel === 'LOW' ? 'Low Risk' : riskLevel === 'MEDIUM' ? 'Medium Risk' : 'High Risk'}
      </span>
    </div>
  );
}
