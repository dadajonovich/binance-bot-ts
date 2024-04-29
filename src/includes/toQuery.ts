export type QueryObject = Record<string, string | number | undefined | null>;

export function toQuery(args: QueryObject): string {
  if (!args) return '';

  const strs: string[] = Object.entries(args)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);

  if (strs.length === 0) return '';

  return `?${strs.join('&')}`;
}
