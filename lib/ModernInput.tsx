// components/ModernInput.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helpText?: string;
}

export function ModernInput({
  label,
  error,
  icon,
  helpText,
  className,
  ...props
}: ModernInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {label && (
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg">
            {icon}
          </div>
        )}

        {/* Input */}
        <motion.input
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={{
            borderColor: isFocused
              ? 'rgb(14, 165, 233)'
              : error
                ? 'rgb(239, 68, 68)'
                : 'rgb(71, 85, 105)',
            boxShadow: isFocused
              ? '0 0 0 3px rgba(14, 165, 233, 0.1)'
              : 'none',
          }}
          transition={{ duration: 0.2 }}
          className={`
            w-full px-4 py-2.5 rounded-lg
            bg-slate-900/50 border border-slate-600
            text-slate-100 placeholder-slate-500
            transition-all duration-300
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            focus:outline-none
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p className="mt-1 text-xs text-slate-400">{helpText}</p>
      )}
    </motion.div>
  );
}
