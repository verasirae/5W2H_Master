import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely parses response JSON without throwing SyntaxError on HTML/non-JSON responses.
 */
export async function safeFetchJson<T = any>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { ok: res.ok, status: res.status, data: null };
    }
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Unexpected non-JSON response (${res.status})`,
      };
    }
    const data = JSON.parse(trimmed) as T;
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: e?.message || 'Failed to parse JSON response',
    };
  }
}
