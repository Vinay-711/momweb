/**
 * errorUtils.ts — Error Message Sanitization Utility
 * 
 * Prevents database stack traces, PostgreSQL error codes (PGRST, SQLSTATE),
 * schema/table names, and sensitive internal details from leaking to end users.
 */

const SENSITIVE_ERROR_PATTERNS = [
  /PGRST\d+/i,
  /SQLSTATE/i,
  /schema cache/i,
  /relation ".*" does not exist/i,
  /table '.*'/i,
  /column ".*" does not exist/i,
  /violates foreign key constraint/i,
  /violates not-null constraint/i,
  /violates unique constraint/i,
  /violates check constraint/i,
  /violates row-level security policy/i,
  /syntax error at or near/i,
  /permission denied for/i,
  /function public\..* does not exist/i,
  /could not find the function/i,
  /could not find the table/i,
  /searched for the function/i,
  /admin_users/i,
  /storage\.objects/i,
  /auth\.users/i,
  /supabase\.co/i,
  /service_role/i,
  /anon_key/i,
  /jwt/i,
  /postgrest/i,
  /postgres/i,
  /failed to fetch/i,
  /fetch failed/i,
  /network\s?error/i,
  /load failed/i,
];

/**
 * Sanitizes an error message before presenting it to an end user.
 * Allows safe, customer-friendly validation messages while scrubbing internal details.
 */
export function sanitizeErrorMessage(error: unknown, fallbackMessage: string = 'Something went wrong. Please try again.'): string {
  if (!error) return fallbackMessage;

  let message = '';
  if (typeof error === 'string') {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as any).message);
  } else {
    message = String(error);
  }

  message = message.trim();
  if (!message) return fallbackMessage;

  // Check if the message contains sensitive internal database or syntax leakage
  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      // Provide a clean, friendly message instead of the raw database error
      if (/network|fetch|connection/i.test(message)) {
        return 'Network connection error. Please check your internet connection and retry.';
      }
      if (/stock|inventory/i.test(message)) {
        return 'One or more items in your basket are currently out of stock. Please adjust quantities.';
      }
      return fallbackMessage;
    }
  }

  // Safe to return the message
  return message;
}
