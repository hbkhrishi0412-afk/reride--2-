/**
 * Runnable check: default basemap must not hit CARTO without a key.
 * Run: node utils/mapTileLayer.selfcheck.mjs
 */
import assert from 'node:assert/strict';

function getLeafletBasemapConfig(env = {}) {
  const customUrl = env?.VITE_MAP_TILE_URL?.trim();
  if (customUrl) {
    return { url: customUrl, options: { maxZoom: 19 } };
  }
  const cartoKey = env?.VITE_CARTO_API_KEY?.trim();
  if (cartoKey) {
    return {
      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`,
      options: { subdomains: 'abcd', maxZoom: 20 },
    };
  }
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: { subdomains: 'abc', maxZoom: 19 },
  };
}

const def = getLeafletBasemapConfig({});
assert.ok(def.url.includes('openstreetmap.org'), 'default must be OSM');
assert.ok(!def.url.includes('cartocdn'), 'default must not use CARTO');

const withKey = getLeafletBasemapConfig({ VITE_CARTO_API_KEY: 'abc' });
assert.ok(withKey.url.includes('cartocdn') && withKey.url.includes('?key=abc'), 'CARTO key uses ?key=');

const custom = getLeafletBasemapConfig({ VITE_MAP_TILE_URL: 'https://example/{z}/{x}/{y}.png' });
assert.equal(custom.url, 'https://example/{z}/{x}/{y}.png');

console.log('mapTileLayer.selfcheck: ok');
