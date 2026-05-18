// components/ModernTabs.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  content: React.ReactNode;
}

interface ModernTabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export function ModernTabs({ tabs, defaultTabId, onTabChange }: ModernTabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTabId);

  return (
    <div className="w-full">
      {/* Tab List */}
      <div className="border-b border-slate-700/50 mb-6 overflow-x-auto scrollbar-hide">
        <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative px-4 py-3 font-medium whitespace-nowrap transition-colors
                ${
                  activeTabId === tab.id
                    ? 'text-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/20 text-red-300"
                  >
                    {tab.badge}
                  </motion.span>
                )}
              </div>

              {/* Active indicator */}
              {activeTabId === tab.id && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTabId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {tabs[activeTabIndex]?.content}
      </motion.div>
    </div>
  );
}
