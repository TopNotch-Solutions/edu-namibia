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
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #d4c4a8; }
    .leaflet-container { background: #d4c4a8; }
    .pin {
      background: #E84A7F;
      border: 2.5px solid #fff;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    }
    .pin.selected {
      background: #D21034;
      width: 22px;
      height: 22px;
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
      var map = L.map('map', { zoomControl: true }).setView([${camera.latitude}, ${camera.longitude}], ${zoom});
      window.map = map;

      var tilesLoaded = 0;
      var tileErrors = 0;
      var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
          var icon = L.divIcon({
            className: '',
            html: '<div class="pin' + (m.selected ? ' selected' : '') + '"></div>',
            iconSize: [m.selected ? 22 : 18, m.selected ? 22 : 18],
            iconAnchor: [m.selected ? 11 : 9, m.selected ? 11 : 9],
          });
          var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
          marker.bindPopup('<strong>' + escapeHtml(m.title) + '</strong><br/>' + escapeHtml(m.subtitle));
          marker.on('click', function () { post('markerPress', { id: m.id }); });
          layerById[m.id] = marker;
        });
      }

      upsertMarkers(markersData);

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
    backgroundColor: '#D4C4A8',
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
    backgroundColor: '#F1EADF',
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
