'use client';

import { useState } from 'react';

export default function SonarFilters() {
  const [priceType, setPriceType] = useState<'awp' | 'wac'>('awp');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [drugClasses, setDrugClasses] = useState<string[]>(['cardiovascular']);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);

  const toggleClass = (cls: string) => {
    setDrugClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const classes = [
    { id: 'cardiovascular', label: 'Cardiovascular' },
    { id: 'antidiabetics', label: 'Antidiabetics' },
    { id: 'anti-infectives', label: 'Anti-infectives' },
  ];

  return (
    <aside className="w-[222px] shrink-0 bg-abyss border-l border-border overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-[11px] font-bold text-t1 uppercase tracking-[0.15em]">Sonar Filters</h3>
        </div>

        {/* Selected Molecule */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-t3 font-mono mb-1.5">Selected Molecule</label>
          <div className="bg-card border border-white/10 rounded px-3 py-2 text-xs text-t1 cursor-pointer hover:border-cyan/30 transition-colors">
            Metformin HCL (ER)
          </div>
        </div>

        {/* Price Type Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setPriceType('awp')}
            className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-colors ${
              priceType === 'awp'
                ? 'bg-cyan/10 border border-cyan text-cyan'
                : 'bg-card border border-white/10 text-t1 hover:border-cyan/30'
            }`}
          >
            AWP
          </button>
          <button
            onClick={() => setPriceType('wac')}
            className={`flex-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded transition-colors ${
              priceType === 'wac'
                ? 'bg-cyan/10 border border-cyan text-cyan'
                : 'bg-card border border-white/10 text-t1 hover:border-cyan/30'
            }`}
          >
            WAC
          </button>
        </div>

        {/* Time Range */}
        <div className="flex gap-1">
          {(['7d', '30d', '90d'] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`flex-1 px-2 py-1.5 text-[10px] font-mono font-bold rounded transition-colors ${
                timeRange === r
                  ? 'bg-cyan/10 border border-cyan text-cyan'
                  : 'bg-card border border-white/10 text-t1 hover:border-cyan/30'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Drug Class */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-t3 font-mono mb-1.5">Drug Class</label>
          <div className="flex flex-wrap gap-1.5">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => toggleClass(cls.id)}
                className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-colors ${
                  drugClasses.includes(cls.id)
                    ? 'bg-cyan/10 border-cyan/40 text-cyan'
                    : 'bg-card border-white/10 text-t2 hover:border-cyan/30'
                }`}
              >
                {drugClasses.includes(cls.id) && <span className="mr-1">✓</span>}
                {cls.label}
              </button>
            ))}
          </div>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-t3 font-mono mb-1.5">Manufacturer</label>
          <div className="bg-card border border-white/10 rounded px-3 py-2 text-xs text-t1 cursor-pointer hover:border-cyan/30 transition-colors">
            All Manufacturers
          </div>
        </div>

        {/* Price Threshold */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-t3 font-mono mb-2">Price Threshold ($)</label>
          <div className="relative h-1 bg-card rounded-full mb-2">
            <div
              className="absolute h-full bg-cyan rounded-full"
              style={{ left: `${(minPrice / 10000) * 100}%`, right: `${100 - (maxPrice / 10000) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-t3 font-mono">
            <span>{minPrice.toFixed(2)}</span>
            <span>{maxPrice.toLocaleString()}.00+</span>
          </div>
        </div>

        {/* Clear */}
        <div className="text-center pt-1">
          <button className="text-[10px] text-t3 hover:text-t2 transition-colors font-mono">
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-4 bg-cyan p-4">
        <button className="w-full text-left">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00363A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <div className="text-[10px] font-bold text-[#00363A] uppercase tracking-wider">Recall Calculate</div>
              <div className="text-[8px] text-[#00363A]/70 uppercase tracking-wider">Pharma Sonar SS</div>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
