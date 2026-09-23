type LogFields = Record<string, string | number | boolean | undefined>;

function safeFields(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (/password|token|secret|cookie|authorization/i.test(key)) continue;
    out[key] = value;
  }
  return out;
}

export function logInfo(event: string, fields: LogFields = {}) {
  console.info(JSON.stringify({ level: "info", event, ...safeFields(fields) }));
}

export function logWarn(event: string, fields: LogFields = {}) {
  console.warn(JSON.stringify({ level: "warn", event, ...safeFields(fields) }));
}

export function logError(event: string, error: unknown, fields: LogFields = {}) {
  const err = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) };
  console.error(JSON.stringify({ level: "error", event, ...safeFields(fields), error: err }));
}
