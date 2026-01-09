# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript/JavaScript client library for [Bright](https://github.com/nnstd/bright), a full-text search database. This is a minimal, zero-dependency client that provides a typed interface to the Bright HTTP API.

## Build Commands

Use **bun** as the package manager (not npm):

```bash
# Build the library (generates dist/)
bun run build

# Build is required before publishing
bun run prepublishOnly
```

The build uses `tsdown` to generate:
- `dist/index.cjs` - CommonJS bundle
- `dist/index.mjs` - ESM bundle
- `dist/index.d.ts`, `dist/index.d.cts`, `dist/index.d.mts` - TypeScript declarations
- Source maps for all outputs

## Architecture

### Core Structure

The library consists of two main files in `src/`:

1. **`src/index.ts`** - Main client implementation
   - `BrightClient` class with all API methods
   - `createClient()` convenience function
   - Index handle pattern for typed operations
   - Re-exports all error classes from `errors.ts`

2. **`src/errors.ts`** - Typed error system
   - Error codes and hierarchy based on [bright/handlers/errors.go](https://github.com/nnstd/bright/blob/main/handlers/errors.go)
   - `createBrightError()` factory function for automatic error instantiation
   - All errors extend `BrightError` with `code`, `statusCode`, `details` properties

### Error Handling Pattern

The client automatically converts HTTP error responses into typed error classes:

```typescript
// In request() method:
const errorResponse: BrightErrorResponse = await response.json()
throw createBrightError(response.status, errorResponse)
```

The factory function `createBrightError()` matches error codes to create specific error instances (e.g., `INDEX_NOT_FOUND` → `IndexNotFoundError`), with fallback to status code-based errors.

### API Design

- All methods on `BrightClient` accept explicit parameters (indexId, documentId, etc.)
- The `.index<T>(indexId)` method returns an `IndexHandle<T>` for a more convenient typed API
- Generic type parameter `T` flows through the entire call chain for full type safety
- All API responses are parsed as JSON except for 204 No Content

## Important Constraints

- **Zero runtime dependencies** - uses only native `fetch` API
- **Dual-format output** - must support both CJS and ESM
- **Error codes must match Go implementation** - see `https://github.com/nnstd/bright/blob/main/handlers/errors.go`

## Publishing

The package is published to npm as `bright-client`. The `prepublishOnly` script ensures the dist is built before each publish.
