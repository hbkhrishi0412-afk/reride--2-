/**
 * Leaflet raster basemap config.
 * CARTO free tiles now watermark "API KEY REQUIRED" without a key — prefer OSM
 * unless VITE_CARTO_API_KEY or VITE_MAP_TILE_URL is set.
 */
export function getLeafletBasemapConfig(): {
  url: string;
  options: {
    subdomains?: string | string[];
    maxZoom?: number;
    attribution?: string;
  };
} {
  const env =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
      : undefined;

  const customUrl = env?.VITE_MAP_TILE_URL?.trim();
  if (customUrl) {
    return {
      url: customUrl,
      options: {
        maxZoom: 19,
        attribution:
          env?.VITE_MAP_TILE_ATTRIBUTION?.trim() ||
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    };
  }

  const cartoKey = env?.VITE_CARTO_API_KEY?.trim();
  if (cartoKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?apikey=${encodeURIComponent(cartoKey)}`,
      options: {
        subdomains: 'abcd',
        maxZoom: 20,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    };
  }

  // Default: OpenStreetMap raster tiles (no API key).
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      subdomains: 'abc',
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  };
}
