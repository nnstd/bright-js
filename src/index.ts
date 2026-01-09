import { BrightErrorResponse, createBrightError } from './errors';

// Re-export all error classes
export * from './errors';

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

export interface IndexHandle<T = Record<string, any>> {
  readonly id: string;

  // Index operations
  update(config: Partial<IndexConfig>): Promise<IndexConfig>;
  delete(): Promise<void>;

  // Document operations
  addDocuments(documents: T[], format?: 'jsoneachrow'): Promise<{ indexed: number }>;
  updateDocument(documentId: string, updates: Partial<T>): Promise<T>;
  deleteDocument(documentId: string): Promise<void>;
  deleteDocuments(options: { ids?: string[]; filter?: string }): Promise<void>;

  // Search
  search(params?: SearchParams): Promise<SearchResponse<T>>;
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

  // Document Operations

  async addDocuments<T = Record<string, any>>(
    indexId: string,
    documents: T[],
    format: 'jsoneachrow' = 'jsoneachrow'
  ): Promise<{ indexed: number }> {
    const body = documents.map(doc => JSON.stringify(doc)).join('\n');
    const params = new URLSearchParams({ format });

    return this.request<{ indexed: number }>(`/indexes/${indexId}/documents?${params}`, {
      method: 'POST',
      body,
    });
  }

  async updateDocument<T = Record<string, any>>(
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

  async search<T = Record<string, any>>(
    indexId: string,
    params?: SearchParams
  ): Promise<SearchResponse<T>> {
    const searchParams = new URLSearchParams();

    if (params?.q) searchParams.append('q', params.q);
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());

    if (params?.sort) {
      params.sort.forEach(s => searchParams.append('sort[]', s));
    }

    if (params?.attributesToRetrieve) {
      params.attributesToRetrieve.forEach(attr =>
        searchParams.append('attributesToRetrieve[]', attr)
      );
    }

    if (params?.attributesToExclude) {
      params.attributesToExclude.forEach(attr =>
        searchParams.append('attributesToExclude[]', attr)
      );
    }

    return this.request<SearchResponse<T>>(`/indexes/${indexId}/searches?${searchParams}`, {
      method: 'POST',
    });
  }

  // Typed Index Handle

  index<T = Record<string, any>>(indexId: string): IndexHandle<T> {
    return {
      id: indexId,

      update: (config) => this.updateIndex(indexId, config),
      delete: () => this.deleteIndex(indexId),

      addDocuments: (documents, format) => this.addDocuments<T>(indexId, documents, format),
      updateDocument: (documentId, updates) => this.updateDocument<T>(indexId, documentId, updates),
      deleteDocument: (documentId) => this.deleteDocument(indexId, documentId),
      deleteDocuments: (options) => this.deleteDocuments(indexId, options),

      search: (params) => this.search<T>(indexId, params),
    };
  }
}

// Convenience function
export function createClient(options: BrightClientOptions): BrightClient {
  return new BrightClient(options);
}
