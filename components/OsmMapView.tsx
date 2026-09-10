import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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
};

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
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
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
    const markersData = ${markersJson};
    const map = L.map('map', { zoomControl: true }).setView([${camera.latitude}, ${camera.longitude}], ${zoom});
    window.map = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    setTimeout(function () { map.invalidateSize(); }, 120);

    const layerById = {};
    function post(type, payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
    }

    function upsertMarkers(list) {
      Object.values(layerById).forEach(function (m) { map.removeLayer(m); });
      Object.keys(layerById).forEach(function (k) { delete layerById[k]; });
      (list || []).forEach(function (m) {
        var icon = L.divIcon({
          className: '',
          html: '<div class="pin' + (m.selected ? ' selected' : '') + '"></div>',
          iconSize: [m.selected ? 22 : 18, m.selected ? 22 : 18],
          iconAnchor: [m.selected ? 11 : 9, m.selected ? 11 : 9],
        });
        var marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(map);
        marker.bindPopup('<strong>' + m.title + '</strong><br/>' + m.subtitle);
        marker.on('click', function () { post('markerPress', { id: m.id }); });
        layerById[m.id] = marker;
      });
    }

    upsertMarkers(markersData);

    function handleMessage(raw) {
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
    }

    window.handleNativeMessage = handleMessage;
    document.addEventListener('message', function (e) { handleMessage(e.data); });
    window.addEventListener('message', function (e) { handleMessage(e.data); });
  </script>
</body>
</html>`;
}

function injectPayload(webRef: React.RefObject<WebView | null>, payload: object) {
  webRef.current?.injectJavaScript(
    `window.handleNativeMessage && window.handleNativeMessage(${JSON.stringify(payload)}); true;`
  );
}

export function OsmMapView({
  style,
  camera,
  markers,
  onMarkerPress,
  cameraKey,
}: OsmMapViewProps) {
  const webRef = useRef<WebView>(null);
  const html = useMemo(() => buildMapHtml(camera, markers), []);
  const readyRef = useRef(false);
  const cameraRef = useRef(camera);
  const markersRef = useRef(markers);
  cameraRef.current = camera;
  markersRef.current = markers;

  const pushCamera = () => {
    injectPayload(webRef, {
      type: 'setCamera',
      latitude: cameraRef.current.latitude,
      longitude: cameraRef.current.longitude,
      zoom: cameraToZoom(cameraRef.current.latitudeDelta),
    });
  };

  const pushMarkers = () => {
    injectPayload(webRef, {
      type: 'setMarkers',
      markers: markersRef.current.map((m) => ({
        id: m.id,
        lat: m.latitude,
        lng: m.longitude,
        title: m.title,
        subtitle: m.subtitle ?? '',
        selected: Boolean(m.selected),
      })),
    });
  };

  useEffect(() => {
    if (!readyRef.current) return;
    pushCamera();
  }, [cameraKey, camera.latitude, camera.longitude, camera.latitudeDelta]);

  useEffect(() => {
    if (!readyRef.current) return;
    pushMarkers();
  }, [markers]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress' && data.id && onMarkerPress) {
        onMarkerPress(data.id);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={[styles.wrap, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        onLoadEnd={() => {
          readyRef.current = true;
          pushCamera();
          pushMarkers();
          webRef.current?.injectJavaScript(
            'window.map && window.map.invalidateSize && window.map.invalidateSize(); true;'
          );
        }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        scrollEnabled={false}
      />
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
});
