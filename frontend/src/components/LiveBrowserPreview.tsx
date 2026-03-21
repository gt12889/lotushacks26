'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/components/LocaleProvider';

interface LiveBrowserPreviewProps {
  streamingUrls: Record<string, string>;
  pharmacyNames: Record<string, string>;
  isSearching: boolean;
  agentStatuses?: Record<string, 'active' | 'success' | 'error'>;
  agentResults?: Record<string, { resultCount: number; price?: number }>;
}

const PHARMACY_NAME_MAP: Record<string, string> = {
  long_chau: 'FPT Long Chau',
  pharmacity: 'Pharmacity',
  an_khang: 'An Khang',
  than_thien: 'Than Thien',
  medicare: 'Medicare',
};

export default function LiveBrowserPreview({
  streamingUrls,
  pharmacyNames,
  isSearching,
  agentStatuses,
  agentResults,
}: LiveBrowserPreviewProps) {
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const entries = useMemo(() => Object.entries(streamingUrls), [streamingUrls]);

  if (entries.length === 0) return null;

  const getBorderClass = (sourceId: string) => {
    const status = agentStatuses?.[sourceId];
    if (status === 'success') return 'border-success/60';
    if (status === 'error') return 'border-alert-red/60';
    if (status === 'active') return 'border-cyan/60 animate-pulse';
    return 'border-border/40';
  };

  const getDotClass = (sourceId: string) => {
    const status = agentStatuses?.[sourceId];
    if (status === 'success') return 'bg-success';
    if (status === 'error') return 'bg-alert-red';
    return 'bg-cyan animate-pulse';
  };

  const getPharmacyName = (sourceId: string) => {
    if (sourceId.startsWith('t3:')) {
      const parts = sourceId.replace('t3:', '').split('@');
      const variant = parts[0] || '';
      const baseSid = parts[1] || '';
      const baseName = pharmacyNames[baseSid] || PHARMACY_NAME_MAP[baseSid] || baseSid;
      return `${variant} @ ${baseName}`;
    }
    return pharmacyNames[sourceId] || PHARMACY_NAME_MAP[sourceId] || sourceId;
  };

  return (
    <div className="bg-deep border border-cyan/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-card/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-cyan uppercase tracking-wider font-bold">
            WAR ROOM
          </span>
          <span className="text-[10px] font-mono text-t3">
            ({entries.length} {entries.length === 1 ? 'agent' : 'agents'})
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-t3 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {entries.map(([sourceId, url]) => {
            const result = agentResults?.[sourceId];
            const hasResult = !!result;

            return (
              <div
                key={sourceId}
                className={`relative border rounded-lg overflow-hidden transition-all duration-500 ${getBorderClass(sourceId)}`}
              >
                <div className="px-3 py-1.5 bg-card/50 flex items-center gap-2">
                  <div className={`w-1 h-1 rounded-full ${getDotClass(sourceId)}`} />
                  <span className="text-[9px] font-mono text-t2 uppercase tracking-wider truncate">
                    {getPharmacyName(sourceId)}
                  </span>
                </div>

                <iframe
                  src={url}
                  className="w-full h-48 bg-black"
                  sandbox="allow-scripts allow-same-origin"
                  title={`Live browser: ${sourceId}`}
                />

                {hasResult && (
                  <div className="absolute inset-0 top-[30px] bg-deep/80 flex items-center justify-center flex-col backdrop-blur-sm transition-opacity duration-500">
                    <span className="text-2xl font-bold text-success">
                      {result.resultCount}
                    </span>
                    <span className="text-[10px] text-t3 uppercase tracking-wider">products found</span>
                    {result.price && (
                      <span className="text-xs text-cyan mt-1">
                        from ₫{result.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
