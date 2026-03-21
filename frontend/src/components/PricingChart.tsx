'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PricePoint {
  source_id: string;
  source_name: string;
  product_name: string;
  price: number;
  observed_at: string;
}

interface PricingChartProps {
  data: PricePoint[];
}

const SOURCE_COLORS: Record<string, string> = {
  long_chau: '#3B82F6',
  pharmacity: '#22C55E',
  an_khang: '#F97316',
  than_thien: '#A855F7',
  medicare: '#14B8A6',
};

export default function PricingChart({ data }: PricingChartProps) {
  if (data.length === 0) return null;

  const byDate: Record<string, Record<string, number>> = {};
  const sources = new Set<string>();

  for (const p of data) {
    const date = new Date(p.observed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!byDate[date]) byDate[date] = {};
    byDate[date][p.source_id] = p.price;
    sources.add(p.source_id);
  }

  const chartData = Object.entries(byDate).map(([date, prices]) => ({ date, ...prices }));
  const sourceNames: Record<string, string> = {};
  for (const p of data) sourceNames[p.source_id] = p.source_name;

  return (
    <div className="bg-deep border border-border rounded-lg p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: 'rgba(0,219,231,0.1)' }} tickLine={false} />
          <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#010E24', border: '1px solid rgba(0,219,231,0.2)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#D6E3FF' }}
            itemStyle={{ color: '#94A3B8' }}
            formatter={(value: number) => [`${value.toLocaleString()} VND`]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 11 }}>{sourceNames[value] || value}</span>}
          />
          {Array.from(sources).map((sourceId) => (
            <Line
              key={sourceId}
              type="monotone"
              dataKey={sourceId}
              stroke={SOURCE_COLORS[sourceId] || '#64748B'}
              strokeWidth={2}
              dot={{ r: 3, fill: SOURCE_COLORS[sourceId] || '#64748B' }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
