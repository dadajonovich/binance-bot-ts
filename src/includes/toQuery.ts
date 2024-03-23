export function toQuery(args: Record<string, any>): string {
  if (!args) return '';

  const strs: string[] = Object.entries(args)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);

  if (strs.length === 0) return '';

  return `?${strs.join('&')}`;
}
