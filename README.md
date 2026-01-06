# Bright JS Client

TypeScript/JavaScript client library for [Bright](https://github.com/nnstd/bright) search database.

## Installation

```bash
npm install @nnstd/bright-js
# or
yarn add @nnstd/bright-js
# or
pnpm add @nnstd/bright-js
```

## Usage

### Create a Client

```typescript
import { createClient } from '@nnstd/bright-js';

const client = createClient({
  baseUrl: 'http://localhost:3000'
});
```

### Index Management

```typescript
// Create an index
await client.createIndex('products', 'id');

// Update index configuration
await client.updateIndex('products', { primaryKey: 'sku' });

// Delete an index
await client.deleteIndex('products');
```

### Document Operations

```typescript
// Add documents
await client.addDocuments('products', [
  { id: '1', name: 'Widget', price: 19.99 },
  { id: '2', name: 'Gadget', price: 29.99 }
]);

// Update a document
await client.updateDocument('products', '1', { price: 24.99 });

// Delete a document
await client.deleteDocument('products', '1');

// Delete multiple documents
await client.deleteDocuments('products', { ids: ['1', '2'] });

// Delete by filter
await client.deleteDocuments('products', { filter: 'category:electronics' });
```

### Search

```typescript
// Simple search
const results = await client.search('products', {
  q: 'laptop'
});

// Advanced search with options
const results = await client.search('products', {
  q: 'laptop',
  limit: 20,
  page: 1,
  sort: ['-price', 'name'],
  attributesToRetrieve: ['id', 'name', 'price']
});

// Search with TypeScript types
interface Product {
  id: string;
  name: string;
  price: number;
}

const results = await client.search<Product>('products', {
  q: 'laptop'
});

console.log(results.hits); // Product[]
console.log(results.totalHits); // number
console.log(results.totalPages); // number
```

## API Reference

### `createClient(options)`

Creates a new Bright client instance.

**Options:**
- `baseUrl` (string, required) - Base URL of the Bright server
- `fetch` (function, optional) - Custom fetch implementation

### Index Management

#### `createIndex(id, primaryKey?)`

Creates a new search index.

#### `updateIndex(id, config)`

Updates index configuration.

#### `deleteIndex(id)`

Deletes an index and all its documents.

### Document Operations

#### `addDocuments(indexId, documents, format?)`

Adds documents to an index. Documents with existing IDs will be updated.

#### `updateDocument(indexId, documentId, updates)`

Updates specific fields of a document.

#### `deleteDocument(indexId, documentId)`

Deletes a single document.

#### `deleteDocuments(indexId, options)`

Deletes multiple documents by IDs or filter query.

**Options:**
- `ids` (string[]) - Array of document IDs
- `filter` (string) - Query filter

### Search

#### `search<T>(indexId, params?)`

Searches for documents in an index.

**Params:**
- `q` (string) - Search query
- `offset` (number) - Number of results to skip
- `limit` (number) - Maximum results per page (default: 20)
- `page` (number) - Page number
- `sort` (string[]) - Sort fields (prefix with `-` for descending)
- `attributesToRetrieve` (string[]) - Fields to include
- `attributesToExclude` (string[]) - Fields to exclude

## TypeScript

This library is written in TypeScript and includes type definitions.

```typescript
import { BrightClient, SearchParams, SearchResponse } from '@nnstd/bright-js';
```

## License

MIT
