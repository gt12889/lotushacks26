'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from '@/components/LocaleProvider';
import { Counter } from '@/components/ui/counter';
import { Aurora } from '@/components/ui/aurora';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Zap, FlaskConical, Radio } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return null;

  const stats = [
    { label: t('landing.statLatency'), prefix: '< ', value: 30, suffix: 's' },
    { label: t('landing.statData'), value: 14.2, suffix: 'M+', formatter: (v: number) => v.toFixed(1) },
    { label: t('landing.statAccuracy'), value: 99.9, suffix: '%', formatter: (v: number) => v.toFixed(1) },
    { label: t('landing.statCoverage'), prefix: 'Top ', value: 5, suffix: '' },
  ];

  return (
    <div className="min-h-screen bg-abyss text-t1 font-sans selection:bg-cyan/30">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-16 pb-20 overflow-hidden">
        {/* Aurora Background */}
        <Aurora
          colors={['#00DBE7', '#0E7490', '#2DD4BF', '#0D4F6B', '#064E6E']}
          speed={0.8}
          opacity={0.2}
          blur={100}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/60 via-transparent to-deep/95 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            {/* Left column - 60% */}
            <div className="md:col-span-3 text-left">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-t1 mb-6">
                {t('landing.heroLine1')} <br />
                <span className="text-cyan">{t('landing.heroLine2')}</span>
              </h1>

              <p className="max-w-xl text-lg md:text-xl text-t3 mb-10 font-light leading-relaxed">
                {t('landing.heroSub')}
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-6 py-3 bg-cyan text-deep font-bold rounded-lg text-base transition-colors shadow-lg hover:bg-cyan/90"
                >
                  {t('landing.enterDashboard')}
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-6 py-3 bg-deep border border-border text-t2 font-bold rounded-lg text-base hover:bg-card transition-colors"
                >
                  {t('landing.viewMethodology')}
                </a>
              </div>
            </div>

            {/* Right column - 40% — KPI stats */}
            <div ref={statsRef} className="md:col-span-2 grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-card/20 border border-border/40 backdrop-blur-sm"
                >
                  <div className="text-2xl font-bold text-cyan mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {s.prefix}
                    {statsVisible ? (
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
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-deep">
        <div className="max-w-7xl mx-auto px-6">
          {/* First 2 features side by side */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-all group">
                <Zap className="w-8 h-8 text-cyan mb-6" />
                <h3 className="text-xl font-bold mb-4 text-t1">{t('landing.feat1Title')}</h3>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat1Desc')}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <div className="p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-all group">
                <FlaskConical className="w-8 h-8 text-cyan mb-6" />
                <h3 className="text-xl font-bold mb-4 text-t1">{t('landing.feat2Title')}</h3>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat2Desc')}</p>
              </div>
            </ScrollReveal>
          </div>
          {/* 3rd feature full-width horizontal bar */}
          <ScrollReveal delay={240}>
            <div className="flex items-center gap-8 p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-all group">
              <Radio className="w-8 h-8 text-cyan flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2 text-t1">{t('landing.feat3Title')}</h3>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat3Desc')}</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Infrastructure / How It Works */}
      <section className="py-24 border-t border-border/20 bg-abyss">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start gap-16">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono text-cyan mb-4 uppercase tracking-widest">
                {t('landing.infraBadge')}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
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
            {/* Simple tech partners list replacing the spinning orbs */}
            <div className="flex-1 w-full p-8 bg-deep border border-border/60 rounded-2xl">
              <h3 className="text-xs font-mono text-t3 uppercase tracking-widest mb-6">{t('landing.clusterHealth')}</h3>
              <div className="space-y-5">
                {[
                  { name: 'Exa AI', role: 'Search Engine' },
                  { name: 'Gemini 2.5 Pro', role: 'Analysis Agent' },
                  { name: 'PharmaDB', role: 'Drug Database' },
                  { name: 'WHO GMP', role: 'Regulatory Data' },
                ].map((partner, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <span className="text-sm font-semibold text-t1">{partner.name}</span>
                    <span className="text-[10px] font-mono text-t3 uppercase tracking-wider">{partner.role}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-t3 uppercase tracking-wider">{t('landing.clusterHealth')}</span>
                  <span className="text-[10px] font-mono text-success">{t('landing.clusterActive')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="abyss" className="py-32 relative overflow-hidden">
        <ScrollReveal className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8">{t('landing.ctaTitle')}</h2>
          <p className="text-xl text-t3 mb-12">
            {t('landing.ctaSub')}
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-10 py-4 bg-t1 text-deep font-bold rounded-full text-lg hover:bg-cyan hover:text-deep transition-colors shadow-lg"
          >
            {t('landing.ctaButton')}
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
