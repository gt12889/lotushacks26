'use client';

import { useEffect, useState } from 'react';

export default function AbyssFooter() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'UTC' }) + ' UTC');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-border bg-deep px-6 py-3">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[10px] text-t3 font-mono">
        <div className="flex gap-6">
          <span className="hover:text-t2 cursor-pointer">Privacy Protocol</span>
          <span className="hover:text-t2 cursor-pointer">Abyssal Methodology</span>
          <span className="hover:text-t2 cursor-pointer">Source Oracle</span>
        </div>
        <span>System Synchronized: {time}</span>
      </div>
    </footer>
  );
}
