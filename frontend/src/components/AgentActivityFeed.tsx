'use client';

import { useRef, useEffect, useMemo } from 'react';
import { AnimatedList } from '@/components/ui/animated-list';

type AgentEventType = 'spawn' | 'searching' | 'success' | 'error' | 'variant' | 'investigate';

interface AgentEvent {
  id: string;
  timestamp: number;
  type: AgentEventType;
  agent: string;
  message: string;
  source_id?: string;
}

interface AgentActivityFeedProps {
  events: AgentEvent[];
  isActive: boolean;
}

const SONAR_COLORS: Record<AgentEventType, string> = {
  spawn: '#00DBE7',
  searching: '#F97316',
  success: '#2DD4BF',
  error: '#EE4042',
  variant: '#A855F7',
  investigate: '#F59E0B',
};

const TYPE_COLORS: Record<AgentEventType, string> = {
  spawn: 'bg-cyan',
  searching: 'bg-warn',
  success: 'bg-success',
  error: 'bg-alert-red',
  variant: 'bg-purple-500',
  investigate: 'bg-amber-500',
};

const TYPE_TEXT_COLORS: Record<AgentEventType, string> = {
  spawn: 'text-cyan',
  searching: 'text-warn',
  success: 'text-success',
  error: 'text-alert-red',
  variant: 'text-purple-400',
  investigate: 'text-amber-400',
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export default function AgentActivityFeed({ events, isActive }: AgentActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleEvents = useMemo(() => events.slice(-50), [events]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleEvents]);

  return (
    <div className="panel font-mono overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs text-t3">Agent Feed</span>
        {isActive && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] text-cyan">Live</span>
          </div>
        )}
      </div>

      {/* Event list with scanline overlay */}
      <div
        ref={scrollRef}
        className="terminal-feed h-[200px] overflow-y-auto px-3 py-1"
      >
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-t3 text-[10px]">
            Waiting for agent events...
          </div>
        ) : (
          <AnimatedList animationDuration={300}>
            {visibleEvents.map((event) => {
              const isSearching = event.type === 'searching';
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 py-[3px]"
                  style={{}}
                >
                  {/* Prompt char */}
                  <span className="text-[10px] text-cyan/40 shrink-0 leading-4 select-none">&gt;</span>

                  {/* Timestamp */}
                  <span className="text-[10px] text-t3 shrink-0 leading-4">
                    {formatTimestamp(event.timestamp)}
                  </span>

                  {/* Status dot with sonar */}
                  <span
                    className={`${isSearching ? 'sonar-dot' : 'sonar-dot sonar-dot--idle'} flex h-[6px] w-[6px] mt-[5px] shrink-0`}
                    style={{ '--sonar-color': SONAR_COLORS[event.type] } as React.CSSProperties}
                  >
                    <span
                      className={`inline-flex rounded-full h-[6px] w-[6px] ${TYPE_COLORS[event.type]}`}
                    />
                  </span>

                  {/* Agent + message */}
                  <span className="text-[10px] leading-4 min-w-0">
                    <span className={`${TYPE_TEXT_COLORS[event.type]} font-semibold`}>
                      {event.agent}
                    </span>
                    <span className="text-t3 mx-1">&middot;</span>
                    <span className="text-t2">{event.message}</span>
                  </span>
                </div>
              );
            })}
          </AnimatedList>
        )}

        {/* Blinking cursor */}
        {isActive && (
          <div
            className="text-[10px] text-cyan/60 leading-4 pl-3"
            style={{ animation: 'blink 1s step-end infinite' }}
          >
            █
          </div>
        )}
      </div>
    </div>
  );
}
