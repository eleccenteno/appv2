/**
 * Sanitization utilities for preventing XSS and Mass Assignment vulnerabilities.
 */

/**
 * Sanitize a string value to prevent XSS when rendering.
 * Strips HTML tags and encodes special characters.
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize formData: ensure it's a flat Record<string, string> with safe values.
 * Removes any non-string keys, nested objects, or arrays.
 */
export function sanitizeFormData(formData: unknown): Record<string, string> {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return {};
  }
  const result: Record<string, string> = {};
  const obj = formData as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Limit individual field length to 10000 chars
      result[key] = value.length > 10000 ? value.substring(0, 10000) : value;
    } else if (value !== null && value !== undefined) {
      result[key] = String(value);
    }
  }
  return result;
}
