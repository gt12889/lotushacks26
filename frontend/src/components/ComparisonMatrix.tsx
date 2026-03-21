'use client';

interface MatrixData {
  optimized_route: { drug: string; source: string; price: number; product: string }[];
  optimized_total: number;
  best_single_source: string | null;
  best_single_total: number | null;
  savings_vs_single: number | null;
  source_totals: Record<string, number>;
}

interface DrugResult {
  best_price: number | null;
  best_source: string;
  best_product?: string;
  total_products: number;
  error?: string;
}

interface ComparisonMatrixProps {
  drugs: string[];
  results: Record<string, DrugResult>;
  matrix: MatrixData;
  recommendation: string;
}

export default function ComparisonMatrix({ drugs, results, matrix, recommendation }: ComparisonMatrixProps) {
  if (!drugs.length) return null;

  return (
    <div className="space-y-4">
      <div className="bg-deep border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold text-t1 uppercase tracking-wider">Optimal Sourcing Matrix</h3>
          {matrix.savings_vs_single != null && matrix.savings_vs_single > 0 && (
            <span className="px-3 py-1 bg-success/10 text-success text-xs font-mono rounded-full border border-success/20">
              Save {matrix.savings_vs_single.toLocaleString()}₫ vs single-source
            </span>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Drug</th>
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Best Source</th>
              <th className="text-left py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Product</th>
              <th className="text-right py-2.5 px-6 text-[10px] uppercase tracking-wider text-t3 font-mono">Price</th>
            </tr>
          </thead>
          <tbody>
            {matrix.optimized_route.map((item) => (
              <tr key={item.drug} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                <td className="py-2.5 px-6 text-t1 text-xs font-bold">{item.drug}</td>
                <td className="py-2.5 px-6 text-cyan text-xs">{item.source}</td>
                <td className="py-2.5 px-6 text-t2 text-xs">{item.product}</td>
                <td className="py-2.5 px-6 text-right font-mono text-t1">{item.price.toLocaleString()}₫</td>
              </tr>
            ))}
            {drugs.filter(d => !results[d]?.best_price).map((drug) => (
              <tr key={drug} className="border-b border-border/50 opacity-50">
                <td className="py-2.5 px-6 text-t1 text-xs">{drug}</td>
                <td colSpan={3} className="py-2.5 px-6 text-alert-red text-xs font-mono">Not found</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-cyan/20 bg-cyan/5">
              <td colSpan={3} className="py-3 px-6 text-xs font-bold text-cyan uppercase">Optimized Total</td>
              <td className="py-3 px-6 text-right font-mono font-bold text-cyan text-base">{matrix.optimized_total.toLocaleString()}₫</td>
            </tr>
            {matrix.best_single_source && matrix.best_single_total && (
              <tr className="bg-card/30">
                <td colSpan={3} className="py-2 px-6 text-[10px] text-t3 font-mono">
                  vs. best single source ({matrix.best_single_source})
                </td>
                <td className="py-2 px-6 text-right font-mono text-t3 text-xs">{matrix.best_single_total.toLocaleString()}₫</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>

      {recommendation && (
        <div className="bg-deep border border-cyan/20 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-cyan font-mono font-bold">AI Recommendation</span>
            <span className="text-[10px] text-t3 font-mono ml-auto">via OpenRouter</span>
          </div>
          <p className="text-sm text-t2 leading-relaxed">{recommendation}</p>
        </div>
      )}
    </div>
  );
}
