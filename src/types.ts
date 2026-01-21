export interface IndexConfig {
  id: string;
  primaryKey?: string;
}

// Field query helpers for type-safe query building

/** Field filter with optional boost: `field:value` or `field:value^boost` */
export type FieldFilter<T> = {
  [K in keyof T]?: T[K] extends string | number | boolean | Date
    ? T[K] | { value: T[K]; boost?: number }
    : never;
};

/** Numeric range filter for a field */
export interface RangeFilter<T> {
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
}

/** Field range filters: `field:>value`, `field:>=value`, etc. */
export type FieldRangeFilter<T> = {
  [K in keyof T]?: T[K] extends number | Date ? RangeFilter<T[K]> : never;
};

/** Sort direction for a field */
export type SortDirection = 'asc' | 'desc';

/** Typed sort options */
export type SortField<T> = keyof T | `-${string & keyof T}` | { field: keyof T; order: SortDirection };

// Search params with full type support

export interface SearchParams<
  T = Record<string, unknown>,
  Exclude extends keyof T = never
> {
  /** Query string (supports Bleve syntax: field:value, +required, -excluded, ^boost) */
  q?: string;

  /** Typed field filters (alternative to query string) */
  filter?: FieldFilter<T>;

  /** Typed range filters for numeric/date fields */
  range?: FieldRangeFilter<T>;

  /** Pagination offset */
  offset?: number;

  /** Results per page limit */
  limit?: number;

  /** Page number (1-indexed) */
  page?: number;

  /** Sort fields (prefix with - for descending) */
  sort?: Array<SortField<T>>;

  /** Fields to retrieve (defaults to all) */
  attributesToRetrieve?: Array<keyof T>;

  /** Fields to exclude from results */
  attributesToExclude?: Exclude[];
}

/** Search response with excluded fields removed from type */
export interface SearchResponse<
  T = Record<string, unknown>,
  Exclude extends keyof T = never
> {
  hits: Array<Omit<T, Exclude>>;
  totalHits: number;
  totalPages: number;
}

// Query builder helpers

/**
 * Build a field query with optional boost
 * @example field('name', 'water', 5) => 'name:water^5'
 */
export function field<T, K extends keyof T>(
  name: K,
  value: T[K],
  boost?: number
): string {
  const base = `${String(name)}:${String(value)}`;
  return boost ? `${base}^${boost}` : base;
}

/**
 * Build a required (MUST) clause
 * @example must('name:water') => '+name:water'
 */
export function must(query: string): string {
  return `+${query}`;
}

/**
 * Build an excluded (MUST NOT) clause
 * @example mustNot('name:water') => '-name:water'
 */
export function mustNot(query: string): string {
  return `-${query}`;
}

/**
 * Build a phrase query
 * @example phrase('light beer') => '"light beer"'
 */
export function phrase(text: string): string {
  return `"${text}"`;
}

/**
 * Build a range query
 * @example range('price', { gte: 10, lt: 100 }) => 'price:>=10 price:<100'
 */
export function range<T, K extends keyof T>(
  name: K,
  filter: RangeFilter<T[K]>
): string {
  const parts: string[] = [];
  const n = String(name);
  if (filter.gt !== undefined) parts.push(`${n}:>${filter.gt}`);
  if (filter.gte !== undefined) parts.push(`${n}:>=${filter.gte}`);
  if (filter.lt !== undefined) parts.push(`${n}:<${filter.lt}`);
  if (filter.lte !== undefined) parts.push(`${n}:<=${filter.lte}`);
  return parts.join(' ');
}

export interface BrightClientOptions {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
}
