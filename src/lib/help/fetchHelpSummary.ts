// ✅ Named export
export async function fetchHelpSummary(path: string): Promise<HelpSummary> {
  const res = await fetch(`/api/help-summary?path=${encodeURIComponent(path)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('failed');
  return res.json();
}
