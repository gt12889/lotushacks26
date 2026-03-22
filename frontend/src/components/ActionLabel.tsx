'use client';

import { ShieldCheck, ShieldAlert, AlertTriangle, XOctagon } from 'lucide-react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface AnalystVerdict {
  action_label: string;
  action_label_en: string;
  risk_level: 'safe' | 'caution' | 'warning' | 'danger';
  reasoning: string;
  confidence_score: number;
  buy_recommendation: boolean;
}

interface ConfidenceSignal {
  signal: string;
  weight: number;
  value: number;
  explanation: string;
}

const RISK_CONFIG = {
  safe: {
    border: 'border-success',
    bg: 'bg-success/10',
    text: 'text-success',
    badgeBg: 'bg-success/20',
    Icon: ShieldCheck,
  },
  caution: {
    border: 'border-warn',
    bg: 'bg-warn/10',
    text: 'text-warn',
    badgeBg: 'bg-warn/20',
    Icon: ShieldAlert,
  },
  warning: {
    border: 'border-warn',
    bg: 'bg-warn/10',
    text: 'text-warn',
    badgeBg: 'bg-warn/20',
    Icon: AlertTriangle,
  },
  danger: {
    border: 'border-alert-red',
    bg: 'bg-alert-red/10',
    text: 'text-alert-red',
    badgeBg: 'bg-alert-red/20',
    Icon: XOctagon,
  },
};

const SIGNAL_LABELS: Record<string, string> = {
  source_agreement: 'Source Agreement',
  price_convergence: 'Price Convergence',
  compliance_clear: 'Compliance',
  anomaly_free: 'Anomaly-Free',
  variant_coverage: 'Variant Coverage',
};

export default function ActionLabel({ verdict, signals }: { verdict: AnalystVerdict; signals?: ConfidenceSignal[] | null }) {
  const config = RISK_CONFIG[verdict.risk_level] || RISK_CONFIG.caution;
  const { Icon } = config;

  return (
    <Accordion className={`rounded-lg border-l-4 ${config.border} ${config.bg} p-4`}>
      <AccordionItem className="border-none">
        <AccordionTrigger className="p-0 hover:no-underline">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Icon className={`w-6 h-6 ${config.text} mt-0.5 shrink-0`} strokeWidth={2} />
              <div className="min-w-0">
                <p className={`text-base font-bold ${config.text} leading-snug`}>
                  {verdict.action_label}
                </p>
                <p className="text-xs text-t3 mt-1">
                  {verdict.action_label_en}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-12 h-12 rounded-full ${config.badgeBg} flex items-center justify-center`}>
                <span className={`text-sm font-bold font-mono ${config.text}`}>
                  {verdict.confidence_score}%
                </span>
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent>
          <div className="mt-3 pt-3 border-t border-border/40 space-y-3">
            <p className="text-xs text-t2 leading-relaxed">{verdict.reasoning}</p>
            <div className="flex gap-4 text-[10px] font-mono text-t3">
              <span>RISK: <span className={config.text}>{verdict.risk_level.toUpperCase()}</span></span>
              <span>CONFIDENCE: <span className="text-t1">{verdict.confidence_score}%</span></span>
              <span>BUY: <span className={verdict.buy_recommendation ? 'text-success' : 'text-alert-red'}>
                {verdict.buy_recommendation ? 'YES' : 'NO'}
              </span></span>
            </div>
            {signals && signals.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-t3">Confidence Signals</p>
                {signals.map((s) => {
                  const pct = Math.round((s.value / s.weight) * 100);
                  return (
                    <div key={s.signal} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-t2 w-[130px] shrink-0">
                        {SIGNAL_LABELS[s.signal] || s.signal}
                      </span>
                      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warn' : 'bg-alert-red'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-t3 w-[60px] text-right">
                        {s.value}/{s.weight}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
