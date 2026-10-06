/**
 * Minimal client for the NexWall Developer API v1.
 * Docs: https://nexwall.kodnextech.com/wallpaper-api/docs
 */

// EXPO_PUBLIC_* variables are inlined into the JS bundle at build time.
// Anyone with the app can read this key. See "Production note" in README.
const API_KEY = process.env.EXPO_PUBLIC_NEXWALL_API_KEY ?? '';
const PROXY_URL = process.env.EXPO_PUBLIC_NEXWALL_BASE_URL;
const USING_PROXY = Boolean(PROXY_URL);
const BASE_URL = PROXY_URL || 'https://nexwall.kodnextech.com/api/developer/v1';

export interface Category {
  id: number;
  name: string;
  slug: string;
  cover_image_url: string | null;
  wallpaper_count: number;
  is_premium: boolean;
}

export interface Wallpaper {
  id: number;
  category_id: number;
  image_url: string;
  thumbnail_url: string | null;
  is_premium: boolean;
  type: 'image' | 'live';
  video_url: string | null;
  video_thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: unknown;
  resolution: string | null;
  file_size: number | null;
  category: { id: number; name: string; slug: string; is_premium: boolean } | null;
}

interface Meta {
  plan: string;
  remaining_requests_today: number;
}

export interface CategoriesResponse extends Meta {
  data: Category[];
}

export interface WallpapersResponse extends Meta {
  data: Wallpaper[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type Sort = 'newest' | 'oldest' | 'popular' | 'random';

export interface WallpaperQuery {
  page?: number;
  /** 1-100, default 50 */
  per_page?: number;
  category_id?: number;
  /** 2-100 characters, matches tags */
  search?: string;
  sort?: Sort;
  /** `live` requires the Ultra plan */
  type?: 'image' | 'live';
}

export class NexWallError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** Seconds until you can retry (HTTP 429 only). */
    public readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = 'NexWallError';
  }

  get userMessage(): string {
    switch (this.status) {
      case 401:
        return 'Invalid or missing API key. Set EXPO_PUBLIC_NEXWALL_API_KEY in .env. Free key: https://nexwall.kodnextech.com/developers/register';
      case 404:
        return 'Not found, or not available on your plan.';
      case 422:
        return `Invalid request: ${this.message}`;
      case 429:
        return `API quota exceeded.${this.retryAfter ? ` Try again in ${this.retryAfter}s.` : ''}`;
      default:
        return this.message;
    }
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof NexWallError) return error.userMessage;
  if (error instanceof Error) return error.message;
  return String(error);
}

// --- Remaining daily quota (from `remaining_requests_today`) ---------------

let remainingToday: number | null = null;
const listeners = new Set<() => void>();

function setRemaining(value: number | null) {
  remainingToday = value;
  listeners.forEach((listener) => listener());
}

export const quotaStore = {
  get: () => remainingToday,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// --- Requests ------------------------------------------------------------

async function request<T extends Meta>(path: string, query: object = {}): Promise<T> {
  // With a custom proxy URL the key lives on the server, so it is optional here.
  if (!API_KEY && !USING_PROXY) throw new NexWallError(401, 'EXPO_PUBLIC_NEXWALL_API_KEY is not set');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.append(key, String(value));
  }
  const qs = params.toString();

  const response = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
    headers: {
      Accept: 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 429) setRemaining(0);
    const retryAfter = Number(response.headers.get('Retry-After'));
    throw new NexWallError(
      response.status,
      body?.message ?? `HTTP ${response.status}`,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    );
  }

  if (typeof body?.remaining_requests_today === 'number') {
    setRemaining(body.remaining_requests_today);
  }
  return body as T;
}

export const nexwall = {
  getCategories: () => request<CategoriesResponse>('/categories'),

  getWallpapers: (query: WallpaperQuery = {}) =>
    request<WallpapersResponse>('/wallpapers', { type: 'image', ...query }),

  getCategoryWallpapers: (categoryId: number, query: Pick<WallpaperQuery, 'page' | 'per_page'> = {}) =>
    request<WallpapersResponse>(`/categories/${categoryId}/wallpapers`, query),
};
