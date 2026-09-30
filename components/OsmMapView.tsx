import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { MapCamera, cameraToZoom } from '@/constants/namibiaRegions';

export type OsmMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  selected?: boolean;
};

type OsmMapViewProps = {
  style?: ViewStyle;
  camera: MapCamera;
  markers: OsmMapMarker[];
  onMarkerPress?: (id: string) => void;
  /** Bumps when camera should animate to `camera`. */
  cameraKey?: string | number;
  /** Called when the map can't load (usually no internet connection). */
  onUnavailableChange?: (unavailable: boolean) => void;
};

// OSM's tile policy requires a Referer; inline HTML has none unless a baseUrl is set.
const MAP_BASE_URL = 'https://net.kopanovertex.edulearningnamibia/';

// If Leaflet hasn't reported ready by then, treat the map as unavailable.
const LOAD_TIMEOUT_MS = 12000;

function buildMapHtml(camera: MapCamera, markers: OsmMapMarker[]) {
  const zoom = cameraToZoom(camera.latitudeDelta);
  const markersJson = JSON.stringify(
    markers.map((m) => ({
      id: m.id,
      lat: m.latitude,
      lng: m.longitude,
      title: m.title,
      subtitle: m.subtitle ?? '',
      selected: Boolean(m.selected),
    }))
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #cfe6f7; }
    .leaflet-container { background: #cfe6f7; font-family: system-ui, -apple-system, sans-serif; }
    /* Brighten free OSM tiles without a paid basemap API key. */
    .leaflet-tile-pane {
      filter: saturate(1.45) contrast(1.08) brightness(1.06);
    }
    .leaflet-control-attribution {
      background: rgba(255,255,255,0.82) !important;
      color: #475569;
      font-size: 9px;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(15, 42, 78, 0.22);
      border: 1px solid rgba(232, 238, 245, 0.95);
    }
    .leaflet-popup-content {
      margin: 10px 12px;
      font-size: 13px;
      line-height: 1.35;
      color: #0F172A;
    }
    .leaflet-popup-tip { box-shadow: none; }
    .pin-wrap {
      position: relative;
      width: 28px;
      height: 36px;
    }
    .pin {
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: linear-gradient(145deg, #FF6B9D 0%, #E84A7F 55%, #C2185B 100%);
      border: 2.5px solid #fff;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.35);
      margin: 2px 0 0 3px;
    }
    .pin.selected {
      width: 26px;
      height: 26px;
      background: linear-gradient(145deg, #FFCE00 0%, #F5B700 60%, #E08A2C 100%);
      border-color: #fff;
      box-shadow: 0 5px 14px rgba(224, 138, 44, 0.45);
    }
    .pin-dot {
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #fff;
      top: 9px;
      left: 10.5px;
      box-shadow: 0 0 0 1px rgba(15,23,42,0.12);
    }
    .pin-wrap.selected .pin-dot {
      top: 11px;
      left: 12.5px;
      width: 8px;
      height: 8px;
      background: #0F172A;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function post(type, payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload || {})));
    }
  </script>
  <script
    src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
    onerror="post('loadError', { reason: 'leaflet' })"
  ></script>
  <script>
    if (typeof L === 'undefined') {
      post('loadError', { reason: 'leaflet' });
    } else {
      var markersData = ${markersJson};
      var map = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([${camera.latitude}, ${camera.longitude}], ${zoom});
      window.map = map;

      var tilesLoaded = 0;
      var tileErrors = 0;
      // Free OSM tiles (no API key). Visual punch comes from CSS filter above.
      var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });
      tiles.on('tileload', function () {
        tilesLoaded += 1;
        if (tilesLoaded === 1) post('tilesOk');
      });
      tiles.on('tileerror', function () {
        tileErrors += 1;
        if (tilesLoaded === 0 && tileErrors >= 4) post('loadError', { reason: 'tiles' });
      });
      tiles.addTo(map);

      setTimeout(function () { map.invalidateSize(); }, 120);

      var layerById = {};

      function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      function upsertMarkers(list) {
        Object.keys(layerById).forEach(function (k) {
          map.removeLayer(layerById[k]);
          delete layerById[k];
        });
        (list || []).forEach(function (m) {
          var selected = !!m.selected;
          var size = selected ? 32 : 28;
          var icon = L.divIcon({
            className: '',
            html: '<div class="pin-wrap' + (selected ? ' selected' : '') + '"><div class="pin' + (selected ? ' selected' : '') + '"></div><div class="pin-dot"></div></div>',
            iconSize: [size, selected ? 40 : 36],
            iconAnchor: [size / 2, selected ? 38 : 34],
            popupAnchor: [0, selected ? -34 : -30],
          });
          var marker = L.marker([m.lat, m.lng], { icon: icon, riseOnHover: true }).addTo(map);
          marker.bindPopup('<strong>' + escapeHtml(m.title) + '</strong><br/><span style="color:#64748B">' + escapeHtml(m.subtitle) + '</span>');
          marker.on('click', function () { post('markerPress', { id: m.id }); });
          layerById[m.id] = marker;
        });
      }

      upsertMarkers(markersData);

      // Frame all pins on first paint so the country overview isn't too zoomed out.
      if (markersData.length > 1) {
        var bounds = L.latLngBounds(markersData.map(function (m) { return [m.lat, m.lng]; }));
        map.fitBounds(bounds.pad(0.22), { maxZoom: 7, animate: false, padding: [48, 48] });
      }

      window.handleNativeMessage = function (raw) {
        try {
          var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (msg.type === 'setCamera') {
            map.flyTo([msg.latitude, msg.longitude], msg.zoom, { duration: 0.45 });
            setTimeout(function () { map.invalidateSize(); }, 80);
          }
          if (msg.type === 'setMarkers') {
            upsertMarkers(msg.markers);
          }
        } catch (e) {}
      };

      post('ready');
    }
  </script>
</body>
</html>`;
}

function injectPayload(webRef: React.RefObject<WebView | null>, payload: object) {
  webRef.current?.injectJavaScript(
    `window.handleNativeMessage && window.handleNativeMessage(${JSON.stringify(payload)}); true;`
  );
}

function markersPayload(markers: OsmMapMarker[]) {
  return {
    type: 'setMarkers',
    markers: markers.map((m) => ({
      id: m.id,
      lat: m.latitude,
      lng: m.longitude,
      title: m.title,
      subtitle: m.subtitle ?? '',
      selected: Boolean(m.selected),
    })),
  };
}

function cameraPayload(camera: MapCamera) {
  return {
    type: 'setCamera',
    latitude: camera.latitude,
    longitude: camera.longitude,
    zoom: cameraToZoom(camera.latitudeDelta),
  };
}

export function OsmMapView({
  style,
  camera,
  markers,
  onMarkerPress,
  cameraKey,
  onUnavailableChange,
}: OsmMapViewProps) {
  const webRef = useRef<WebView>(null);
  // HTML is built once per load attempt from the initial camera/markers;
  // later changes are pushed in via injectJavaScript.
  const [html] = useState(() => buildMapHtml(camera, markers));
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    onUnavailableChange?.(unavailable);
  }, [unavailable, onUnavailableChange]);

  // Give up waiting if Leaflet never reports ready (e.g. request hangs offline).
  useEffect(() => {
    if (ready || unavailable) return;
    const timer = setTimeout(() => setUnavailable(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready, unavailable, attempt]);

  useEffect(() => {
    if (!ready) return;
    injectPayload(webRef, cameraPayload(camera));
    // camera fields are listed explicitly so a new object with the same values doesn't re-fly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cameraKey, camera.latitude, camera.longitude, camera.latitudeDelta]);

  useEffect(() => {
    if (!ready) return;
    injectPayload(webRef, markersPayload(markers));
  }, [ready, markers]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setReady(true);
      } else if (data.type === 'tilesOk') {
        setUnavailable(false);
      } else if (data.type === 'loadError') {
        setUnavailable(true);
      } else if (data.type === 'markerPress' && data.id && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {
      // ignore malformed messages
    }
  };

  const retry = () => {
    setReady(false);
    setUnavailable(false);
    setAttempt((n) => n + 1);
  };

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        key={attempt}
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: MAP_BASE_URL }}
        onMessage={onMessage}
        onError={() => setUnavailable(true)}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        scrollEnabled={false}
      />

      {unavailable && (
        <View style={styles.offlineOverlay}>
          <Text style={styles.offlineIcon}>🗺️</Text>
          <Text style={styles.offlineTitle}>Map unavailable offline</Text>
          <Text style={styles.offlineText}>
            The map needs an internet connection. You can still search for a region above.
          </Text>
          <Pressable
            onPress={retry}
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#CFE6F7',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#EEF6FC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  offlineIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#002B7F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
