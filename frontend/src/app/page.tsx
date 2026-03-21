'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-abyss text-t1 font-sans selection:bg-cyan/30">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan rounded flex items-center justify-center font-bold text-deep">M</div>
            <span className="font-bold text-lg tracking-tight">Megladon MD</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-mono text-t3">
            <a href="#features" className="hover:text-cyan transition-colors">Infrastructure</a>
            <a href="#intelligence" className="hover:text-cyan transition-colors">Intelligence</a>
            <a href="#abyss" className="hover:text-cyan transition-colors">The Abyss</a>
          </div>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-cyan text-deep text-xs font-bold font-mono rounded hover:bg-cyan/90 transition-all shadow-[0_0_15px_rgba(0,219,231,0.3)]"
          >
            LAUNCH TERMINAL
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Grid/Effect */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,219,231,0.08)_0%,transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono text-cyan mb-8 uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
            System Status: Operational in Vietnam
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-t1 to-t1/40">
            SURFACE THE <br />
            <span className="text-cyan">PRICING ABYSS.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-t3 mb-12 font-light leading-relaxed">
            The first parallel AI agent network for pharmaceutical price intelligence. 
            Automating the hunt for transparency in Vietnam&apos;s opaque medical markets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-cyan text-deep font-bold rounded-lg text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,219,231,0.2)]"
            >
              Enter Dashboard
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-deep border border-border text-t2 font-bold rounded-lg text-lg hover:bg-card transition-colors"
            >
              View Methodology
            </a>
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
              <div className="text-t3">[INFO] Spawning 5 parallel agents via TinyFish infrastructure...</div>
              <div className="text-cyan">[AGENT-01] Successfully bypassed Long Chau anti-bot...</div>
              <div className="text-cyan">[AGENT-02] Scraped Pharmacity: 12 variants found...</div>
              <div className="text-t2">[RESULT] Spread detected: 14,200đ — 58,000đ</div>
              <div className="text-warn">[ALERT] Megladon signal: 300% potential arbitrage found.</div>
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
                title: "Parallel Agent Network",
                desc: "TinyFish-powered agents simulate real human behavior to navigate complex pharmacy interfaces simultaneously.",
                icon: "⚡"
              },
              {
                title: "Deep Market Oracle",
                desc: "Real-time pricing data from Long Chau, Pharmacity, and An Khang surfaces hidden market trajectories.",
                icon: "🔮"
              },
              {
                title: "Enterprise Monitoring",
                desc: "Automatic tracking of 500+ essential drug SKUs with high-fidelity alerting for price spikes and drops.",
                icon: "📊"
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card/20 border border-border/40 hover:border-cyan/40 transition-all group">
                <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">{f.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-t1">{f.title}</h3>
                <p className="text-t3 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section id="intelligence" className="py-24 border-y border-border/20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Scan Latency", val: "< 30s" },
            { label: "Data Points", val: "14.2M+" },
            { label: "Accuracy", val: "99.9%" },
            { label: "Pharmacy Coverage", val: "Top 5" }
          ].map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-black text-cyan mb-2">{s.val}</div>
              <div className="text-[10px] font-mono text-t3 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Infrastructure Visualization */}
      <section className="py-24 border-t border-border/20 bg-abyss">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-[10px] font-mono text-cyan mb-4 uppercase tracking-widest">
                Protocol Architecture
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6">
                DISTRIBUTED <br />
                <span className="text-cyan">ORCHESTRATION.</span>
              </h2>
              <p className="text-t3 mb-8 leading-relaxed">
                Megladon MD doesn&apos;t just scrape. It deploys a fleet of headless browsers orchestrated by our proprietary agent-routing logic. Each agent is tasked with a specific pharmacy domain, bypassing sophisticated anti-bot systems to retrieve the most accurate, real-time data.
              </p>
              <div className="space-y-4">
                {[
                  "Biometric human-simulation engines",
                  "Dynamic proxy rotation for zero-fail scraping",
                  "Real-time molecular data normalization",
                  "Encrypted telemetry for research privacy"
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
                  <span className="text-[10px] font-mono text-cyan">Cluster Health</span>
                  <span className="text-[10px] font-mono text-success">Active</span>
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
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">READY TO DEPLOY?</h2>
          <p className="text-xl text-t3 mb-12">
            Join the elite healthcare researchers using Megladon MD to navigate the pricing abyss.
          </p>
          <Link 
            href="/dashboard"
            className="inline-block px-12 py-5 bg-t1 text-deep font-black rounded-full text-xl hover:bg-cyan hover:text-deep transition-all shadow-2xl"
          >
            Launch Terminal Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-border rounded flex items-center justify-center font-bold text-[10px] text-t3">M</div>
            <span className="text-sm font-bold text-t3">Megladon MD © 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] font-mono text-t3 uppercase tracking-wider">
            <a href="#" className="hover:text-cyan transition-colors">Architecture</a>
            <a href="#" className="hover:text-cyan transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan transition-colors">Legal</a>
            <span className="text-border">|</span>
            <span className="text-success">System: Synchronized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
