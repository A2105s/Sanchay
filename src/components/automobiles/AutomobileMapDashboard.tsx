'use client';

import 'leaflet/dist/leaflet.css';

import L, { type DivIcon } from 'leaflet';
import { LocateFixed, Maximize2, Minimize2, Search } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  PoliceStationPanel,
  type PoliceStationPanelData,
} from '@/components/automobiles/PoliceStationPanel';
import { getMapCenter } from '@/lib/automobiles-service';
import { cn } from '@/lib/utils';

import type { StationVehicleCounts } from '@/components/automobiles/VehicleTypeCounter';

interface StationFleetSummary {
  total: number;
  vehicleCounts: StationVehicleCounts;
}

interface PoliceStationMapPoint {
  id: string;
  name: string;
  sector: 'POLICE_PATROL';
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface StationMarkerEntry {
  stationId: string;
  stationName: string;
  marker: L.Marker;
}

interface StationSelectionState {
  primaryStation: PoliceStationMapPoint | null;
  secondaryStation: PoliceStationMapPoint | null;
  routeGeometry: Array<[number, number]> | null;
  routeDistance: number | null;
  routeDuration: number | null;
  routeSourceLabel: 'Flight path estimate' | 'Road route via OSRM' | null;
  isLoadingRoute: boolean;
}

const LIGHT_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const DARK_TILE = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
};

const DEFAULT_MAP_ZOOM = 13.8;
const AVERAGE_TRANSFER_SPEED_KMPH = 36;

const normalizeSearchText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeStationKey = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/police\s*station/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

const isSameStation = (left: string, right: string): boolean => {
  const leftKey = normalizeStationKey(left);
  const rightKey = normalizeStationKey(right);
  if (!leftKey || !rightKey) return false;

  return leftKey === rightKey || leftKey.includes(rightKey) || rightKey.includes(leftKey);
};

const getStationSearchTokens = (stationName: string, count: number): string[] => {
  const normalizedName = normalizeSearchText(stationName);
  const compactName = normalizeSearchText(
    stationName.replace(/police\s*station/gi, '').replace(/\bps\b/gi, '')
  );

  const tokens = [normalizedName, compactName, String(count), `${count} vehicles`]
    .map((token) => normalizeSearchText(token))
    .filter(Boolean);

  return [...new Set(tokens)];
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getStationFleetSummary = (stationId: string): StationFleetSummary => {
  const seed = hashString(stationId);
  // Use unsigned right shift to prevent negative values from sign-propagation.
  const patrol = 2 + (seed % 6);
  const seized = 8 + ((seed >>> 3) % 16);
  const pcr = 1 + ((seed >>> 7) % 5);
  const motorcycle = 2 + ((seed >>> 11) % 7);
  const truck = 1 + ((seed >>> 15) % 6);
  const bus = (seed >>> 19) % 4;

  const vehicleCounts: StationVehicleCounts = {
    PATROL: Math.max(0, patrol),
    SEIZED: Math.max(0, seized),
    PCR: Math.max(0, pcr),
    MOTORCYCLE: Math.max(0, motorcycle),
    TRUCK: Math.max(0, truck),
    BUS: Math.max(0, bus),
  };

  const total = Math.max(
    0,
    Object.values(vehicleCounts).reduce((sum, value) => sum + value, 0)
  );

  return {
    total,
    vehicleCounts,
  };
};

const parseKmlPolygonCoordinates = (kmlText: string): [number, number][] => {
  const matches = Array.from(kmlText.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/gi));
  const allPolygons = matches
    .map((match) => {
      const raw = match[1]?.trim() ?? '';
      if (!raw) return [];
      return raw
        .split(/\s+/)
        .map((entry) => {
          const [lngText, latText] = entry.split(',');
          const lng = Number(lngText);
          const lat = Number(latText);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng] as [number, number];
        })
        .filter((point): point is [number, number] => point !== null);
    })
    .filter((polygon) => polygon.length >= 3);

  if (allPolygons.length === 0) return [];
  return allPolygons.reduce((largest, current) =>
    current.length > largest.length ? current : largest
  );
};

const parsePoliceStationPlacemarks = (kmlText: string): PoliceStationMapPoint[] => {
  const placemarkMatches = Array.from(kmlText.matchAll(/<Placemark>([\s\S]*?)<\/Placemark>/gi));

  const slugify = (value: string): string =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return placemarkMatches
    .map((match) => {
      const block = match[1] ?? '';
      const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/i);
      const coordinatesMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);

      if (!nameMatch || !coordinatesMatch) return null;

      const name = nameMatch[1].trim();
      const firstCoordinate = coordinatesMatch[1].trim().split(/\s+/)[0] ?? '';
      const [lngText, latText] = firstCoordinate.split(',');
      const lng = Number(lngText);
      const lat = Number(latText);

      if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        id: slugify(name),
        name,
        sector: 'POLICE_PATROL',
        coordinates: { lat, lng },
      };
    })
    .filter((station): station is PoliceStationMapPoint => station !== null);
};

const toRadians = (value: number): number => (value * Math.PI) / 180;

const haversineDistanceKm = (from: PoliceStationMapPoint, to: PoliceStationMapPoint): number => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.coordinates.lat - from.coordinates.lat);
  const lngDelta = toRadians(to.coordinates.lng - from.coordinates.lng);
  const fromLat = toRadians(from.coordinates.lat);
  const toLat = toRadians(to.coordinates.lat);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const estimateDurationMinutes = (distanceKm: number): number => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return (distanceKm / AVERAGE_TRANSFER_SPEED_KMPH) * 60;
};

const buildFlightArcGeometry = (
  from: PoliceStationMapPoint,
  to: PoliceStationMapPoint,
  segments = 56
): Array<[number, number]> => {
  const fromLat = from.coordinates.lat;
  const fromLng = from.coordinates.lng;
  const toLat = to.coordinates.lat;
  const toLng = to.coordinates.lng;

  const deltaLat = toLat - fromLat;
  const deltaLng = toLng - fromLng;
  const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
  const midpointLat = (fromLat + toLat) / 2;
  const midpointLng = (fromLng + toLng) / 2;
  const normalX = -deltaLng;
  const normalY = deltaLat;
  const normalLength = Math.max(Math.sqrt(normalX * normalX + normalY * normalY), 1e-6);
  const normalizedX = normalX / normalLength;
  const normalizedY = normalY / normalLength;
  const curvatureOffset = Math.min(0.065, Math.max(0.008, distance * 0.34));

  const controlLat = midpointLat + normalizedY * curvatureOffset;
  const controlLng = midpointLng + normalizedX * curvatureOffset;

  const points: Array<[number, number]> = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const oneMinus = 1 - t;
    const lat = oneMinus * oneMinus * fromLat + 2 * oneMinus * t * controlLat + t * t * toLat;
    const lng = oneMinus * oneMinus * fromLng + 2 * oneMinus * t * controlLng + t * t * toLng;
    points.push([lat, lng]);
  }

  return points;
};

const encodeBookingParams = (
  from: PoliceStationMapPoint,
  to: PoliceStationMapPoint,
  distanceKm: number,
  durationMinutes: number,
  sourceLabel: string
): string => {
  const params = new URLSearchParams({
    from: from.name,
    fromId: from.id,
    fromLat: from.coordinates.lat.toFixed(6),
    fromLng: from.coordinates.lng.toFixed(6),
    to: to.name,
    toId: to.id,
    toLat: to.coordinates.lat.toFixed(6),
    toLng: to.coordinates.lng.toFixed(6),
    distance: distanceKm.toFixed(2),
    duration: durationMinutes.toFixed(0),
    sector: from.sector,
    station: from.name,
    sourceStation: from.name,
    sourceStationId: from.id,
    destinationStation: to.name,
    destinationStationId: to.id,
    source: sourceLabel,
    purpose: 'Inter-station Transfer',
  });

  return params.toString();
};

const isPointInPolygon = (
  lat: number,
  lng: number,
  polygon: readonly [number, number][]
): boolean => {
  if (polygon.length < 3) return true;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
};

const buildPoliceStationIcon = (stationName: string, vehicleCount: number): DivIcon => {
  const compactName = stationName.replace(/ Police Station$/i, ' PS');
  const safeVehicleCount = Math.max(
    0,
    Number.isFinite(vehicleCount) ? Math.floor(vehicleCount) : 0
  );
  const count = safeVehicleCount > 99 ? '99+' : String(safeVehicleCount);
  const countFontSize = count.length >= 3 ? 7 : count.length === 2 ? 9 : 10;
  const countY = count.length >= 3 ? 25 : 26;

  return L.divIcon({
    className: 'nt-police-station-icon-wrapper',
    html: `<span class="nt-police-station-marker" role="img" aria-label="${compactName}, ${safeVehicleCount} parked vehicles">
      <span class="nt-police-station-pin">
        <svg class="nt-police-station-svg" xmlns="http://www.w3.org/2000/svg" width="42" height="50" viewBox="0 0 48 58" aria-hidden="true" focusable="false">
          <defs>
            <filter id="ps-shadow" x="-30%" y="-20%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.35)" />
            </filter>
          </defs>
          <path
            d="M24 2 C12.954 2 4 10.954 4 22 C4 34.5 24 56 24 56 C24 56 44 34.5 44 22 C44 10.954 35.046 2 24 2 Z"
            fill="#dc2626"
            filter="url(#ps-shadow)"
          />
          <circle cx="24" cy="22" r="10" fill="#ffffff" />
          <text
            x="24"
            y="${countY}"
            text-anchor="middle"
            font-family="'Inter', 'SF Pro Display', -apple-system, sans-serif"
            font-size="${countFontSize}"
            font-weight="800"
            fill="#dc2626"
            letter-spacing="-0.3"
          >${count}</text>
        </svg>
      </span>
      <span class="nt-police-station-label">${compactName}</span>
    </span>`,
    iconSize: [154, 64],
    iconAnchor: [21, 48],
  });
};

interface AutomobileMapDashboardProps {
  searchQuery?: string;
  showSearchOverlay?: boolean;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
  currentStationId?: string;
  currentStationName?: string;
  onBookVehicle?: (stationId: string) => void;
}

export function AutomobileMapDashboard({
  searchQuery,
  showSearchOverlay = true,
  onFullscreenToggle,
  isFullscreen,
  currentStationId,
  currentStationName,
  onBookVehicle,
}: AutomobileMapDashboardProps = {}) {
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [gwaliorBoundary, setGwaliorBoundary] = useState<[number, number][]>([]);
  const [policeStations, setPoliceStations] = useState<PoliceStationMapPoint[]>([]);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedStation, setSelectedStation] = useState<PoliceStationPanelData | null>(null);
  const [stationSelection, setStationSelection] = useState<StationSelectionState>({
    primaryStation: null,
    secondaryStation: null,
    routeGeometry: null,
    routeDistance: null,
    routeDuration: null,
    routeSourceLabel: null,
    isLoadingRoute: false,
  });
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const stationLayerRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.LayerGroup | null>(null);
  const stationMarkersRef = useRef<StationMarkerEntry[]>([]);
  const myLocationMarkerRef = useRef<L.CircleMarker | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const movingRouteDotRef = useRef<L.CircleMarker | null>(null);
  const routeInfoMarkerRef = useRef<L.Marker | null>(null);
  const movingDotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locateFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locateFeedback, setLocateFeedback] = useState<string | null>(null);

  const loggedInStation = useMemo(() => {
    const currentId = currentStationId ?? '';
    const currentName = currentStationName ?? '';
    if (!currentId && !currentName) {
      return null;
    }

    return (
      policeStations.find((station) => {
        return (
          (currentId.length > 0 && isSameStation(station.id, currentId)) ||
          (currentName.length > 0 && isSameStation(station.name, currentName)) ||
          (currentId.length > 0 && isSameStation(station.name, currentId)) ||
          (currentName.length > 0 && isSameStation(station.id, currentName))
        );
      }) ?? null
    );
  }, [currentStationId, currentStationName, policeStations]);

  const clearRouteSelection = useCallback(
    (clearPanel = true) => {
      if (clearPanel) {
        setSelectedStation(null);
      }

      setStationSelection((current) => ({
        ...current,
        primaryStation: loggedInStation ?? null,
        secondaryStation: null,
        routeGeometry: null,
        routeDistance: null,
        routeDuration: null,
        routeSourceLabel: null,
        isLoadingRoute: false,
      }));
    },
    [loggedInStation]
  );

  const updateSelectedStationPanel = useCallback((station: PoliceStationMapPoint) => {
    const summary = getStationFleetSummary(station.id);

    setSelectedStation({
      stationType: 'POLICE_STATION',
      stationId: station.id,
      stationName: station.name,
      district: 'Gwalior',
      address: `${station.name}, Gwalior`,
      totalVehicles: summary.total,
      vehicleCounts: summary.vehicleCounts,
      coordinates: [station.coordinates.lng, station.coordinates.lat],
    });
  }, []);

  const showLocateFeedback = useCallback((message: string) => {
    setLocateFeedback(message);

    if (locateFeedbackTimeoutRef.current) {
      clearTimeout(locateFeedbackTimeoutRef.current);
    }

    locateFeedbackTimeoutRef.current = setTimeout(() => {
      setLocateFeedback(null);
      locateFeedbackTimeoutRef.current = null;
    }, 2800);
  }, []);

  const updateStationLabelVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = stationMarkersRef.current;
    if (markers.length === 0) return;

    const minZoomForLabels = 14.5;
    const zoom = map.getZoom();

    for (const entry of markers) {
      const markerElement = entry.marker.getElement();
      const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
      if (!labelElement) continue;
      labelElement.classList.remove('nt-police-station-label-hidden');
    }

    if (zoom < minZoomForLabels) {
      for (const entry of markers) {
        const markerElement = entry.marker.getElement();
        const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
        if (!labelElement) continue;
        labelElement.classList.add('nt-police-station-label-hidden');
      }
      return;
    }

    const selectedStationId = selectedStation?.stationId ?? null;
    const prioritizedMarkers = [...markers].sort((a, b) => {
      if (a.stationId === selectedStationId) return -1;
      if (b.stationId === selectedStationId) return 1;
      return 0;
    });

    const occupiedRects: Array<{ left: number; right: number; top: number; bottom: number }> = [];

    for (const entry of prioritizedMarkers) {
      const markerElement = entry.marker.getElement();
      const labelElement = markerElement?.querySelector<HTMLElement>('.nt-police-station-label');
      if (!labelElement) continue;

      const point = map.latLngToContainerPoint(entry.marker.getLatLng());
      const width = Math.max(labelElement.offsetWidth, 64);
      const height = Math.max(labelElement.offsetHeight, 18);

      const left = point.x + 18;
      const top = point.y - 40;
      const rect = {
        left,
        right: left + width,
        top,
        bottom: top + height,
      };

      const overlaps = occupiedRects.some((occupied) => {
        return !(
          rect.right < occupied.left ||
          rect.left > occupied.right ||
          rect.bottom < occupied.top ||
          rect.top > occupied.bottom
        );
      });

      if (overlaps) {
        labelElement.classList.add('nt-police-station-label-hidden');
      } else {
        labelElement.classList.remove('nt-police-station-label-hidden');
        occupiedRects.push(rect);
      }
    }
  }, [selectedStation?.stationId]);

  const updateSelectedMarkerAnimations = useCallback(() => {
    const primaryStationId = stationSelection.primaryStation?.id ?? null;
    const secondaryStationId = stationSelection.secondaryStation?.id ?? null;
    const currentId = currentStationId ?? '';
    const currentName = currentStationName ?? '';

    for (const entry of stationMarkersRef.current) {
      const markerElement = entry.marker.getElement();
      if (!markerElement) continue;

      const isPrimary = entry.stationId === primaryStationId;
      const isSecondary = entry.stationId === secondaryStationId;
      const isCurrentStation =
        (currentId.length > 0 &&
          (isSameStation(entry.stationId, currentId) ||
            isSameStation(entry.stationName, currentId))) ||
        (currentName.length > 0 &&
          (isSameStation(entry.stationName, currentName) ||
            isSameStation(entry.stationId, currentName)));

      markerElement.classList.toggle('nt-police-station-selected', isPrimary || isSecondary);
      markerElement.classList.toggle('nt-police-station-selected-primary', isPrimary);
      markerElement.classList.toggle('nt-police-station-selected-secondary', isSecondary);
      markerElement.classList.toggle('nt-police-station-current', isCurrentStation);
    }
  }, [
    currentStationId,
    currentStationName,
    stationSelection.primaryStation?.id,
    stationSelection.secondaryStation?.id,
  ]);

  const isDarkTheme = (resolvedTheme ?? theme) === 'dark';

  useEffect(() => {
    setThemeMounted(true);
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (movingDotIntervalRef.current) {
        clearInterval(movingDotIntervalRef.current);
      }

      if (locateFeedbackTimeoutRef.current) {
        clearTimeout(locateFeedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearRouteSelection(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearRouteSelection]);

  useEffect(() => {
    let active = true;

    const loadBoundary = async () => {
      try {
        const response = await fetch('/maps/gwalior/doc.kml');
        if (!response.ok) return;

        const text = await response.text();
        if (!active) return;
        setGwaliorBoundary(parseKmlPolygonCoordinates(text));
      } catch {
        // Fallback to showing all stations if boundary cannot be loaded.
      }
    };

    void loadBoundary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPoliceStations = async () => {
      try {
        const response = await fetch('/maps/gwalior/Police_Station_doc.kml');
        if (!response.ok) return;

        const text = await response.text();
        if (!active) return;
        setPoliceStations(parsePoliceStationPlacemarks(text));
      } catch {
        // If loading fails, station pins are simply not drawn.
      }
    };

    void loadPoliceStations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const host = mapHostRef.current;
    if (!host) return;

    setMapError(null);

    // Ensure a clean host node before creating a new map instance.
    host.innerHTML = '';

    // Clear stale Leaflet container metadata from prior fast-refresh/strict remounts.
    const hostWithLeaflet = host as HTMLDivElement & { _leaflet_id?: number };
    if (hostWithLeaflet._leaflet_id) {
      hostWithLeaflet._leaflet_id = undefined;
    }

    let resizeObserver: ResizeObserver | null = null;
    let delayedInvalidate: ReturnType<typeof setTimeout> | null = null;
    let secondInvalidate: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | null = null;

    const initializeMap = async () => {
      try {
        const map = L.map(host, {
          zoomControl: false,
          preferCanvas: true,
          minZoom: 11,
          maxZoom: 19,
        }).setView([getMapCenter().lat, getMapCenter().lng], DEFAULT_MAP_ZOOM);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const bootWithDark = document.documentElement.classList.contains('dark');
        const initialTile = bootWithDark ? DARK_TILE : LIGHT_TILE;
        const tileLayer = L.tileLayer(initialTile.url, {
          attribution: initialTile.attribution,
          maxZoom: 19,
        });
        tileLayer.addTo(map);

        const stationLayer = L.layerGroup();
        const boundaryLayer = L.layerGroup();
        const routeLayer = L.layerGroup();
        map.addLayer(boundaryLayer);
        map.addLayer(routeLayer);
        map.addLayer(stationLayer);

        mapRef.current = map;
        tileLayerRef.current = tileLayer;
        stationLayerRef.current = stationLayer;
        boundaryLayerRef.current = boundaryLayer;
        routeLayerRef.current = routeLayer;
        setMapReady(true);

        const invalidate = () => map.invalidateSize({ pan: false, animate: false });
        requestAnimationFrame(invalidate);
        delayedInvalidate = setTimeout(invalidate, 120);
        secondInvalidate = setTimeout(invalidate, 450);

        const onWindowResize = () => invalidate();
        window.addEventListener('resize', onWindowResize);

        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(() => invalidate());
          resizeObserver.observe(host);
        }

        cleanup = () => {
          window.removeEventListener('resize', onWindowResize);
          resizeObserver?.disconnect();
          if (delayedInvalidate) clearTimeout(delayedInvalidate);
          if (secondInvalidate) clearTimeout(secondInvalidate);
          setMapReady(false);
          boundaryLayer.clearLayers();
          routeLayer.clearLayers();
          stationLayer.clearLayers();
          stationMarkersRef.current = [];
          map.remove();
          mapRef.current = null;
          tileLayerRef.current = null;
          stationLayerRef.current = null;
          boundaryLayerRef.current = null;
          routeLayerRef.current = null;
        };
      } catch {
        setMapReady(false);
        setMapError('Map failed to initialize. Please refresh the page.');
      }
    };

    void initializeMap();

    return () => {
      cleanup?.();
      resizeObserver?.disconnect();
      if (delayedInvalidate) clearTimeout(delayedInvalidate);
      if (secondInvalidate) clearTimeout(secondInvalidate);
    };
  }, []);

  useEffect(() => {
    if (!themeMounted) return;

    const map = mapRef.current;
    const currentTileLayer = tileLayerRef.current;
    if (!map || !currentTileLayer) return;

    const nextTile = isDarkTheme ? DARK_TILE : LIGHT_TILE;
    map.removeLayer(currentTileLayer);

    const replacement = L.tileLayer(nextTile.url, {
      attribution: nextTile.attribution,
      maxZoom: 19,
    });
    replacement.addTo(map);
    tileLayerRef.current = replacement;
  }, [isDarkTheme, themeMounted]);

  useEffect(() => {
    if (!mapReady || gwaliorBoundary.length < 3) return;

    const boundaryLayer = boundaryLayerRef.current;
    if (!boundaryLayer) return;

    boundaryLayer.clearLayers();

    L.polygon(gwaliorBoundary, {
      stroke: true,
      color: '#3b82f6',
      weight: 5,
      opacity: 0.18,
      fill: false,
      interactive: false,
      className: 'nt-gwalior-boundary-glow',
    }).addTo(boundaryLayer);

    L.polygon(gwaliorBoundary, {
      stroke: true,
      color: '#2563eb',
      weight: 2,
      opacity: 0.75,
      fill: true,
      fillColor: '#3b82f6',
      fillOpacity: 0.02,
      interactive: false,
      className: 'nt-gwalior-boundary-outline',
      dashArray: '12 10',
      lineJoin: 'round',
    }).addTo(boundaryLayer);
  }, [gwaliorBoundary, mapReady]);

  const stationVehicleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const station of policeStations) {
      const summary = getStationFleetSummary(station.id);
      counts.set(station.name, summary.total);
    }
    return counts;
  }, [policeStations]);

  useEffect(() => {
    const fromStation = stationSelection.primaryStation;
    const toStation = stationSelection.secondaryStation;
    if (!fromStation || !toStation) return;

    const abortController = new AbortController();

    const setRouteResult = (
      geometry: Array<[number, number]>,
      distanceKm: number,
      durationMinutes: number,
      sourceLabel: 'Flight path estimate' | 'Road route via OSRM'
    ) => {
      setStationSelection((current) => ({
        ...current,
        routeGeometry: geometry,
        routeDistance: distanceKm,
        routeDuration: durationMinutes,
        routeSourceLabel: sourceLabel,
        isLoadingRoute: false,
      }));
    };

    const loadRoute = async () => {
      setStationSelection((current) => ({
        ...current,
        routeGeometry: null,
        routeDistance: null,
        routeDuration: null,
        routeSourceLabel: null,
        isLoadingRoute: true,
      }));

      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${fromStation.coordinates.lng},${fromStation.coordinates.lat};` +
          `${toStation.coordinates.lng},${toStation.coordinates.lat}` +
          '?overview=full&geometries=geojson';

        const response = await fetch(url, {
          signal: abortController.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('OSRM request failed');
        }

        const payload = (await response.json()) as {
          routes?: Array<{
            distance: number;
            duration: number;
            geometry?: {
              coordinates: Array<[number, number]>;
            };
          }>;
        };

        const route = payload.routes?.[0];
        const roadGeometry = route?.geometry?.coordinates?.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        );

        if (!route || !roadGeometry || roadGeometry.length < 2) {
          throw new Error('OSRM route unavailable');
        }

        setRouteResult(
          roadGeometry,
          route.distance / 1000,
          route.duration / 60,
          'Road route via OSRM'
        );
      } catch {
        if (abortController.signal.aborted) return;

        const arcGeometry = buildFlightArcGeometry(fromStation, toStation);
        const distanceKm = haversineDistanceKm(fromStation, toStation);
        const durationMinutes = estimateDurationMinutes(distanceKm);
        setRouteResult(arcGeometry, distanceKm, durationMinutes, 'Flight path estimate');
      }
    };

    void loadRoute();

    return () => {
      abortController.abort();
    };
  }, [stationSelection.primaryStation, stationSelection.secondaryStation]);

  useEffect(() => {
    if (!mapReady) return;

    const routeLayer = routeLayerRef.current;
    if (!routeLayer) return;

    if (movingDotIntervalRef.current) {
      clearInterval(movingDotIntervalRef.current);
      movingDotIntervalRef.current = null;
    }

    movingRouteDotRef.current?.remove();
    movingRouteDotRef.current = null;
    routeInfoMarkerRef.current?.remove();
    routeInfoMarkerRef.current = null;

    routeLayer.clearLayers();

    const geometry = stationSelection.routeGeometry;
    if (!geometry || geometry.length < 2) return;

    const routeColor = isDarkTheme ? '#22d3ee' : '#2563eb';

    const routeLine = L.polyline(geometry, {
      color: routeColor,
      weight: 4,
      opacity: 0.95,
      dashArray: '10 10',
      className: 'nt-station-route-line',
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeLine.addTo(routeLayer);

    const midpoint = geometry[Math.floor(geometry.length / 2)];
    const sourceLabel = stationSelection.routeSourceLabel ?? 'Flight path estimate';
    const distanceLabel = `${(stationSelection.routeDistance ?? 0).toFixed(2)} km`;
    const durationLabel = `${Math.max(1, Math.round(stationSelection.routeDuration ?? 0))} min`;
    const routeBadge = L.divIcon({
      className: 'nt-route-badge-wrapper',
      html:
        `<div class="nt-route-badge" role="status" aria-live="polite">` +
        `<span>${distanceLabel}</span>` +
        `<span>${durationLabel}</span>` +
        `<span>${sourceLabel}</span>` +
        `</div>`,
      iconSize: [176, 58],
      iconAnchor: [88, 28],
    });
    routeInfoMarkerRef.current = L.marker(midpoint, {
      icon: routeBadge,
      interactive: false,
      keyboard: false,
    }).addTo(routeLayer);

    movingRouteDotRef.current = L.circleMarker(geometry[0], {
      radius: 5,
      color: '#ffffff',
      weight: 2,
      fillColor: routeColor,
      fillOpacity: 1,
      className: 'nt-route-moving-dot',
    }).addTo(routeLayer);

    let index = 0;
    movingDotIntervalRef.current = setInterval(() => {
      const dot = movingRouteDotRef.current;
      if (!dot) return;
      index = (index + 1) % geometry.length;
      dot.setLatLng(geometry[index]);
    }, 85);

    return () => {
      if (movingDotIntervalRef.current) {
        clearInterval(movingDotIntervalRef.current);
        movingDotIntervalRef.current = null;
      }
    };
  }, [
    isDarkTheme,
    mapReady,
    stationSelection.routeDistance,
    stationSelection.routeDuration,
    stationSelection.routeGeometry,
    stationSelection.routeSourceLabel,
  ]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      const original = event.originalEvent as MouseEvent | undefined;
      if (original?.shiftKey) {
        return;
      }

      clearRouteSelection(true);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [clearRouteSelection, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    const map = mapRef.current;
    if (!map) return;

    const refreshLabels = () => updateStationLabelVisibility();
    map.on('zoomend', refreshLabels);
    map.on('moveend', refreshLabels);

    requestAnimationFrame(refreshLabels);

    return () => {
      map.off('zoomend', refreshLabels);
      map.off('moveend', refreshLabels);
    };
  }, [mapReady, updateStationLabelVisibility]);

  useEffect(() => {
    updateSelectedMarkerAnimations();
  }, [updateSelectedMarkerAnimations]);

  useEffect(() => {
    if (!loggedInStation) return;

    setStationSelection((current) => {
      const alreadyPrimary = current.primaryStation?.id === loggedInStation.id;
      if (alreadyPrimary) {
        return current;
      }

      return {
        ...current,
        primaryStation: loggedInStation,
        secondaryStation: null,
        routeGeometry: null,
        routeDistance: null,
        routeDuration: null,
        routeSourceLabel: null,
        isLoadingRoute: false,
      };
    });
  }, [loggedInStation]);

  const visibleStations = useMemo(() => {
    const normalizedSearch = normalizeSearchText(localSearch);
    const searchTerms = normalizedSearch ? normalizedSearch.split(' ') : [];

    return policeStations.filter((station) => {
      const inBoundary =
        gwaliorBoundary.length < 3
          ? true
          : isPointInPolygon(station.coordinates.lat, station.coordinates.lng, gwaliorBoundary);

      if (!inBoundary) return false;
      if (searchTerms.length === 0) return true;

      const count = stationVehicleCounts.get(station.name) ?? 0;
      const searchTokens = getStationSearchTokens(station.name, count);

      return searchTerms.every((term) => searchTokens.some((token) => token.includes(term)));
    });
  }, [gwaliorBoundary, localSearch, policeStations, stationVehicleCounts]);

  useEffect(() => {
    if (!mapReady) return;

    const stationLayer = stationLayerRef.current;
    const map = mapRef.current;
    if (!stationLayer || !map) return;

    stationLayer.clearLayers();
    const createdMarkers: StationMarkerEntry[] = [];

    for (const station of visibleStations) {
      const count = stationVehicleCounts.get(station.name) ?? 0;
      const stationMarker = L.marker([station.coordinates.lat, station.coordinates.lng], {
        icon: buildPoliceStationIcon(station.name, count),
        keyboard: true,
        title: `${station.name}`,
      });

      stationMarker.on('click', (event) => {
        if ('originalEvent' in event && event.originalEvent) {
          L.DomEvent.stopPropagation(event.originalEvent as Event);
        }

        const originalEvent =
          'originalEvent' in event && event.originalEvent
            ? (event.originalEvent as MouseEvent)
            : null;
        const isShiftClick = Boolean(originalEvent?.shiftKey);

        const isLoggedInStation = Boolean(loggedInStation && loggedInStation.id === station.id);

        if (isShiftClick) {
          if (loggedInStation) {
            if (!isLoggedInStation) {
              setStationSelection((current) => ({
                ...current,
                primaryStation: loggedInStation,
                secondaryStation: station,
              }));
              updateSelectedStationPanel(station);
            }
          } else if (
            stationSelection.primaryStation &&
            stationSelection.primaryStation.id !== station.id
          ) {
            setStationSelection((current) => ({
              ...current,
              secondaryStation: station,
            }));
            updateSelectedStationPanel(station);
          }
        } else {
          setStationSelection((current) => {
            if (loggedInStation) {
              return {
                ...current,
                primaryStation: loggedInStation,
                secondaryStation: null,
                routeGeometry: null,
                routeDistance: null,
                routeDuration: null,
                routeSourceLabel: null,
                isLoadingRoute: false,
              };
            }

            return {
              ...current,
              primaryStation: station,
              secondaryStation: null,
              routeGeometry: null,
              routeDistance: null,
              routeDuration: null,
              routeSourceLabel: null,
              isLoadingRoute: false,
            };
          });
          updateSelectedStationPanel(station);
        }

        const nextZoom = Math.min(map.getZoom() + 0.8, 17);
        map.flyTo([station.coordinates.lat, station.coordinates.lng], nextZoom, {
          animate: true,
          duration: 0.55,
          easeLinearity: 0.3,
        });
      });

      stationMarker.bindTooltip(`${station.name} | Parked: ${count}`, {
        direction: 'top',
        offset: [0, -44],
      });

      stationLayer.addLayer(stationMarker);
      createdMarkers.push({
        stationId: station.id,
        stationName: station.name,
        marker: stationMarker,
      });
    }

    stationMarkersRef.current = createdMarkers;
    requestAnimationFrame(() => updateStationLabelVisibility());
    requestAnimationFrame(() => updateSelectedMarkerAnimations());

    if (localSearch.trim().length > 0 && visibleStations.length > 0) {
      if (visibleStations.length === 1) {
        const [station] = visibleStations;
        map.flyTo([station.coordinates.lat, station.coordinates.lng], Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 0.45,
          easeLinearity: 0.3,
        });
      } else {
        const bounds = L.latLngBounds(
          visibleStations.map(
            (station) => [station.coordinates.lat, station.coordinates.lng] as const
          )
        );
        map.fitBounds(bounds.pad(0.12), { animate: true, duration: 0.45 });
      }
    }
  }, [
    loggedInStation,
    localSearch,
    mapReady,
    stationSelection.primaryStation,
    stationVehicleCounts,
    updateSelectedStationPanel,
    updateSelectedMarkerAnimations,
    updateStationLabelVisibility,
    visibleStations,
  ]);

  const handleLocateMe = () => {
    const map = mapRef.current;
    if (!map) return;

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showLocateFeedback('Location is not supported in this browser.');
      return;
    }

    if (!window.isSecureContext) {
      showLocateFeedback('Location requires HTTPS or localhost.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latLng = L.latLng(coords.latitude, coords.longitude);

        if (myLocationMarkerRef.current) {
          myLocationMarkerRef.current.remove();
        }

        myLocationMarkerRef.current = L.circleMarker(latLng, {
          radius: 7,
          color: '#1d4ed8',
          weight: 2,
          fillColor: '#2563eb',
          fillOpacity: 0.92,
        }).addTo(map);

        map.flyTo(latLng, Math.max(map.getZoom(), 14), {
          duration: 0.7,
        });

        const hasDesktopPanel = Boolean(selectedStation) && window.innerWidth >= 768;
        if (hasDesktopPanel) {
          const panelCompensationX = -190;
          map.once('moveend', () => {
            map.panBy([panelCompensationX, 0], {
              animate: true,
              duration: 0.35,
              easeLinearity: 0.3,
            });
          });
        }

        setIsLocating(false);
        showLocateFeedback('Centered on your location.');
      },
      (error) => {
        setIsLocating(false);

        if (error.code === error.PERMISSION_DENIED) {
          showLocateFeedback('Location permission denied. Allow location access and try again.');
          return;
        }

        if (error.code === error.TIMEOUT) {
          showLocateFeedback('Location timed out. Try again in an open-sky area.');
          return;
        }

        showLocateFeedback('Unable to detect location right now.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Overlay Controls */}
      <div className="absolute left-4 top-4 z-[600] flex flex-col gap-3">
        {showSearchOverlay ? (
          <div className="relative w-80 rounded-lg border border-gray-200 bg-white/95 shadow-lg backdrop-blur-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search police station..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full rounded-lg border-0 bg-transparent px-10 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Search police stations"
            />
          </div>
        ) : null}

        {stationSelection.primaryStation ? (
          <p className="max-w-xs rounded-md border border-gray-300 bg-white/95 px-2.5 py-1.5 text-xs text-gray-800 shadow-md">
            {stationSelection.secondaryStation
              ? `Connected: ${stationSelection.primaryStation.name} to ${stationSelection.secondaryStation.name}`
              : `Selected: ${stationSelection.primaryStation.name}. Shift+Click any other station to connect route.`}
          </p>
        ) : null}

        {stationSelection.isLoadingRoute ? (
          <p
            className="w-fit rounded-md border border-blue-200 bg-white/95 px-2.5 py-1.5 text-xs text-blue-700 shadow-md"
            role="status"
            aria-live="polite"
          >
            Calculating route...
          </p>
        ) : null}
      </div>

      {/* Map */}
      <div
        ref={mapHostRef}
        className="nt-map-canvas h-full w-full"
        role="region"
        aria-label="Automobile seized vehicles parking map"
      />

      <div className="absolute bottom-28 right-2 z-[640] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70',
            isLocating && 'ring-2 ring-blue-400'
          )}
          aria-label={isLocating ? 'Finding my location' : 'Go to my location'}
          title={isLocating ? 'Finding location...' : 'My location'}
        >
          {isLocating ? (
            <span
              className="absolute inline-flex h-5 w-5 animate-ping rounded-full bg-blue-400/45"
              aria-hidden
            />
          ) : null}
          <LocateFixed
            className={cn('relative h-4 w-4', isLocating && 'animate-spin')}
            aria-hidden
          />
        </button>

        {onFullscreenToggle ? (
          <button
            type="button"
            onClick={onFullscreenToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-md transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isFullscreen ? 'Exit fullscreen map' : 'Enter fullscreen map'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}

        {locateFeedback ? (
          <p
            className="max-w-[220px] rounded-md border border-border bg-card/95 px-2 py-1 text-right text-[11px] text-foreground shadow-md"
            role="status"
            aria-live="polite"
          >
            {locateFeedback}
          </p>
        ) : null}
      </div>

      {mapError ? (
        <div className="absolute inset-0 z-[650] flex items-center justify-center bg-background/90 p-4">
          <div className="card-elevated max-w-md rounded-lg p-4 text-center">
            <p className="text-sm font-semibold text-foreground">Map unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      ) : null}

      <PoliceStationPanel
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
        bookingCtaLabel={
          selectedStation &&
          loggedInStation &&
          isSameStation(selectedStation.stationId, loggedInStation.id)
            ? 'Open Inventory'
            : stationSelection.primaryStation && stationSelection.secondaryStation
              ? 'Continue'
              : undefined
        }
        bookingCtaPulse={Boolean(
          stationSelection.primaryStation && stationSelection.secondaryStation
        )}
        onBookVehicle={(stationId) => {
          if (
            selectedStation &&
            loggedInStation &&
            isSameStation(selectedStation.stationId, loggedInStation.id)
          ) {
            const inventoryStationId = (currentStationId ?? '').trim() || loggedInStation.id;
            router.push(`/automobiles/vehicles/${encodeURIComponent(inventoryStationId)}?manage=1`);
            return;
          }

          if (
            stationSelection.primaryStation &&
            stationSelection.secondaryStation &&
            stationSelection.routeDistance !== null &&
            stationSelection.routeDuration !== null
          ) {
            const query = encodeBookingParams(
              stationSelection.primaryStation,
              stationSelection.secondaryStation,
              stationSelection.routeDistance,
              stationSelection.routeDuration,
              stationSelection.routeSourceLabel ?? 'Road route via OSRM'
            );
            router.push(`/automobiles/bookings?${query}`);
            return;
          }

          const selectedStationIdentifier = selectedStation?.stationName ?? stationId;

          if (onBookVehicle) {
            onBookVehicle(selectedStationIdentifier);
          }
        }}
      />
    </div>
  );
}
