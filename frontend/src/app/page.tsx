import type { Metadata } from 'next';
import Link from 'next/link';
import SupermemoryStatusBadge from '@/components/SupermemoryStatusBadge';

export const metadata: Metadata = {
  title: 'Megladon MD — Pharmaceutical price intelligence',
  description:
    'AI-powered price intelligence across Vietnamese pharmacy chains. Parallel agents, trends, and Supermemory-backed recall.',
};

export default function LandingPage() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-14 space-y-20">
      <section className="space-y-6 text-center sm:text-left">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan">The Abyss</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-t1 tracking-tight leading-tight">
          Megladon MD
        </h1>
        <p className="text-lg text-t2 max-w-xl">
          Surface real pharmacy listings fast, compare chains, and carry context across scans with
          hybrid memory — built for hackathon-grade demos and serious price workflows.
        </p>
        <div className="flex flex-wrap gap-3 justify-center sm:justify-start pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-cyan text-abyss px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Open dashboard
          </Link>
          <Link
            href="/architecture"
            className="inline-flex items-center justify-center rounded-lg border border-cyan/50 text-cyan px-5 py-2.5 text-sm font-medium hover:bg-cyan/10 transition-colors"
          >
            How it works
          </Link>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-6">
        {[
          {
            title: 'Parallel agents',
            body: 'Multiple AI agents hit pharmacy sources at once so you get a full market slice in seconds, not minutes.',
          },
          {
            title: 'Price intelligence',
            body: 'Lowest price, spread, savings signals, and per-chain fluctuation lines against your last scan.',
          },
          {
            title: 'Trends & history',
            body: 'Seven-day trajectories from stored scans and a dedicated trends view for deeper comparison.',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border bg-card/30 p-5 hover:border-cyan/25 transition-colors"
          >
            <h2 className="text-sm font-bold text-t1 mb-2">{item.title}</h2>
            <p className="text-xs text-t3 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </section>

      <section
        id="supermemory"
        className="rounded-2xl border border-cyan/20 bg-deep/80 p-8 sm:p-10 space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-t1">Supermemory on Megladon MD</h2>
            <p className="text-sm text-t2 max-w-2xl">
              We use{' '}
              <a
                href="https://supermemory.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline"
              >
                Supermemory
              </a>{' '}
              for per-user, drug-aware recall — not a generic chat history. Your browser gets a stable
              opaque id; the backend normalizes it into a container tag and scopes all memory to you.
            </p>
          </div>
          <SupermemoryStatusBadge />
        </div>

        <ol className="space-y-6 list-none pl-0 border-t border-border/60 pt-8">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan text-sm font-mono font-bold">
              1
            </span>
            <div>
              <h3 className="text-sm font-semibold text-t1 mb-1">Persist after each scan</h3>
              <p className="text-xs text-t3 leading-relaxed">
                When a search finishes, a <strong className="text-t2">background task</strong> calls{' '}
                <code className="text-cyan/90 text-[11px]">remember_search_session</code>: it builds a
                short text summary (drug, best price and source, savings, optional fluctuation lines) and
                stores it via Supermemory <code className="text-cyan/90 text-[11px]">add</code> with{' '}
                <code className="text-cyan/90 text-[11px]">container_tags</code> and structured{' '}
                <code className="text-cyan/90 text-[11px]">metadata</code> (e.g.{' '}
                <code className="text-cyan/90 text-[11px]">kind: megladon_md_scan</code>, drug query,
                prices). If <code className="text-cyan/90 text-[11px]">SUPERMEMORY_API_KEY</code> is
                unset, persistence is skipped.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan text-sm font-mono font-bold">
              2
            </span>
            <div>
              <h3 className="text-sm font-semibold text-t1 mb-1">Index (async)</h3>
              <p className="text-xs text-t3 leading-relaxed">
                Supermemory indexes new documents asynchronously. The dashboard may retry recall once
                after a short delay so related snippets can appear shortly after a first-time write.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan text-sm font-mono font-bold">
              3
            </span>
            <div>
              <h3 className="text-sm font-semibold text-t1 mb-1">Recall before the next search</h3>
              <p className="text-xs text-t3 leading-relaxed">
                Before streaming results, the client calls{' '}
                <code className="text-cyan/90 text-[11px]">GET /api/memory/recall?q=…&amp;user=…</code>.
                The API returns <code className="text-cyan/90 text-[11px]">enabled</code> and{' '}
                <code className="text-cyan/90 text-[11px]">snippets</code>. On the server, recall uses
                hybrid <code className="text-cyan/90 text-[11px]">search.memories</code> scoped to your
                container tag, with reranking and query rewrite so hints match how you ask for drugs
                today.
              </p>
            </div>
          </li>
        </ol>

        <div className="pt-4 border-t border-border/60">
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium text-cyan hover:underline"
          >
            Try it on the dashboard →
          </Link>
        </div>
      </section>

      <section className="text-center pb-8">
        <p className="text-sm text-t3 mb-4">Ready to run a probe?</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-cyan text-abyss px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Go to dashboard
        </Link>
      </section>
    </div>
  );
}
