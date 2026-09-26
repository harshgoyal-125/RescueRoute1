import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, AlertCircle, Info, ExternalLink } from 'lucide-react';

/**
 * Validates and extracts [latitude, longitude] from diverse data formats:
 * - { latitude, longitude }
 * - { lat, lng }
 * - GeoJSON { coordinates: [longitude, latitude] }
 * - Nested GeoJSON { location: { coordinates: [longitude, latitude] } }
 */
export function extractCoordinates(item) {
  if (!item) return null;

  let lat = null;
  let lng = null;

  if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
    lat = item.latitude;
    lng = item.longitude;
  } else if (typeof item.lat === 'number' && typeof item.lng === 'number') {
    lat = item.lat;
    lng = item.lng;
  } else if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
    // GeoJSON order: [longitude, latitude]
    lng = Number(item.coordinates[0]);
    lat = Number(item.coordinates[1]);
  } else if (item.location?.coordinates && Array.isArray(item.location.coordinates) && item.location.coordinates.length === 2) {
    lng = Number(item.location.coordinates[0]);
    lat = Number(item.location.coordinates[1]);
  }

  // Strict coordinate boundary validation
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng };
  }

  return null;
}

/**
 * Creates custom SVG pin icons for different food rescue roles.
 */
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function createCustomPin(type = 'default') {
  let bg = '#15803d'; // primary green
  let border = '#166534';
  let symbol = '📍';

  const lower = (type || '').toLowerCase();
  if (lower.includes('pickup') || lower.includes('donation')) {
    bg = '#16a34a'; // green for donation pickup
    border = '#14532d';
    symbol = '🥗';
  } else if (lower.includes('shelter') || lower.includes('destination')) {
    bg = '#2563eb'; // blue for shelter
    border = '#1e40af';
    symbol = '🏠';
  } else if (lower.includes('driver')) {
    bg = '#d97706'; // amber for driver
    border = '#92400e';
    symbol = '🚐';
  } else if (lower.includes('request')) {
    bg = '#dc2626'; // red for community food request
    border = '#991b1b';
    symbol = '🆘';
  }

  const html = `
    <div style="
      background-color: ${bg};
      border: 2px solid #ffffff;
      outline: 2px solid ${border};
      color: #ffffff;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: 15px; line-height: 1;">${symbol}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-rescue-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
}

/**
 * Reusable Leaflet + OpenStreetMap map component for RescueRoute.
 * - 100% Free & Open-Source (OpenStreetMap tiles + Leaflet)
 * - Zero Google Maps API keys or paid routing dependencies
 * - Graceful handling of loading, empty, invalid coords, and headless test environments
 */
export default function RescueRouteMap({
  markers = [],
  center,
  zoom = 13,
  showLine = false,
  lineLabel = 'Direct transit corridor (non-turn-by-turn)',
  height = '380px',
  title,
  subtitle,
  className = '',
  style = {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Filter out any markers without valid coordinates
  const validMarkers = (markers || [])
    .map((m) => {
      const coords = extractCoordinates(m);
      return coords ? { ...m, ...coords } : null;
    })
    .filter(Boolean);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // In testing or server environments where DOM/Leaflet fails
    try {
      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: First valid marker, provided center, or a neutral global view
      const defaultCenter =
        validMarkers.length > 0
          ? [validMarkers[0].lat, validMarkers[0].lng]
          : center || [20, 0];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: false
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles with proper attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add markers
      const markerGroup = L.featureGroup();
      const pointsForLine = [];

      validMarkers.forEach((m) => {
        const pin = createCustomPin(m.type);
        const marker = L.marker([m.lat, m.lng], { icon: pin }).addTo(markerGroup);

        pointsForLine.push([m.lat, m.lng]);

        // Rich HTML popup
        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
            <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 2px;">
              ${escapeHtml(m.title || 'Rescue Location')}
            </strong>
            ${m.subtitle ? `<span style="color: #475569; font-weight: 600; display: block; margin-bottom: 4px;">${escapeHtml(m.subtitle)}</span>` : ''}
            ${m.address ? `<div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">📍 ${escapeHtml(m.address)}</div>` : ''}
            <span style="
              display: inline-block;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 2px 6px;
              background-color: #f1f5f9;
              border-radius: 4px;
              color: #334155;
            ">
              ${escapeHtml(m.type || 'Location')}
            </span>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      markerGroup.addTo(map);

      // Draw connecting transit line if requested and 2 or more markers exist
      if (showLine && pointsForLine.length >= 2) {
        try {
          L.polyline(pointsForLine, {
            color: '#16a34a',
            weight: 3,
            dashArray: '6, 8',
            opacity: 0.85
          }).addTo(map);
        } catch (lineErr) {
          // Headless environments (like JSDOM) lack native SVG rendering
          console.warn('[RescueRouteMap]: Vector line skipped in headless DOM:', lineErr.message);
        }
      }

      // Automatically fit bounds if multiple markers exist
      if (validMarkers.length > 1) {
        map.fitBounds(markerGroup.getBounds(), { padding: [40, 40], maxZoom: 15 });
      }

      setIsLoading(false);
    } catch (err) {
      console.warn('[RescueRouteMap]: Leaflet mount notice:', err);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      } catch {
        mapInstanceRef.current = null;
      }
    };
  }, [markers.length, showLine, zoom]);

  // Map state handlers
  if (hasError) {
    return (
      <div
        className="map-error-fallback"
        data-testid="map-error"
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--slate-100)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
          color: 'var(--slate-600)',
          padding: '1.5rem',
          textAlign: 'center',
          ...style
        }}
      >
        <AlertCircle size={28} style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }} />
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-800)', marginBottom: '0.25rem' }}>
          The map could not be loaded.
        </h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', maxWidth: '320px' }}>
          Interactive tiles could not be initialized in this view. Logistics operations remain fully functional.
        </p>
      </div>
    );
  }

  if (validMarkers.length === 0) {
    return (
      <div
        className="map-empty-state"
        data-testid="map-empty"
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--slate-50)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)',
          color: 'var(--slate-500)',
          padding: '1.5rem',
          textAlign: 'center',
          ...style
        }}
      >
        <MapPin size={28} style={{ color: 'var(--slate-400)', marginBottom: '0.5rem' }} />
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.25rem' }}>
          No locations available.
        </h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', maxWidth: '320px' }}>
          No geographic coordinates are registered for this item.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rescue-route-map-wrapper ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }}
      data-testid="rescue-route-map"
    >
      {(title || subtitle) && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--slate-100)',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            {title && (
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {title}
              </h4>
            )}
            {subtitle && (
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              backgroundColor: 'var(--primary-50)',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)'
            }}
          >
            OpenStreetMap Tiles
          </span>
        </div>
      )}

      {/* Map Interactive Canvas */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height,
          position: 'relative',
          backgroundColor: '#f1f5f9'
        }}
        data-testid="map-canvas"
      />

      {/* Map Legend & Non-Turn-by-Turn Routing Transparency Notice */}
      <div
        style={{
          padding: '0.5rem 0.875rem',
          backgroundColor: 'var(--slate-50)',
          borderTop: '1px solid var(--slate-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--slate-600)'
        }}
        data-testid="map-legend"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {showLine && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-700)', fontWeight: 600 }}>
              <Navigation size={13} />
              <span>{lineLabel}</span>
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--slate-500)' }}>
            <Info size={12} />
            <span>Visualization only &bull; No paid routing or live traffic</span>
          </span>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
          Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>OpenStreetMap</a>
        </div>
      </div>
    </div>
  );
}
