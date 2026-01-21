export type ErrorCode =
  // Validation Errors (400)
  | 'MISSING_PARAMETER'
  | 'INVALID_PARAMETER'
  | 'INVALID_REQUEST_BODY'
  | 'CONFLICTING_PARAMETERS'
  | 'INVALID_FORMAT'
  | 'PARSE_ERROR'
  // Not Found Errors (404)
  | 'INDEX_NOT_FOUND'
  | 'DOCUMENT_NOT_FOUND'
  // Cluster Errors (307/503)
  | 'NOT_LEADER'
  | 'CLUSTER_UNAVAILABLE'
  // Authorization Errors (403)
  | 'INSUFFICIENT_PERMISSIONS'
  | 'LEADER_ONLY_OPERATION'
  // Resource Conflict Errors (409)
  | 'RESOURCE_ALREADY_EXISTS'
  // Internal Errors (500)
  | 'UUID_GENERATION_FAILED'
  | 'SERIALIZATION_FAILED'
  | 'RAFT_APPLY_FAILED'
  | 'INDEX_OPERATION_FAILED'
  | 'DOCUMENT_OPERATION_FAILED'
  | 'BATCH_OPERATION_FAILED'
  | 'SEARCH_FAILED'
  | 'INTERNAL_ERROR';

export interface BrightErrorResponse {
  error: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

export class BrightError extends Error {
  public readonly code?: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BrightError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, BrightError.prototype);
  }

  toJSON(): BrightErrorResponse & { statusCode: number } {
    return {
      error: this.message,
      code: this.code,
      details: this.details,
      statusCode: this.statusCode,
    };
  }
}

// Validation Errors (400)
export class ValidationError extends BrightError {
  constructor(message: string, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, 400, code, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class MissingParameterError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MISSING_PARAMETER', details);
    this.name = 'MissingParameterError';
    Object.setPrototypeOf(this, MissingParameterError.prototype);
  }
}

export class InvalidParameterError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_PARAMETER', details);
    this.name = 'InvalidParameterError';
    Object.setPrototypeOf(this, InvalidParameterError.prototype);
  }
}

export class InvalidRequestBodyError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_REQUEST_BODY', details);
    this.name = 'InvalidRequestBodyError';
    Object.setPrototypeOf(this, InvalidRequestBodyError.prototype);
  }
}

export class ConflictingParametersError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICTING_PARAMETERS', details);
    this.name = 'ConflictingParametersError';
    Object.setPrototypeOf(this, ConflictingParametersError.prototype);
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INVALID_FORMAT', details);
    this.name = 'InvalidFormatError';
    Object.setPrototypeOf(this, InvalidFormatError.prototype);
  }
}

export class ParseError extends ValidationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'ParseError';
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

// Not Found Errors (404)
export class NotFoundError extends BrightError {
  constructor(message: string, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, 404, code, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class IndexNotFoundError extends NotFoundError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INDEX_NOT_FOUND', details);
    this.name = 'IndexNotFoundError';
    Object.setPrototypeOf(this, IndexNotFoundError.prototype);
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DOCUMENT_NOT_FOUND', details);
    this.name = 'DocumentNotFoundError';
    Object.setPrototypeOf(this, DocumentNotFoundError.prototype);
  }
}

// Cluster Errors
export class ClusterError extends BrightError {
  constructor(message: string, statusCode: number, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, statusCode, code, details);
    this.name = 'ClusterError';
    Object.setPrototypeOf(this, ClusterError.prototype);
  }
}

export class NotLeaderError extends ClusterError {
  public readonly leaderUrl?: string;

  constructor(message: string, leaderUrl?: string, details?: Record<string, unknown>) {
    super(message, 307, 'NOT_LEADER', details);
    this.name = 'NotLeaderError';
    this.leaderUrl = leaderUrl;
    Object.setPrototypeOf(this, NotLeaderError.prototype);
  }
}

export class ClusterUnavailableError extends ClusterError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 503, 'CLUSTER_UNAVAILABLE', details);
    this.name = 'ClusterUnavailableError';
    Object.setPrototypeOf(this, ClusterUnavailableError.prototype);
  }
}

// Authorization Errors (403)
export class AuthorizationError extends BrightError {
  constructor(message: string, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, 403, code, details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INSUFFICIENT_PERMISSIONS', details);
    this.name = 'InsufficientPermissionsError';
    Object.setPrototypeOf(this, InsufficientPermissionsError.prototype);
  }
}

export class LeaderOnlyOperationError extends AuthorizationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'LEADER_ONLY_OPERATION', details);
    this.name = 'LeaderOnlyOperationError';
    Object.setPrototypeOf(this, LeaderOnlyOperationError.prototype);
  }
}

// Resource Conflict Errors (409)
export class ConflictError extends BrightError {
  constructor(message: string, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, 409, code, details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class ResourceAlreadyExistsError extends ConflictError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESOURCE_ALREADY_EXISTS', details);
    this.name = 'ResourceAlreadyExistsError';
    Object.setPrototypeOf(this, ResourceAlreadyExistsError.prototype);
  }
}

// Internal Errors (500)
export class InternalError extends BrightError {
  constructor(message: string, code?: ErrorCode, details?: Record<string, unknown>) {
    super(message, 500, code, details);
    this.name = 'InternalError';
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

export class UuidGenerationFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'UUID_GENERATION_FAILED', details);
    this.name = 'UuidGenerationFailedError';
    Object.setPrototypeOf(this, UuidGenerationFailedError.prototype);
  }
}

export class SerializationFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SERIALIZATION_FAILED', details);
    this.name = 'SerializationFailedError';
    Object.setPrototypeOf(this, SerializationFailedError.prototype);
  }
}

export class RaftApplyFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RAFT_APPLY_FAILED', details);
    this.name = 'RaftApplyFailedError';
    Object.setPrototypeOf(this, RaftApplyFailedError.prototype);
  }
}

export class IndexOperationFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'INDEX_OPERATION_FAILED', details);
    this.name = 'IndexOperationFailedError';
    Object.setPrototypeOf(this, IndexOperationFailedError.prototype);
  }
}

export class DocumentOperationFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'DOCUMENT_OPERATION_FAILED', details);
    this.name = 'DocumentOperationFailedError';
    Object.setPrototypeOf(this, DocumentOperationFailedError.prototype);
  }
}

export class BatchOperationFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'BATCH_OPERATION_FAILED', details);
    this.name = 'BatchOperationFailedError';
    Object.setPrototypeOf(this, BatchOperationFailedError.prototype);
  }
}

export class SearchFailedError extends InternalError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SEARCH_FAILED', details);
    this.name = 'SearchFailedError';
    Object.setPrototypeOf(this, SearchFailedError.prototype);
  }
}

// Error factory function to create appropriate error instances
export function createBrightError(
  statusCode: number,
  errorResponse: BrightErrorResponse
): BrightError {
  const { error: message, code, details } = errorResponse;

  // Match by error code first
  if (code) {
    switch (code) {
      // Validation Errors
      case 'MISSING_PARAMETER':
        return new MissingParameterError(message, details);
      case 'INVALID_PARAMETER':
        return new InvalidParameterError(message, details);
      case 'INVALID_REQUEST_BODY':
        return new InvalidRequestBodyError(message, details);
      case 'CONFLICTING_PARAMETERS':
        return new ConflictingParametersError(message, details);
      case 'INVALID_FORMAT':
        return new InvalidFormatError(message, details);
      case 'PARSE_ERROR':
        return new ParseError(message, details);

      // Not Found Errors
      case 'INDEX_NOT_FOUND':
        return new IndexNotFoundError(message, details);
      case 'DOCUMENT_NOT_FOUND':
        return new DocumentNotFoundError(message, details);

      // Cluster Errors
      case 'NOT_LEADER': {
        const leaderUrl = typeof details?.leaderUrl === 'string' ? details.leaderUrl : undefined;
        return new NotLeaderError(message, leaderUrl, details);
      }
      case 'CLUSTER_UNAVAILABLE':
        return new ClusterUnavailableError(message, details);

      // Authorization Errors
      case 'INSUFFICIENT_PERMISSIONS':
        return new InsufficientPermissionsError(message, details);
      case 'LEADER_ONLY_OPERATION':
        return new LeaderOnlyOperationError(message, details);

      // Conflict Errors
      case 'RESOURCE_ALREADY_EXISTS':
        return new ResourceAlreadyExistsError(message, details);

      // Internal Errors
      case 'UUID_GENERATION_FAILED':
        return new UuidGenerationFailedError(message, details);
      case 'SERIALIZATION_FAILED':
        return new SerializationFailedError(message, details);
      case 'RAFT_APPLY_FAILED':
        return new RaftApplyFailedError(message, details);
      case 'INDEX_OPERATION_FAILED':
        return new IndexOperationFailedError(message, details);
      case 'DOCUMENT_OPERATION_FAILED':
        return new DocumentOperationFailedError(message, details);
      case 'BATCH_OPERATION_FAILED':
        return new BatchOperationFailedError(message, details);
      case 'SEARCH_FAILED':
        return new SearchFailedError(message, details);
      case 'INTERNAL_ERROR':
        return new InternalError(message, code, details);
    }
  }

  // Fallback to status code
  switch (statusCode) {
    case 400:
      return new ValidationError(message, code, details);
    case 404:
      return new NotFoundError(message, code, details);
    case 403:
      return new AuthorizationError(message, code, details);
    case 409:
      return new ConflictError(message, code, details);
    case 307:
    case 503:
      return new ClusterError(message, statusCode, code, details);
    case 500:
      return new InternalError(message, code, details);
    default:
      return new BrightError(message, statusCode, code, details);
  }
}
