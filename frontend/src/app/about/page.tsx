'use client';

import Link from 'next/link';
import { SplineSceneBackground } from '@/components/SplineSceneBackground';

// Gradient Sphere had "Data read, but end of buffer not reached" - use hero scene which is known to work.
// To fix Gradient Sphere: in Spline export, use Viewer URL instead of Public URL.
const ABOUT_SCENE = 'https://prod.spline.design/A3OzKbt9KVVITkmz/scene.splinecode';

export default function AboutPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <SplineSceneBackground
        sceneUrl={ABOUT_SCENE}
        overlay="abyss"
        zoom={1.2}
        disableControls
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-t1 tracking-tight">
            About <span className="text-cyan">Megalodon MD</span>
          </h1>
          <p className="text-lg md:text-xl text-t2 leading-relaxed">
            AI-powered pharmaceutical price intelligence across Vietnamese pharmacy chains.
            We surface the pricing abyss—turning fragmented e‑commerce catalogs into
            structured, procurement-ready intelligence.
          </p>
          <p className="text-sm text-t3 leading-relaxed">
            Built with TinyFish parallel agents, Exa semantic search, and real-time
            streaming—helping hospital buyers, clinic operators, and analysts navigate
            markets where 57,000+ outlets price independently.
          </p>
          <div className="pt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard"
              className="btn-press px-6 py-3 bg-cyan text-deep font-bold rounded-lg hover:bg-cyan/90 transition-colors"
            >
              Enter Dashboard
            </Link>
            <Link
              href="/"
              className="btn-press px-6 py-3 bg-deep border border-border text-t2 font-bold rounded-lg hover:bg-card hover:border-cyan/25 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
