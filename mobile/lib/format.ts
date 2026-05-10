export function formatCurrency(value: unknown): string {
  const n = Number(value ?? 0);
  if (isNaN(n)) return '₹0';
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatNumber(value: unknown): string {
  const n = Number(value ?? 0);
  return isNaN(n) ? '0' : n.toLocaleString('en-IN');
}

export function formatDate(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-IN');
}

export function formatDateTime(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-IN');
}

export function shortCurrency(value: unknown): string {
  const n = Number(value ?? 0);
  if (isNaN(n)) return '₹0';
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}
