type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type RedactOptions = {
  maxStringLength?: number;
  maxDepth?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
};

const DEFAULT_OPTIONS: Required<RedactOptions> = {
  maxStringLength: 350,
  maxDepth: 4,
  maxArrayLength: 20,
  maxObjectKeys: 50,
};

const SENSITIVE_KEY_RE = /(api[-_]?key|secret|token|password|authorization|cookie|session|set-cookie)/i;
const REDACT_TEXT_KEY_RE = /(resume(text)?|job(description)?|prompt|contents|optimizedresume|document|pdf|docx|text)/i;

function truncateString(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}…[truncated ${value.length - maxLen} chars]`;
}

function redactString(input: string, maxLen: number): string {
  let value = String(input);

  // Obvious Google-style API keys.
  value = value.replace(/AIza[0-9A-Za-z\-_]{20,}/g, 'AIza[REDACTED]');

  // Common query params.
  value = value.replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]');
  value = value.replace(/([?&]token=)[^&\s]+/gi, '$1[REDACTED]');
  value = value.replace(/([?&]access_token=)[^&\s]+/gi, '$1[REDACTED]');
  value = value.replace(/([?&]refresh_token=)[^&\s]+/gi, '$1[REDACTED]');

  // Env-style assignments.
  value = value.replace(/(GOOGLE_AI_STUDIO_API_KEY\s*=\s*)([^\s]+)/gi, '$1[REDACTED]');

  // Authorization headers (best-effort).
  value = value.replace(/(Authorization:\s*Bearer\s+)[A-Za-z0-9\-_.]+/gi, '$1[REDACTED]');

  return truncateString(value, maxLen);
}

function toSafeJsonValue(
  value: unknown,
  options: Required<RedactOptions>,
  depth: number,
  parentKey?: string
): JsonValue {
  if (value == null) return null;
  if (typeof value === 'boolean' || typeof value === 'number') return value;

  if (typeof value === 'string') {
    if (parentKey && (SENSITIVE_KEY_RE.test(parentKey) || REDACT_TEXT_KEY_RE.test(parentKey))) {
      return `[REDACTED:${parentKey}]`;
    }
    return redactString(value, options.maxStringLength);
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message || 'Error', options.maxStringLength),
      stack: value.stack ? truncateString(redactString(value.stack, options.maxStringLength), options.maxStringLength) : null,
    };
  }

  if (depth >= options.maxDepth) {
    return '[Truncated:ObjectDepthLimit]';
  }

  if (Array.isArray(value)) {
    const slice = value.slice(0, options.maxArrayLength);
    return slice.map((item) => toSafeJsonValue(item, options, depth + 1, parentKey));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).slice(0, options.maxObjectKeys);
    const out: Record<string, JsonValue> = {};

    for (const key of keys) {
      if (SENSITIVE_KEY_RE.test(key)) {
        out[key] = `[REDACTED:${key}]`;
        continue;
      }

      const v = obj[key];
      if (typeof v === 'string' && REDACT_TEXT_KEY_RE.test(key)) {
        out[key] = `[REDACTED:${key}]`;
        continue;
      }

      out[key] = toSafeJsonValue(v, options, depth + 1, key);
    }

    if (Object.keys(obj).length > keys.length) {
      out._truncatedKeys = `[Truncated:${Object.keys(obj).length - keys.length} keys]`;
    }

    return out;
  }

  // Fallback for symbols/functions/bigints/etc.
  return redactString(String(value), options.maxStringLength);
}

export function redactForLog(value: unknown, opts?: RedactOptions): JsonValue {
  const options: Required<RedactOptions> = { ...DEFAULT_OPTIONS, ...(opts || {}) };
  return toSafeJsonValue(value, options, 0);
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => redactForLog(arg));
}

export const safeConsole = {
  log: (...args: unknown[]) => console.log(...formatArgs(args)),
  warn: (...args: unknown[]) => console.warn(...formatArgs(args)),
  error: (...args: unknown[]) => console.error(...formatArgs(args)),
};

export function redactErrorMessage(message: string, opts?: RedactOptions): string {
  const options: Required<RedactOptions> = { ...DEFAULT_OPTIONS, ...(opts || {}) };
  return redactString(String(message || ''), options.maxStringLength);
}
