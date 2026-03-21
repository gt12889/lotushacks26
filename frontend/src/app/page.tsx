'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale } from '@/components/LocaleProvider';
import { Counter } from '@/components/ui/counter';
import { LampDemo } from '@/components/ui/lamp';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { HeroParallax } from '@/components/HeroParallax';
import { HeroSplineBackground } from '@/components/HeroSplineBackground';
import { SplitText } from '@/components/SplitText';
import { SponsorHighlight } from '@/components/SponsorHighlight';
import { LANDING_SPONSOR_KEYS, LANDING_SPONSOR_BRAND } from '@/lib/landing-sponsors';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Zap, FlaskConical, Radio } from 'lucide-react';

type HeroStat =
  | {
      kind: 'counter';
      label: string;
      prefix?: string;
      suffix?: string;
      value: number;
      formatter?: (v: number) => string;
    }
  | { kind: 'text'; label: string; value: string };

export default function LandingPage() {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!mounted) return;
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" label={t('ui.loadingPage')} />
        <p className="text-xs font-mono text-t3 uppercase tracking-wider">{t('ui.loading')}</p>
      </div>
    );
  }

  const stats: HeroStat[] = [
    {
      kind: 'counter',
      label: t('landing.statLatency'),
      prefix: t('landing.statLatencyValuePrefix'),
      suffix: t('landing.statLatencyValueSuffix'),
      value: 30,
    },
    { kind: 'counter', label: t('landing.statChains'), value: 5 },
    { kind: 'text', label: t('landing.statPharmacies'), value: t('landing.statPharmaciesValue') },
    { kind: 'text', label: t('landing.statMarket'), value: t('landing.statMarketValue') },
  ];

  return (
    <div className="min-h-screen bg-abyss text-t1 font-sans selection:bg-cyan/30">
      {/* Hero: parallax background + staggered copy */}
      <HeroParallax
        className="relative pt-24 md:pt-32 pb-48 overflow-hidden min-h-[960px]"
        parallaxBack={<HeroSplineBackground />}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
            <motion.div
              className="md:col-span-3 text-left"
              variants={heroStagger}
              initial="hidden"
              animate="show"
            >
              <motion.h1
                variants={heroItem}
                className="text-4xl md:text-5xl font-semibold tracking-tight text-t1 mb-6"
              >
                {t('landing.heroLine1')} <br />
                <span className="text-cyan">{t('landing.heroLine2')}</span>
              </motion.h1>

              {t('landing.heroSub') && (
                <motion.p
                  variants={heroItem}
                  className="max-w-xl text-lg md:text-xl text-t3 mb-10 font-light leading-relaxed"
                >
                  {t('landing.heroSub')}
                </motion.p>
              )}

              <motion.div variants={heroItem}>
                <LiquidButton
                  href="/dashboard"
                  size="lg"
                  className="btn-press w-full sm:w-auto min-h-12 rounded-lg px-6 text-base font-bold text-cyan"
                >
                  {t('landing.enterDashboard')}
                </LiquidButton>
              </motion.div>
            </motion.div>

            <div className="md:col-span-2 flex flex-col gap-8">
              <div ref={statsRef} className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: reduceMotion ? 0 : 0.05 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="interactive-lift p-5 rounded-xl bg-card/20 border border-border/40 backdrop-blur-sm"
                  >
                    <div
                      className="text-2xl font-bold text-cyan mb-1 min-h-[2rem] flex items-baseline flex-wrap gap-x-0"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {s.kind === 'text' ? (
                        s.value
                      ) : statsVisible ? (
                        <>
                          {s.prefix}
                          <Counter value={s.value} duration={1500} formatter={s.formatter} />
                          {s.suffix}
                        </>
                      ) : (
                        <>
                          {s.prefix ?? ''}0{s.suffix ?? ''}
                        </>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-t3 uppercase tracking-widest leading-snug">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </HeroParallax>

      {/* How it works — secondary CTA (below hero) */}
      <section
        aria-label={t('landing.viewMethodology')}
        className="border-t border-border/25 bg-deep/50 py-10 md:py-12"
      >
        <div className="max-w-7xl mx-auto px-6">
          <a
            href="#features"
            className="btn-press inline-flex px-6 py-3 bg-deep border border-border text-t2 font-bold rounded-lg text-base hover:bg-card hover:border-cyan/25 transition-colors"
          >
            {t('landing.viewMethodology')}
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-24 bg-deep">
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

      {/* Lamp Section */}
      <section id="lamp" className="relative">
        <ScrollReveal threshold={0.08}>
        <LampDemo
          line1={t('landing.lampLine1')}
          line2={t('landing.lampLine2')}
          className="min-h-[120vh] rounded-none"
          compact
        />
        </ScrollReveal>
      </section>

      {/* Infrastructure / How It Works */}
      <section className="py-20 md:py-24 border-t border-border/20 bg-abyss">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start gap-16">
            <ScrollReveal direction="right" className="flex-1">
            <div>
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
            </ScrollReveal>
            <ScrollReveal direction="left" delay={80} className="flex-1 w-full">
            <div className="p-8 bg-deep border border-border/60 rounded-2xl interactive-lift">
              <h3 className="text-sm font-bold text-t1 mb-1">{t('landing.sponsorsTitle')}</h3>
              <p className="text-xs text-t3 leading-relaxed mb-6">{t('landing.sponsorsIntro')}</p>
              <div className="border-t border-border/30 pt-2">
                {LANDING_SPONSOR_KEYS.map((key) => (
                  <div
                    key={key}
                    className="py-4 border-b border-border/30 last:border-0"
                  >
                    <SponsorHighlight className="mb-2">{LANDING_SPONSOR_BRAND[key]}</SponsorHighlight>
                    <p className="text-xs text-t2 leading-relaxed">{t(`landing.sponsor.${key}`)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/20">
                <span className="text-[10px] font-mono text-t3 uppercase tracking-wider">{t('landing.clusterHealth')}</span>
                <span className="text-[10px] font-mono text-success">{t('landing.clusterActive')}</span>
              </div>
            </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="abyss" className="py-20 md:py-28 relative overflow-hidden">
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
