'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Summary = { title: string; description?: string; bullets: string[] };

export default function HelpPanel({
  summary,        // optional fallback
  docPath,        // e.g., "/help/docs/settings/data-tables"
  tabsBarHeight = 58,
}: {
  summary?: Summary;
  docPath?: string;
  tabsBarHeight?: number;
}) {
  const [loading, setLoading] = useState<boolean>(!!docPath);
  const [error, setError] = useState<string | null>(null);
  const [autoSummary, setAutoSummary] = useState<Summary | null>(null);

  const merged: Summary = useMemo(() => {
    if (autoSummary) return autoSummary;
    if (summary) return summary;
    return { title: 'SETTINGS', description: undefined, bullets: [] };
  }, [autoSummary, summary]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!docPath) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/help/summary?path=${encodeURIComponent(docPath)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Summary;
        if (!cancelled) setAutoSummary(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load summary');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [docPath]);

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* Top band */}
      <div
        className="px-4 pt-1 flex flex-col justify-center"
        style={{ height: tabsBarHeight }}
      >
        <h3 className="text-[15px] text-muted-foreground uppercase tracking-wide -mt-1">
          {merged.title || 'SETTINGS'}
        </h3>
      </div>

      {/* Body */}
      <div
        className="flex-1 min-h-0 overflow-auto px-4 pt-3 pb-28"
        style={{ scrollPaddingBottom: '120px' }}
      >
        {loading && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="h-4 w-2/3 bg-muted/40 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-muted/30 rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-muted/30 rounded animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive mb-2">
            Couldn’t load page summary. Showing fallback if available.
          </p>
        )}

        {!loading && merged.description && (
          <p className="text-sm text-foreground/80 mb-3">{merged.description}</p>
        )}

        {!loading && (
          <ul className="list-disc pl-5 space-y-2 text-sm">
            {(merged.bullets ?? []).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}

        <div aria-hidden className="h-2" />
      </div>
    </div>
  );
}
