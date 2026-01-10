<div align="center">
  <img src="assets/logo.svg" alt="Bright Logo" width="200"/>
</div>

<div align="center">
  TypeScript/JavaScript client library for <a href="https://github.com/nnstd/bright">Bright</a> full-text search database.
</div>

## Installation

```bash
npm install bright-client
# or
yarn add bright-client
# or
pnpm add bright-client
# or
bun add bright-client
```

## Usage

### Create a Client

```typescript
import { createClient } from 'bright-client';

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

## License

MIT
