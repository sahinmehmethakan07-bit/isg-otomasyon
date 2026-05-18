// components/ModernHeader.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
  hasNotifications?: boolean;
}

export function ModernHeader({
  title,
  subtitle,
  userName = 'Kullanıcı',
  userRole = 'İş Güvenliği Uzmanı',
  onMenuClick,
  hasNotifications = false,
}: ModernHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass sticky top-0 z-40 border-b border-slate-700/50 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Title */}
          <div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gradient"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-isg-text-muted mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <svg
                className="w-5 h-5 text-isg-text-muted hover:text-isg-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {hasNotifications && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                />
              )}
            </motion.button>

            {/* Profile Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {userName.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-isg-text">{userName}</p>
                  <p className="text-xs text-isg-text-muted">{userRole}</p>
                </div>
              </motion.button>

              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{
                  opacity: profileOpen ? 1 : 0,
                  y: profileOpen ? 0 : -10,
                }}
                transition={{ duration: 0.2 }}
                className={`absolute right-0 mt-2 w-48 glass rounded-lg shadow-lg overflow-hidden ${
                  profileOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
              >
                <a href="#" className="block px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors">
                  Profil
                </a>
                <a href="#" className="block px-4 py-2 text-sm hover:bg-slate-700/50 transition-colors">
                  Ayarlar
                </a>
                <hr className="border-slate-700/50" />
                <a href="#" className="block px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                  Çıkış Yap
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
