/** Small formatting helpers shared by the admin pages. */

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSystemSize(kw: number | null): string {
  if (kw === null) return "Not specified";
  return `${kw} kW`;
}

export function formatBudget(budget: string | null): string {
  if (budget === null) return "Not specified";
  return budget.charAt(0).toUpperCase() + budget.slice(1);
}

export function formatLocation(city: string | null, state: string): string {
  return city ? `${city}, ${state}` : state;
}
