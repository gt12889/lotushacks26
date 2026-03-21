'use client';

import { useRef, useEffect, useMemo } from 'react';

interface AgentEvent {
  id: string;
  timestamp: number;
  type: 'spawn' | 'searching' | 'success' | 'error' | 'variant';
  agent: string;
  message: string;
  source_id?: string;
}

interface AgentActivityFeedProps {
  events: AgentEvent[];
  isActive: boolean;
}

const TYPE_COLORS: Record<AgentEvent['type'], string> = {
  spawn: 'bg-cyan',
  searching: 'bg-warn',
  success: 'bg-success',
  error: 'bg-alert-red',
  variant: 'bg-purple-500',
};

const TYPE_TEXT_COLORS: Record<AgentEvent['type'], string> = {
  spawn: 'text-cyan',
  searching: 'text-warn',
  success: 'text-success',
  error: 'text-alert-red',
  variant: 'text-purple-400',
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
    <div className="bg-deep border border-border rounded-lg font-mono overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="relative flex h-2 w-2">
          {isActive && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75 animate-ping" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isActive ? 'bg-cyan' : 'bg-t3'
            }`}
          />
        </span>
        <span className="text-[10px] uppercase tracking-widest text-t2 font-semibold">
          Agent Activity
        </span>
      </div>

      {/* Event list */}
      <div
        ref={scrollRef}
        className="h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-card scrollbar-track-transparent px-3 py-1"
      >
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-t3 text-[10px]">
            Waiting for agent events...
          </div>
        ) : (
          visibleEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 py-[3px] animate-[fadeSlideIn_0.3s_ease-out]"
            >
              {/* Timestamp */}
              <span className="text-[10px] text-t3 shrink-0 leading-4">
                {formatTimestamp(event.timestamp)}
              </span>

              {/* Status dot */}
              <span className="relative flex h-[6px] w-[6px] mt-[5px] shrink-0">
                {event.type === 'searching' && (
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full ${TYPE_COLORS[event.type]} opacity-75 animate-ping`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-[6px] w-[6px] ${TYPE_COLORS[event.type]}`}
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
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
