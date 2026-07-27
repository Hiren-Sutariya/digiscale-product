export const digiscaleCache: Record<string, any> = {};

export function setCache(key: string, data: any) {
  digiscaleCache[key] = data;
}

export function getCache(key: string) {
  return digiscaleCache[key];
}

export function clearCache() {
  for (const k in digiscaleCache) {
    delete digiscaleCache[k];
  }
}
