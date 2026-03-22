'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'megladon-demo-mode';

interface DemoModeContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setIsDemoMode(true);
  }, []);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ isDemoMode, toggleDemoMode }), [isDemoMode, toggleDemoMode]);

  return (
    <DemoModeContext.Provider value={value}>
      {children}
      {/* Fixed toggle pill at bottom center */}
      <button
        onClick={toggleDemoMode}
        className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${
          isDemoMode
            ? 'bg-amber-950/80 border-amber-500/40 text-amber-400 opacity-70 hover:opacity-100'
            : 'bg-abyss/80 border-border/40 text-t3 opacity-30 hover:opacity-70'
        } backdrop-blur-sm`}
        title={isDemoMode ? 'Switch to LIVE mode' : 'Switch to DEMO mode'}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`}
        />
        {isDemoMode ? 'DEMO' : 'LIVE'}
      </button>
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}
