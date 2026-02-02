// Ingress (Data Ingestion) types

export type IngressState = 'running' | 'paused' | 'resyncing';

export type IngressStatus = 'stopped' | 'starting' | 'running' | 'syncing' | 'paused' | 'failed';

// PostgreSQL Ingress configuration

export interface PostgresIngressConfig {
  /** PostgreSQL connection string (required) */
  dsn: string;
  /** Table name to sync (required) */
  table: string;
  /** PostgreSQL schema (default: "public") */
  schema?: string;
  /** Primary key column (default: "id") */
  primary_key?: string;
  /** Columns to sync, empty means all columns (default: all) */
  columns?: string[];
  /** Rename columns via mapping */
  column_mapping?: Record<string, string>;
  /** Timestamp column for change detection (default: "updated_at") */
  updated_at_column?: string;
  /** Filter rows with SQL WHERE condition */
  where_clause?: string;
  /** Sync mode: "polling" or "listen" (default: "polling") */
  sync_mode?: 'polling' | 'listen';
  /** Poll interval, e.g. "10s", "1m" (default: "30s") */
  poll_interval?: string;
  /** Documents per batch (default: 1000) */
  batch_size?: number;
  /** Auto-create PostgreSQL triggers for LISTEN mode (default: true) */
  auto_triggers?: boolean;
}

// Ingress statistics from the server
export interface IngressStatistics {
  last_sync_at?: string;
  documents_synced: number;
  documents_deleted: number;
  full_sync_complete: boolean;
  last_error?: string;
  error_count: number;
}

// Base ingress fields shared by all ingress types
interface IngressBase {
  id: string;
  index_id: string;
  status: IngressStatus;
  statistics: IngressStatistics;
}

// Typed ingress configs (discriminated union)

export interface PostgresIngressResponse extends IngressBase {
  type: 'postgres';
  config: PostgresIngressConfig;
}

/** Fallback for unknown ingress types */
export interface GenericIngressResponse extends IngressBase {
  type: string;
  config: Record<string, unknown>;
}

/** Discriminated union of all ingress response types */
export type IngressConfig = PostgresIngressResponse | GenericIngressResponse;

// Create params

export interface CreateIngressParams {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface CreatePostgresIngressParams {
  id: string;
  type: 'postgres';
  config: PostgresIngressConfig;
}

/** Union of all typed ingress creation params. Use CreateIngressParams for generic/unknown types. */
export type TypedCreateIngressParams = CreatePostgresIngressParams;
