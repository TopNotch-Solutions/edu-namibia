export type NamibiaRegion = {
  id: string;
  name: string;
  capital: string;
  latitude: number;
  longitude: number;
};

export type MapCamera = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

/** Region capitals / admin centers with map coordinates. */
export const NAMIBIA_REGIONS: NamibiaRegion[] = [
  { id: 'kunene', name: 'Kunene', capital: 'Opuwo', latitude: -18.061, longitude: 13.84 },
  { id: 'omusati', name: 'Omusati', capital: 'Outapi', latitude: -17.503, longitude: 14.984 },
  { id: 'oshana', name: 'Oshana', capital: 'Oshakati', latitude: -17.788, longitude: 15.698 },
  { id: 'ohangwena', name: 'Ohangwena', capital: 'Eenhana', latitude: -17.466, longitude: 16.336 },
  { id: 'oshikoto', name: 'Oshikoto', capital: 'Omuthiya', latitude: -18.361, longitude: 16.581 },
  { id: 'kavango-west', name: 'Kavango West', capital: 'Nkurenkuru', latitude: -17.627, longitude: 18.606 },
  { id: 'kavango-east', name: 'Kavango East', capital: 'Rundu', latitude: -17.917, longitude: 19.767 },
  { id: 'zambezi', name: 'Zambezi', capital: 'Katima Mulilo', latitude: -17.5, longitude: 24.267 },
  { id: 'otjozondjupa', name: 'Otjozondjupa', capital: 'Otjiwarongo', latitude: -20.464, longitude: 16.648 },
  { id: 'erongo', name: 'Erongo', capital: 'Swakopmund', latitude: -22.679, longitude: 14.527 },
  { id: 'khomas', name: 'Khomas', capital: 'Windhoek', latitude: -22.57, longitude: 17.083 },
  { id: 'omaheke', name: 'Omaheke', capital: 'Gobabis', latitude: -22.45, longitude: 18.972 },
  { id: 'hardap', name: 'Hardap', capital: 'Mariental', latitude: -24.633, longitude: 17.966 },
  { id: 'karas', name: 'ǁKaras', capital: 'Keetmanshoop', latitude: -26.576, longitude: 18.131 },
];

export const NAMIBIA_MAP_REGION: MapCamera = {
  latitude: -22.0,
  longitude: 17.2,
  latitudeDelta: 12.5,
  longitudeDelta: 11.5,
};

export function cameraToZoom(latitudeDelta: number): number {
  // Approximate conversion from latitudeDelta to Leaflet zoom.
  const zoom = Math.round(Math.log2(360 / Math.max(latitudeDelta, 0.01)));
  return Math.max(4, Math.min(16, zoom));
}
