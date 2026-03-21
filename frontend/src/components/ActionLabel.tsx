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

export default function ActionLabel({ verdict }: { verdict: AnalystVerdict }) {
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
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs text-t2 leading-relaxed">{verdict.reasoning}</p>
            <div className="flex gap-4 mt-2 text-[10px] font-mono text-t3">
              <span>RISK: <span className={config.text}>{verdict.risk_level.toUpperCase()}</span></span>
              <span>CONFIDENCE: <span className="text-t1">{verdict.confidence_score}%</span></span>
              <span>BUY: <span className={verdict.buy_recommendation ? 'text-success' : 'text-alert-red'}>
                {verdict.buy_recommendation ? 'YES' : 'NO'}
              </span></span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
