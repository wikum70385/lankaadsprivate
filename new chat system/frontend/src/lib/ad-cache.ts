// Simple ad cache for both category and single ad fetches
// Uses both in-memory and localStorage for max speed

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const memoryCache: Record<string, { data: any, expires: number }> = {};

function getCacheKey(type: 'ads' | 'ad', key: string) {
  return `adcache_${type}_${key}`;
}

export function getCachedAds(categorySlug: string): any[] | null {
  const cacheKey = getCacheKey('ads', categorySlug);
  // Check memory first
  const mem = memoryCache[cacheKey];
  if (mem && mem.expires > Date.now()) return mem.data;
  // Check localStorage
  const item = localStorage.getItem(cacheKey);
  if (!item) return null;
  try {
    const { data, expires } = JSON.parse(item);
    if (expires > Date.now()) {
      memoryCache[cacheKey] = { data, expires };
      return data;
    }
  } catch {}
  return null;
}

export function setCachedAds(categorySlug: string, data: any[]) {
  const cacheKey = getCacheKey('ads', categorySlug);
  const expires = Date.now() + CACHE_TTL;
  memoryCache[cacheKey] = { data, expires };
  localStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
}

export function getCachedAd(adId: string): any | null {
  const cacheKey = getCacheKey('ad', adId);
  const mem = memoryCache[cacheKey];
  if (mem && mem.expires > Date.now()) return mem.data;
  const item = localStorage.getItem(cacheKey);
  if (!item) return null;
  try {
    const { data, expires } = JSON.parse(item);
    if (expires > Date.now()) {
      memoryCache[cacheKey] = { data, expires };
      return data;
    }
  } catch {}
  return null;
}

export function setCachedAd(adId: string, data: any) {
  const cacheKey = getCacheKey('ad', adId);
  const expires = Date.now() + CACHE_TTL;
  memoryCache[cacheKey] = { data, expires };
  localStorage.setItem(cacheKey, JSON.stringify({ data, expires }));
}
