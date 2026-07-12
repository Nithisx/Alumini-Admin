/**
 * Error codes — the frontend half of the standard API error contract.
 *
 * MUST stay in sync with backend `core/errors.py::ErrorCode`. Every API failure
 * comes back as:
 *   { success:false, error, message, code, details?, request_id }
 *
 * Branch on `code`, NEVER on the message text — the copy is written for humans
 * and is deliberately vague on auth failures (so it can't be used to enumerate
 * accounts), and it can be reworded at any time without warning.
 */
export const ErrorCode = {
  // 400
  VALIDATION_ERROR: "VALIDATION_ERROR",   // details = { field: [messages] }
  BAD_REQUEST: "BAD_REQUEST",
  PARSE_ERROR: "PARSE_ERROR",

  // 401
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",         // → try a silent refresh, then retry
  TOKEN_INVALID: "TOKEN_INVALID",         // → unrecoverable: log the user out
  ACCOUNT_PENDING: "ACCOUNT_PENDING",

  // 403
  PERMISSION_DENIED: "PERMISSION_DENIED", // → RBAC says no; refresh permissions
  ACCOUNT_DEACTIVATED: "ACCOUNT_DEACTIVATED",
  CSRF_FAILED: "CSRF_FAILED",

  // 404 / 405 / 409 / 413 / 415
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",

  // 429
  RATE_LIMITED: "RATE_LIMITED",           // details.retry_after (seconds)

  // 5xx
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
};

/** The access token aged out — a silent refresh may recover the session. */
export const isRefreshable = (code) => code === ErrorCode.TOKEN_EXPIRED;

/** Session is unrecoverable — stop retrying and log out. */
export const isFatalAuth = (code) =>
  code === ErrorCode.TOKEN_INVALID || code === ErrorCode.NOT_AUTHENTICATED;

/** Retrying later could plausibly succeed (transient infrastructure). */
export const isTransient = (code) =>
  code === ErrorCode.SERVICE_UNAVAILABLE ||
  code === ErrorCode.UPSTREAM_ERROR ||
  code === ErrorCode.INTERNAL_ERROR ||
  code === ErrorCode.RATE_LIMITED;

/**
 * Fallback copy per code, for when a screen has nothing better to show.
 * Prefer the server's `message` when present — this is the safety net for
 * network failures (where there IS no response) and unknown codes.
 */
const FALLBACK_MESSAGES = {
  [ErrorCode.VALIDATION_ERROR]: "Please check the highlighted fields and try again.",
  [ErrorCode.NOT_AUTHENTICATED]: "Please sign in to continue.",
  [ErrorCode.TOKEN_EXPIRED]: "Your session expired. Signing you back in…",
  [ErrorCode.TOKEN_INVALID]: "Your session is no longer valid. Please sign in again.",
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid credentials. Please check your details and try again.",
  [ErrorCode.PERMISSION_DENIED]: "You don't have permission to do that.",
  [ErrorCode.ACCOUNT_DEACTIVATED]: "This account has been deactivated. Please contact an administrator.",
  [ErrorCode.ACCOUNT_PENDING]: "Your account is awaiting admin approval.",
  [ErrorCode.NOT_FOUND]: "We couldn't find what you were looking for.",
  [ErrorCode.CONFLICT]: "That conflicts with something that already exists.",
  [ErrorCode.PAYLOAD_TOO_LARGE]: "That file is too large to upload.",
  [ErrorCode.RATE_LIMITED]: "Too many attempts. Please wait a moment and try again.",
  [ErrorCode.SERVICE_UNAVAILABLE]: "The service is temporarily unavailable. Please try again shortly.",
  [ErrorCode.INTERNAL_ERROR]: "Something went wrong on our end. Please try again.",
};

/** Best user-facing message for an ApiError (or a raw network failure). */
export function messageFor(err) {
  if (!err) return FALLBACK_MESSAGES[ErrorCode.INTERNAL_ERROR];
  // No response at all → the request never reached us (offline / DNS / CORS).
  if (err.status == null) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return err.message || FALLBACK_MESSAGES[err.code] || FALLBACK_MESSAGES[ErrorCode.INTERNAL_ERROR];
}

/** Field-level errors from a VALIDATION_ERROR, as { field: "first message" }. */
export function fieldErrors(err) {
  if (err?.code !== ErrorCode.VALIDATION_ERROR || !err.details) return {};
  return Object.fromEntries(
    Object.entries(err.details).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : String(messages),
    ])
  );
}
