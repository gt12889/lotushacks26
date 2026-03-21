'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Counter } from '@/components/ui/counter';
import { Aurora } from '@/components/ui/aurora';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function LandingPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-mono text-t3 uppercase tracking-wider">{t('ui.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss text-t1 font-sans selection:bg-cyan/30">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-16 pb-20 overflow-hidden">
        {/* Aurora Background */}
        <Aurora
          colors={['#00DBE7', '#0E7490', '#2DD4BF', '#0D4F6B', '#064E6E']}
          speed={0.8}
          opacity={0.35}
          blur={100}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/60 via-transparent to-deep/95 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono text-cyan mb-8 uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
            {t('landing.status')}
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-t1 to-t1/40">
            {t('landing.heroLine1')} <br />
            <span className="text-cyan">{t('landing.heroLine2')}</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-t3 mb-12 font-light leading-relaxed">
            {t('landing.heroSub')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <LiquidButton
              href="/dashboard"
              size="xl"
              className="w-full min-w-[min(100%,16rem)] font-bold text-base text-cyan drop-shadow-[0_0_24px_rgba(0,219,231,0.35)] sm:w-auto"
            >
              {t('landing.enterDashboard')}
            </LiquidButton>
            <LiquidButton
              href="#features"
              variant="outline"
              size="xl"
              className="w-full min-w-[min(100%,16rem)] font-bold text-base text-t1 sm:w-auto"
            >
              {t('landing.viewMethodology')}
            </LiquidButton>
          </div>

          {/* Floating Terminal Snippet */}
          <div className="mt-20 max-w-4xl mx-auto bg-black/40 border border-border/60 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-1.5 px-4 py-3 bg-card/40 border-b border-border/40">
              <div className="w-2.5 h-2.5 rounded-full bg-alert-red/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              <div className="ml-2 text-[10px] font-mono text-t3">megladon-agent-v2.5 — bash</div>
            </div>
            <div className="p-6 text-left font-mono text-xs md:text-sm space-y-2">
              <div className="text-success">$ megladon scan --query &quot;Atorvastatin 20mg&quot; --market &quot;VN&quot;</div>
              <div className="text-t3">[INFO] {t('landing.termInfo')}</div>
              <div className="text-cyan">[AGENT-01] {t('landing.termAgent1')}</div>
              <div className="text-cyan">[AGENT-02] {t('landing.termAgent2')}</div>
              <div className="text-t2">[RESULT] {t('landing.termResult')}</div>
              <div className="text-warn">[ALERT] {t('landing.termAlert')}</div>
              <div className="animate-pulse text-t1 mt-4">_</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-deep">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: t('landing.feat1Title'),
                desc: t('landing.feat1Desc'),
                icon: '⚡',
              },
              {
                title: t('landing.feat2Title'),
                desc: t('landing.feat2Desc'),
                icon: '🔮',
              },
              {
                title: t('landing.feat3Title'),
                desc: t('landing.feat3Desc'),
                icon: '📊',
              },
            ].map((f, i) => (
              <ScrollReveal key={i} delay={i * 120}>
                <div className="p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-all group">
                  <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-4 text-t1">{f.title}</h3>
                  <p className="text-t3 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <ScrollReveal>
        <StatsSection t={t} />
      </ScrollReveal>

      {/* Infrastructure Visualization */}
      <section className="py-24 border-t border-border/20 bg-abyss">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono text-cyan mb-4 uppercase tracking-widest">
                {t('landing.infraBadge')}
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                {t('landing.infraTitle1')} <br />
                <span className="text-cyan">{t('landing.infraTitle2')}</span>
              </h2>
              <p className="text-t3 mb-8 leading-relaxed">
                {t('landing.infraBody')}
              </p>
              <div className="space-y-4">
                {[
                  t('landing.infraBullet1'),
                  t('landing.infraBullet2'),
                  t('landing.infraBullet3'),
                  t('landing.infraBullet4'),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-cyan rounded-full" />
                    <span className="text-sm text-t2 font-mono">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full aspect-square bg-deep border border-border/60 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,219,231,0.1),transparent)] group-hover:scale-150 transition-transform duration-1000" />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Mock Diagram */}
                <div className="relative w-64 h-64">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-cyan rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-cyan/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan/20 blur-xl rounded-full" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan rounded-full shadow-[0_0_15px_rgba(0,219,231,0.8)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan/40 rounded-full" />
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 bg-cyan/40 rounded-full" />
                  <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 bg-cyan/40 rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-border/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono text-cyan">{t('landing.clusterHealth')}</span>
                  <span className="text-[10px] font-mono text-success">{t('landing.clusterActive')}</span>
                </div>
                <div className="h-1 bg-border/40 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan w-3/4 animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="abyss" className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan/5 rounded-full blur-[120px] pointer-events-none" />
        <ScrollReveal className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">{t('landing.ctaTitle')}</h2>
          <p className="text-xl text-t3 mb-12">
            {t('landing.ctaSub')}
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-12 py-5 bg-t1 text-deep font-black rounded-full text-xl hover:bg-cyan hover:text-deep transition-all shadow-2xl"
          >
            {t('landing.ctaButton')}
          </Link>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-border rounded flex items-center justify-center font-bold text-[10px] text-t3">M</div>
            <span className="text-sm font-bold text-t3">{t('landing.copy')}</span>
          </div>
          <div className="flex gap-8 text-[10px] font-mono text-t3 uppercase tracking-wider">
            <a href="#" className="hover:text-cyan transition-colors">
              {t('landing.footerArch')}
            </a>
            <a href="#" className="hover:text-cyan transition-colors">
              {t('landing.footerPrivacy')}
            </a>
            <a href="#" className="hover:text-cyan transition-colors">
              {t('landing.footerLegal')}
            </a>
            <span className="text-border">|</span>
            <span className="text-success">{t('landing.footerSys')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatsSection({ t }: { t: (key: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { label: t('landing.statLatency'), prefix: '< ', value: 30, suffix: 's' },
    { label: t('landing.statData'), value: 14.2, suffix: 'M+', formatter: (v: number) => v.toFixed(1) },
    { label: t('landing.statAccuracy'), value: 99.9, suffix: '%', formatter: (v: number) => v.toFixed(1) },
    { label: t('landing.statCoverage'), prefix: 'Top ', value: 5, suffix: '' },
  ];

  return (
    <section id="intelligence" className="py-24 border-y border-border/20">
      <div ref={ref} className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-center">
        {stats.map((s, i) => (
          <div key={i}>
            <div className="text-4xl font-black text-cyan mb-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {s.prefix}
              {visible ? (
                <Counter value={s.value} duration={1500} formatter={s.formatter} />
              ) : (
                '0'
              )}
              {s.suffix}
            </div>
            <div className="text-[10px] font-mono text-t3 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
