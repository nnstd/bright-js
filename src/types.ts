export interface IndexConfig {
  id: string;
  primaryKey?: string;
}

export interface SearchParams {
  q?: string;
  offset?: number;
  limit?: number;
  page?: number;
  sort?: string[];
  attributesToRetrieve?: string[];
  attributesToExclude?: string[];
}

export interface SearchResponse<T = Record<string, any>> {
  hits: T[];
  totalHits: number;
  totalPages: number;
}

export interface BrightClientOptions {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
}
