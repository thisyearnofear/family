export class GiftError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "GiftError";
  }
}

export const GiftErrors = {
  NOT_FOUND: new GiftError("Gift not found", "GIFT_NOT_FOUND", 404),
  UNAUTHORIZED: new GiftError(
    "You don't have permission to access this gift",
    "UNAUTHORIZED",
    401
  ),
  INVALID_GIFT_ID: new GiftError("Invalid gift ID", "INVALID_GIFT_ID", 400),
  METADATA_NOT_FOUND: new GiftError(
    "Gift metadata not found",
    "METADATA_NOT_FOUND",
    404
  ),
  PINATA_ERROR: new GiftError(
    "Failed to communicate with storage service",
    "PINATA_ERROR",
    503
  ),
} as const;

export function isGiftError(error: unknown): error is GiftError {
  return error instanceof GiftError;
}

export function handleGiftError(error: unknown): {
  message: string;
  statusCode: number;
} {
  if (isGiftError(error)) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  console.error("Unhandled error:", error);
  return {
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}
