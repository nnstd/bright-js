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
  fetch?: typeof fetch;
}

export class BrightClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: BrightClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
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
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
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

  async addDocuments(
    indexId: string,
    documents: Record<string, any>[],
    format: 'jsoneachrow' = 'jsoneachrow'
  ): Promise<{ indexed: number }> {
    const body = documents.map(doc => JSON.stringify(doc)).join('\n');
    const params = new URLSearchParams({ format });
    
    return this.request<{ indexed: number }>(`/indexes/${indexId}/documents?${params}`, {
      method: 'POST',
      body,
    });
  }

  async updateDocument(
    indexId: string,
    documentId: string,
    updates: Record<string, any>
  ): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(`/indexes/${indexId}/documents/${documentId}`, {
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
}

// Convenience function
export function createClient(options: BrightClientOptions): BrightClient {
  return new BrightClient(options);
}
