export function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}
