'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale } from '@/components/LocaleProvider';
import { LampDemo } from '@/components/ui/lamp';
import { demoFetch } from '@/lib/api';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HeroParallax } from '@/components/HeroParallax';
import { HeroSplineBackground } from '@/components/HeroSplineBackground';
import { SplitText } from '@/components/SplitText';
import { SponsorHighlight } from '@/components/SponsorHighlight';
import { LANDING_SPONSOR_KEYS, LANDING_SPONSOR_BRAND } from '@/lib/landing-sponsors';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Zap, FlaskConical, Radio } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [liveStats, setLiveStats] = useState<{
    prices_tracked: number;
    anomalies_detected: number;
    violations_flagged: number;
    total_savings_vnd: number;
    total_products: number;
    total_scans: number;
    pharmacies_covered: number;
    drugs_tracked: number;
    avg_scan_time_ms: number;
  } | null>(null);

  const heroStagger = useMemo(
    () => ({
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduceMotion ? 0 : 0.085,
          delayChildren: reduceMotion ? 0 : 0.06,
        },
      },
    }),
    [reduceMotion],
  );

  const heroItem = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : {
            hidden: { opacity: 0, y: 22 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
            },
          },
    [reduceMotion],
  );

  useEffect(() => {
    setMounted(true);
    demoFetch('http://localhost:8000/api/stats')
      .then((r) => r.json())
      .then(setLiveStats)
      .catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" label={t('ui.loadingPage')} />
        <p className="text-xs font-mono text-t3 uppercase tracking-wider">{t('ui.loading')}</p>
      </div>
    );
  }

  const scanTimeSec = liveStats ? liveStats.avg_scan_time_ms / 1000 : 30;
  const stats: HeroStat[] = [
    {
      kind: 'counter',
      label: t('landing.statLatency'),
      prefix: t('landing.statLatencyValuePrefix'),
      suffix: t('landing.statLatencyValueSuffix'),
      value: scanTimeSec,
      formatter: (v: number) => v.toFixed(1),
    },
    { kind: 'counter', label: t('landing.statChains'), value: liveStats ? liveStats.total_scans : 5 },
    { kind: 'text', label: t('landing.statPharmacies'), value: t('landing.statPharmaciesValue') },
    { kind: 'text', label: t('landing.statMarket'), value: t('landing.statMarketValue') },
  ];

  return (
    <div className="min-h-screen bg-abyss text-t1 font-sans selection:bg-cyan/30">
      {/* Hero: parallax background + staggered copy */}
      <HeroParallax
        className="relative pt-[11.5rem] sm:pt-[12.65rem] md:pt-[14.95rem] pb-[9.2rem] md:pb-[12.65rem] overflow-hidden min-h-[min(100dvh,64.4rem)]"
        parallaxBack={<HeroSplineBackground />}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <motion.div
            className="text-left space-y-7 sm:space-y-8 max-w-3xl"
            variants={heroStagger}
            initial="hidden"
            animate="show"
          >
            <motion.h1
              variants={heroItem}
              className="text-[clamp(2.156rem,4.83vw,3.738rem)] sm:text-[3.45rem] lg:text-[3.738rem] font-semibold tracking-tight text-t1 leading-[1.08]"
            >
              {t('landing.heroLine1')} <br />
              <span className="text-cyan">{t('landing.heroLine2')}</span>
            </motion.h1>

            {t('landing.heroSub') && (
              <motion.p
                variants={heroItem}
                className="max-w-xl text-[1.15rem] sm:text-[1.3rem] text-t3 font-light leading-relaxed"
              >
                {t('landing.heroSub')}
              </motion.p>
            )}

            <motion.div variants={heroItem} className="pt-1">
              <LiquidButton
                href="/dashboard"
                size="lg"
                className="btn-press w-full sm:w-auto min-h-[3.15rem] sm:min-h-[3.45rem] rounded-xl px-8 sm:px-9 text-base sm:text-lg font-bold text-cyan"
              >
                {t('landing.enterDashboard')}
              </LiquidButton>
            </motion.div>
          </motion.div>
        </div>
      </HeroParallax>

      {/* Lamp Section — extended fade in/out for softer transition */}
      <section id="lamp" className="relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none [background:linear-gradient(to_bottom,rgba(13,28,50,0.99)_0%,rgba(13,28,50,0.9)_5%,rgba(13,28,50,0.75)_12%,rgba(13,28,50,0.5)_22%,rgba(13,28,50,0.2)_35%,transparent_42%,transparent_58%,rgba(13,28,50,0.2)_65%,rgba(13,28,50,0.5)_78%,rgba(13,28,50,0.75)_88%,rgba(13,28,50,0.9)_95%,#0D1C32_100%)]"
          aria-hidden
        />
        <ScrollReveal threshold={0.08}>
        <LampDemo
          line1={t('landing.lampLine1')}
          line2={t('landing.lampLine2')}
          className="min-h-[135vh] rounded-none"
          compact
        />
        </ScrollReveal>
      </section>

      {/* Link to full architecture + sponsors on About */}
      <section
        aria-label={t('landing.viewMethodology')}
        className="py-10 md:py-12 [background:linear-gradient(to_bottom,#0D1C32_0%,rgba(13,28,50,0.95)_30%,rgba(1,14,36,0.85)_70%,#010E24_100%)]"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <Link
            href="/about#product-stack"
            className="btn-press inline-flex px-6 py-3 bg-deep border border-border text-t2 font-bold rounded-lg text-base hover:bg-card hover:border-cyan/25 transition-colors w-fit"
          >
            {t('landing.viewMethodology')}
          </Link>
          <p className="text-xs text-t3 font-mono italic max-w-md leading-relaxed">{t('landing.stackDetailsHint')}</p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-24 [background:linear-gradient(to_bottom,#010E24_0%,rgba(1,14,36,0.95)_40%,rgba(13,28,50,0.92)_75%,#0D1C32_100%)]">
        <div className="max-w-7xl mx-auto px-6">
          {/* First 2 features side by side */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <ScrollReveal delay={0} direction="left">
              <div className="interactive-lift p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-colors group">
                <Zap className="w-8 h-8 text-cyan mb-4 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="text-xl font-bold mb-3 text-t1">{t('landing.feat1Title')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <SponsorHighlight>{LANDING_SPONSOR_BRAND.tinyfish}</SponsorHighlight>
                </div>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat1Desc')}</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={120} direction="right">
              <div className="interactive-lift p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-colors group">
                <FlaskConical className="w-8 h-8 text-cyan mb-4 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="text-xl font-bold mb-3 text-t1">{t('landing.feat2Title')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <SponsorHighlight>{LANDING_SPONSOR_BRAND.exa}</SponsorHighlight>
                </div>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat2Desc')}</p>
              </div>
            </ScrollReveal>
          </div>
          {/* 3rd feature full-width horizontal bar */}
          <ScrollReveal delay={240} direction="scale">
            <div className="interactive-lift flex flex-col sm:flex-row items-start gap-6 sm:gap-8 p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-colors group">
              <Radio className="w-8 h-8 text-cyan flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold mb-3 text-t1">{t('landing.feat3Title')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <SponsorHighlight>{LANDING_SPONSOR_BRAND.elevenlabs}</SponsorHighlight>
                  <SponsorHighlight>{LANDING_SPONSOR_BRAND.openrouter}</SponsorHighlight>
                  <SponsorHighlight>{LANDING_SPONSOR_BRAND.openai}</SponsorHighlight>
                </div>
                <p className="text-t3 leading-relaxed text-sm">{t('landing.feat3Desc')}</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section id="abyss" className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-abyss via-abyss to-abyss">
        <ScrollReveal className="max-w-4xl mx-auto px-6 text-center relative z-10" direction="up">
          <h2 className="mb-8 w-full">
            <SplitText
              text={t('landing.ctaTitle')}
              className="text-4xl md:text-6xl font-bold"
              delay={50}
              duration={1.25}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          </h2>
          <p className="text-xl text-t3 mb-12">
            {t('landing.ctaSub')}
          </p>
          <Link
            href="/dashboard"
            className="btn-press inline-block px-10 py-4 bg-t1 text-deep font-bold rounded-full text-lg hover:bg-cyan hover:text-deep transition-colors shadow-lg"
          >
            {t('landing.ctaButton')}
          </Link>
        </ScrollReveal>
      </section>
    </div>
  );
}
