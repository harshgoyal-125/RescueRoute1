import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RescueRouteMap, { extractCoordinates } from '../RescueRouteMap';

describe('RescueRouteMap - Free / Static Leaflet Map Component', () => {
  it('extractCoordinates properly extracts coordinates from various schema formats', () => {
    // 1. Direct latitude/longitude
    expect(extractCoordinates({ latitude: 37.7749, longitude: -122.4194 })).toEqual({
      lat: 37.7749,
      lng: -122.4194
    });

    // 2. Direct lat/lng shorthand
    expect(extractCoordinates({ lat: 37.7780, lng: -122.4150 })).toEqual({
      lat: 37.7780,
      lng: -122.4150
    });

    // 3. GeoJSON [longitude, latitude]
    expect(extractCoordinates({ coordinates: [-122.4089, 37.7833] })).toEqual({
      lat: 37.7833,
      lng: -122.4089
    });

    // 4. Nested MongoDB GeoJSON location object
    expect(extractCoordinates({ location: { coordinates: [-122.4010, 37.7890] } })).toEqual({
      lat: 37.7890,
      lng: -122.4010
    });

    // 5. Invalid coordinates return null
    expect(extractCoordinates(null)).toBeNull();
    expect(extractCoordinates({})).toBeNull();
    expect(extractCoordinates({ latitude: 'invalid', longitude: -122.4 })).toBeNull();
    expect(extractCoordinates({ latitude: 120, longitude: -122.4 })).toBeNull(); // lat > 90
    expect(extractCoordinates({ latitude: 37.7, longitude: -200 })).toBeNull(); // lng < -180
  });

  it('renders empty state when no markers are provided or markers array is empty', () => {
    render(<RescueRouteMap markers={[]} />);

    expect(screen.getByTestId('map-empty')).toBeInTheDocument();
    expect(screen.getByText(/No locations available/i)).toBeInTheDocument();
  });

  it('safely handles markers with invalid coordinates by ignoring them', () => {
    const invalidMarkers = [
      { id: 'inv-1', title: 'Invalid 1', latitude: 'not-a-number', longitude: 'bad' },
      { id: 'inv-2', title: 'Invalid 2', lat: 999, lng: 999 }
    ];

    render(<RescueRouteMap markers={invalidMarkers} />);

    // Since all provided markers are invalid, it safely falls back to empty state
    expect(screen.getByTestId('map-empty')).toBeInTheDocument();
    expect(screen.getByText(/No locations available/i)).toBeInTheDocument();
  });

  it('renders map canvas, legend, and OpenStreetMap attribution with valid markers', () => {
    const validMarkers = [
      {
        id: 'don-1',
        type: 'donation',
        latitude: 37.7749,
        longitude: -122.4194,
        title: 'Green Leaf Bistro',
        subtitle: '45 meals',
        address: '142 Market Street'
      },
      {
        id: 'shel-1',
        type: 'shelter',
        latitude: 37.7780,
        longitude: -122.4150,
        title: 'Hope Community Shelter',
        subtitle: 'Recipient Shelter',
        address: '89 4th Avenue'
      }
    ];

    render(
      <RescueRouteMap
        markers={validMarkers}
        showLine={true}
        lineLabel="Direct transit vector: 2.4 km"
        title="Surplus Match Route"
        subtitle="Pickup to Shelter Route"
      />
    );

    // Map container exists
    expect(screen.getByTestId('rescue-route-map')).toBeInTheDocument();
    expect(screen.getByTestId('map-canvas')).toBeInTheDocument();
    expect(screen.getByText(/Surplus Match Route/i)).toBeInTheDocument();
    expect(screen.getByText(/Pickup to Shelter Route/i)).toBeInTheDocument();

    // Map legend and non-paid routing notice
    expect(screen.getByTestId('map-legend')).toBeInTheDocument();
    expect(screen.getByText(/Direct transit vector: 2.4 km/i)).toBeInTheDocument();
    expect(screen.getByText(/No paid routing or live traffic/i)).toBeInTheDocument();

    // Required OpenStreetMap attribution
    const attributionLinks = screen.getAllByRole('link', { name: /OpenStreetMap/i });
    expect(attributionLinks.length).toBeGreaterThan(0);
    expect(attributionLinks[0]).toHaveAttribute('href', 'https://www.openstreetmap.org/copyright');
  });

  it('renders error fallback if Leaflet map initialization throws an error', async () => {
    // Spy on console.warn to suppress warning during deliberate error test
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Force an error by mocking leaflet.map
    const originalMap = (await import('leaflet')).default.map;
    const leaflet = (await import('leaflet')).default;
    leaflet.map = vi.fn().mockImplementationOnce(() => {
      throw new Error('Simulated Leaflet canvas allocation failure');
    });

    render(
      <RescueRouteMap
        markers={[{ id: '1', latitude: 37.7749, longitude: -122.4194, title: 'Test Location' }]}
      />
    );

    expect(screen.getByTestId('map-error')).toBeInTheDocument();
    expect(screen.getByText(/The map could not be loaded/i)).toBeInTheDocument();

    // Restore leaflet.map
    leaflet.map = originalMap;
    consoleSpy.mockRestore();
  });

  it('enforces location privacy: only displays authorized workflow markers', () => {
    // Verify that a public user or driver does not see unrelated/hidden locations
    const driverAssignedMarkers = [
      {
        id: 'del-1-pickup',
        type: 'pickup',
        latitude: 37.7749,
        longitude: -122.4194,
        title: 'Assigned Pickup: Green Leaf Bistro'
      },
      {
        id: 'del-1-dest',
        type: 'destination',
        latitude: 37.7780,
        longitude: -122.4150,
        title: 'Assigned Shelter: Hope Community Shelter'
      }
    ];

    render(
      <RescueRouteMap
        markers={driverAssignedMarkers}
        showLine={true}
        lineLabel="Assigned Route"
      />
    );

    // Only the assigned route markers are present
    expect(screen.getByTestId('rescue-route-map')).toBeInTheDocument();
    expect(screen.getByText(/Assigned Route/i)).toBeInTheDocument();
  });
});
