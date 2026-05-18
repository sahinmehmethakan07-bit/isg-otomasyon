// components/ModernCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  value?: string | number;
  metric?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  gradient?: boolean;
  glass?: boolean;
  disabled?: boolean;
  badge?: {
    text: string;
    color: 'primary' | 'success' | 'warning' | 'danger';
  };
}

const badgeColors = {
  primary: 'bg-blue-500/20 text-blue-300',
  success: 'bg-emerald-500/20 text-emerald-300',
  warning: 'bg-amber-500/20 text-amber-300',
  danger: 'bg-red-500/20 text-red-300',
};

export function ModernCard({
  title,
  subtitle,
  icon,
  iconBg = 'bg-gradient-to-br from-blue-400 to-cyan-500',
  value,
  metric,
  children,
  onClick,
  gradient = false,
  glass = false,
  disabled = false,
  badge,
}: ModernCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        ${gradient ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-slate-900/50'}
        ${glass ? 'glass' : 'border border-slate-700/50'}
        ${onClick ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-300
        p-6 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20
      `}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {icon && (
              <div
                className={`
                  ${iconBg}
                  w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  text-white text-lg shadow-lg
                `}
              >
                {icon}
              </div>
            )}
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>

          {badge && (
            <span className={`badge ${badgeColors[badge.color]} text-xs font-semibold`}>
              {badge.text}
            </span>
          )}
        </div>

        {/* Value */}
        {value !== undefined && (
          <div className="mb-4">
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {value}
            </p>
            {metric && <p className="text-xs text-slate-400 mt-1">{metric}</p>}
          </div>
        )}

        {/* Children */}
        {children && <div className="mt-4">{children}</div>}
      </div>

      {/* Border gradient on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background:
            'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(14, 165, 233, 0.1) 50%, transparent 60%, transparent 100%)',
        }}
      />
    </motion.div>
  );
}
