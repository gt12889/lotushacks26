'use client';

import { useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';

interface LiveBrowserPreviewProps {
  streamingUrls: Record<string, string>;
  pharmacyNames: Record<string, string>;
  isSearching: boolean;
}

const PHARMACY_NAME_MAP: Record<string, string> = {
  long_chau: 'FPT Long Chau',
  pharmacity: 'Pharmacity',
  an_khang: 'An Khang',
  than_thien: 'Than Thien',
  medicare: 'Medicare',
};

export default function LiveBrowserPreview({ streamingUrls, pharmacyNames, isSearching }: LiveBrowserPreviewProps) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(streamingUrls);

  if (entries.length === 0) return null;

  return (
    <div className="bg-deep border border-cyan/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-card/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-cyan uppercase tracking-wider">
            {t('livePreview.title')}
          </span>
          <span className="text-[10px] font-mono text-t3">
            ({t('livePreview.agents', { count: entries.length })})
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-t3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {entries.map(([sourceId, url]) => (
            <div key={sourceId} className="border border-border/40 rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-card/50 flex items-center gap-2">
                <div className="w-1 h-1 bg-success rounded-full" />
                <span className="text-[9px] font-mono text-t2 uppercase tracking-wider">
                  {pharmacyNames[sourceId] || PHARMACY_NAME_MAP[sourceId] || sourceId}
                </span>
              </div>
              <iframe
                src={url}
                className="w-full h-48 bg-black"
                sandbox="allow-scripts allow-same-origin"
                title={`Live browser: ${sourceId}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
