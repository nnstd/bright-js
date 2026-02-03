import { BrightErrorResponse, createBrightError, NotFoundError } from './errors';
import {
  IndexConfig,
  SearchParams,
  SearchResponse,
  BrightClientOptions,
  FieldFilter,
  FieldRangeFilter,
  SortField,
} from './types';
import {
  IngressConfig,
  IngressState,
  CreateIngressParams,
  TypedCreateIngressParams,
} from './ingress';

// Re-export all types
export * from './errors';
export * from './types';
export * from './ingress';

export interface IndexHandle<T = Record<string, unknown>> {
  readonly id: string;

  // Index operations
  update(config: Partial<IndexConfig>): Promise<IndexConfig>;
  delete(): Promise<void>;

  // Document operations
  addDocuments(documents: T[], options?: { format?: 'jsoneachrow'; primaryKey?: string }): Promise<{ indexed: number }>;
  updateDocument(documentId: string, updates: Partial<T>): Promise<T>;
  deleteDocument(documentId: string): Promise<void>;
  deleteDocuments(options: { ids?: string[]; filter?: string }): Promise<void>;

  // Search with typed exclusion
  search<Exclude extends keyof T = never>(
    params?: SearchParams<T, Exclude>
  ): Promise<SearchResponse<T, Exclude>>;

  // Ingress (Data Ingestion)
  listIngresses(): Promise<IngressConfig[]>;
  createIngress(params: CreateIngressParams | TypedCreateIngressParams): Promise<IngressConfig>;
  getIngress(ingressId: string): Promise<IngressConfig>;
  ingressExists(ingressId: string): Promise<boolean>;
  updateIngress(ingressId: string, state: IngressState): Promise<IngressConfig>;
  deleteIngress(ingressId: string): Promise<void>;
}

// Helper to build query string from typed filters
function buildQueryFromFilters<T>(
  filter?: FieldFilter<T>,
  range?: FieldRangeFilter<T>
): string {
  const parts: string[] = [];

  if (filter) {
    for (const [key, val] of Object.entries(filter)) {
      if (val === undefined) continue;
      if (typeof val === 'object' && val !== null && 'value' in val) {
        const { value, boost } = val as { value: unknown; boost?: number };
        parts.push(boost ? `${key}:${value}^${boost}` : `${key}:${value}`);
      } else {
        parts.push(`${key}:${val}`);
      }
    }
  }

  if (range) {
    for (const [key, rangeVal] of Object.entries(range)) {
      if (rangeVal === undefined) continue;
      const r = rangeVal as { gt?: unknown; gte?: unknown; lt?: unknown; lte?: unknown };
      if (r.gt !== undefined) parts.push(`${key}:>${r.gt}`);
      if (r.gte !== undefined) parts.push(`${key}:>=${r.gte}`);
      if (r.lt !== undefined) parts.push(`${key}:<${r.lt}`);
      if (r.lte !== undefined) parts.push(`${key}:<=${r.lte}`);
    }
  }

  return parts.join(' ');
}

// Helper to normalize sort fields to string
function normalizeSortField<T>(sort: SortField<T>): string {
  if (typeof sort === 'object' && sort !== null && 'field' in sort) {
    return sort.order === 'desc' ? `-${String(sort.field)}` : String(sort.field);
  }
  return String(sort);
}

export class BrightClient {
  private baseUrl: string;
  private apiKey?: string;
  private fetchFn: typeof fetch;

  constructor(options: BrightClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.fetchFn = options.fetch || globalThis.fetch;
  }

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.fetchFn(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorResponse: BrightErrorResponse = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      throw createBrightError(response.status, errorResponse);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Index Management

  async createIndex(id: string, primaryKey?: string): Promise<IndexConfig> {
    const params = new URLSearchParams({ id });
    if (primaryKey) params.append('primaryKey', primaryKey);

    return this.request<IndexConfig>(`/indexes?${params}`, {
      method: 'POST',
    });
  }

  async updateIndex(id: string, config: Partial<IndexConfig>): Promise<IndexConfig> {
    return this.request<IndexConfig>(`/indexes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  async deleteIndex(id: string): Promise<void> {
    return this.request<void>(`/indexes/${id}`, {
      method: 'DELETE',
    });
  }

  async indexExists(id: string): Promise<boolean> {
    try {
      await this.request<IndexConfig>(`/indexes/${id}`, {
        method: 'GET',
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  // Document Operations

  async addDocuments<T = Record<string, unknown>>(
    indexId: string,
    documents: T[],
    options?: { format?: 'jsoneachrow'; primaryKey?: string }
  ): Promise<{ indexed: number }> {
    const body = documents.map(doc => JSON.stringify(doc)).join('\n');
    const params = new URLSearchParams();

    params.append('format', options?.format || 'jsoneachrow');
    if (options?.primaryKey) {
      params.append('primaryKey', options.primaryKey);
    }

    return this.request<{ indexed: number }>(`/indexes/${indexId}/documents?${params}`, {
      method: 'POST',
      body,
    });
  }

  async updateDocument<T = Record<string, unknown>>(
    indexId: string,
    documentId: string,
    updates: Partial<T>
  ): Promise<T> {
    return this.request<T>(`/indexes/${indexId}/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDocument(indexId: string, documentId: string): Promise<void> {
    return this.request<void>(`/indexes/${indexId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async deleteDocuments(
    indexId: string,
    options: { ids?: string[]; filter?: string }
  ): Promise<void> {
    const params = new URLSearchParams();

    if (options.ids) {
      options.ids.forEach(id => params.append('ids[]', id));
    }

    if (options.filter) {
      params.append('filter', options.filter);
    }

    return this.request<void>(`/indexes/${indexId}/documents?${params}`, {
      method: 'DELETE',
    });
  }

  // Search

  async search<T = Record<string, unknown>, Exclude extends keyof T = never>(
    indexId: string,
    params?: SearchParams<T, Exclude>
  ): Promise<SearchResponse<T, Exclude>> {
    const searchParams = new URLSearchParams();

    // Build query from q + typed filters
    const filterQuery = buildQueryFromFilters(params?.filter, params?.range);
    const fullQuery = [params?.q, filterQuery].filter(Boolean).join(' ');
    if (fullQuery) searchParams.append('q', fullQuery);

    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());

    if (params?.sort) {
      params.sort.forEach(s => searchParams.append('sort[]', normalizeSortField(s)));
    }

    if (params?.attributesToRetrieve) {
      params.attributesToRetrieve.forEach(attr =>
        searchParams.append('attributesToRetrieve[]', String(attr))
      );
    }

    if (params?.attributesToExclude) {
      params.attributesToExclude.forEach(attr =>
        searchParams.append('attributesToExclude[]', String(attr))
      );
    }

    return this.request<SearchResponse<T, Exclude>>(`/indexes/${indexId}/searches?${searchParams}`, {
      method: 'POST',
    });
  }

  // Ingress (Data Ingestion)

  async listIngresses(indexId: string): Promise<IngressConfig[]> {
    const response = await this.request<{ ingresses: IngressConfig[] }>(`/indexes/${indexId}/ingresses`);
    return response.ingresses;
  }

  async createIngress(
    indexId: string,
    params: CreateIngressParams | TypedCreateIngressParams
  ): Promise<IngressConfig> {
    return this.request<IngressConfig>(`/indexes/${indexId}/ingresses`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getIngress(indexId: string, ingressId: string): Promise<IngressConfig> {
    return this.request<IngressConfig>(`/indexes/${indexId}/ingresses/${ingressId}`);
  }

  async ingressExists(indexId: string, ingressId: string): Promise<boolean> {
    try {
      await this.request<IngressConfig>(`/indexes/${indexId}/ingresses/${ingressId}`, {
        method: 'GET',
      });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  async updateIngress(
    indexId: string,
    ingressId: string,
    state: IngressState
  ): Promise<IngressConfig> {
    return this.request<IngressConfig>(`/indexes/${indexId}/ingresses/${ingressId}`, {
      method: 'PATCH',
      body: JSON.stringify({ state }),
    });
  }

  async deleteIngress(indexId: string, ingressId: string): Promise<void> {
    return this.request<void>(`/indexes/${indexId}/ingresses/${ingressId}`, {
      method: 'DELETE',
    });
  }

  // Typed Index Handle

  index<T = Record<string, unknown>>(indexId: string): IndexHandle<T> {
    return {
      id: indexId,

      update: (config) => this.updateIndex(indexId, config),
      delete: () => this.deleteIndex(indexId),

      addDocuments: (documents, options) => this.addDocuments<T>(indexId, documents, options),
      updateDocument: (documentId, updates) => this.updateDocument<T>(indexId, documentId, updates),
      deleteDocument: (documentId) => this.deleteDocument(indexId, documentId),
      deleteDocuments: (options) => this.deleteDocuments(indexId, options),

      search: <Exclude extends keyof T = never>(params?: SearchParams<T, Exclude>) =>
        this.search<T, Exclude>(indexId, params),

      listIngresses: () => this.listIngresses(indexId),
      createIngress: (params) => this.createIngress(indexId, params),
      getIngress: (ingressId) => this.getIngress(indexId, ingressId),
      ingressExists: (ingressId) => this.ingressExists(indexId, ingressId),
      updateIngress: (ingressId, state) => this.updateIngress(indexId, ingressId, state),
      deleteIngress: (ingressId) => this.deleteIngress(indexId, ingressId),
    };
  }
}

// Convenience function
export function createClient(options: BrightClientOptions): BrightClient {
  return new BrightClient(options);
}
